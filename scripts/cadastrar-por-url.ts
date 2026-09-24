import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../src/lib/prisma';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';

async function fetchWithBrowserHeaders(url: string): Promise<{ status: number; html: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    const status = res.status;
    const html = await res.text();
    return { status, html };
  } catch (err: any) {
    return { status: 0, html: '', error: err.message };
  }
}

async function downloadImage(imgUrl: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

export async function processUrl(url: string) {
  console.log(`\n================================================================`);
  console.log(`🌐 INGESTÃO DIRETA POR URL`);
  console.log(`🔗 Alvo: ${url}`);
  console.log(`================================================================\n`);

  console.log('📡 Conectando ao website oficial do fabricante...');
  const { status, html, error } = await fetchWithBrowserHeaders(url);

  if (error) {
    console.error(`❌ Erro de conexão com a URL: ${error}`);
    return;
  }

  // Detecta bloqueios de WAF / Cloudflare
  if (status === 403 || /challenges\.cloudflare\.com|cloudflare-static/i.test(html)) {
    console.warn(`\n⚠️ BLOQUEIO DE ROBÔ DETECTADO (Status HTTP ${status} - Cloudflare Challenge)`);
    console.warn(`O site do fabricante possui proteção de firewall que barra requisições automatizadas.`);
    console.log(`\n💡 SOLUÇÃO SIMPLES E INFALÍVEL EM 1 PASSO:`);
    console.log(`1. Abra o link no seu navegador (o seu Chrome já está autenticado no Cloudflare).`);
    console.log(`2. Pressione Ctrl + S (ou use o Bookmarklet PetRankings).`);
    console.log(`3. Salve o arquivo como "Página da Web, Somente HTML" na pasta:`);
    console.log(`   📁 produtos_cadastro/`);
    console.log(`4. Em seguida, execute no terminal:`);
    console.log(`   👉 npm run cadastrar-produtos\n`);
    return;
  }

  if (status !== 200 || !html) {
    console.error(`❌ O servidor retornou status HTTP ${status} sem conteúdo legível.`);
    return;
  }

  console.log(`✅ Página carregada com sucesso (HTML: ${(html.length / 1024).toFixed(1)} KB).`);
  console.log('🔍 Extraindo metadados, níveis de garantia e composição do DOM...');

  const meta = parseProductFromHtml(html, url);

  if (!meta.commercialName) {
    console.error(`❌ Não foi possível identificar o nome comercial do produto no HTML.`);
    return;
  }

  console.log(`\n📦 Produto: "${meta.commercialName}"`);
  console.log(`🏷️ Marca: ${meta.brand} | Espécie: ${meta.species} | Fase: ${meta.lifeStage} | Formato: ${meta.foodType}`);
  console.log(`⚖️ Categoria Legal: ${meta.legalCategory} ${meta.coadjuvanteCondition ? `(Condição: ${meta.coadjuvanteCondition})` : ''}`);
  console.log(`🥗 Ingredientes identificados: ${meta.topIngredientsList.length}`);
  console.log(`   #1: ${meta.topIngredientsList[0] || 'N/D'}`);

  // Verifica se o produto já existe (busca por URL oficial ou por slug)
  const normalizedUrl = url.trim().replace(/\/$/, '');
  const existing = await prisma.product.findFirst({
    where: {
      OR: [
        { sourceUrl: url },
        { sourceUrl: normalizedUrl },
        { sourceUrl: normalizedUrl + '/' },
        { slug: meta.slug },
      ],
    },
  });

  const targetSlug = existing ? existing.slug : meta.slug;
  const productId = existing ? existing.id : 'cmtz' + crypto.randomBytes(10).toString('hex');
  if (existing) {
    console.log(`🔄 Produto já cadastrado detectado no catálogo! ID: "${productId}" | Slug: "${targetSlug}"`);
    console.log(`   Atualizando dados oficiais com a nova extração web e gerando Ficha Técnica HTML atualizada...`);
  } else {
    console.log(`✨ Novo produto identificado. Criando registro no catálogo (ID: "${productId}")...`);
  }

  // Destinos em public/uploads/
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destHtmlRel = `/uploads/ficha_${productId}.html`;

  let destImgRel = existing?.frontLabelImageUrl || `/uploads/produto_${productId}.webp`;
  if (meta.imageUrl) {
    const destImgPath = path.join(process.cwd(), 'public', destImgRel);
    console.log(`🖼️ Baixando packshot oficial em alta resolução (${meta.imageUrl})...`);
    const imgOk = await downloadImage(meta.imageUrl, destImgPath);
    if (!imgOk) {
      console.warn('⚠️ Falha ao baixar imagem remota, mantendo referência existente.');
    } else {
      console.log(`✅ Imagem salva em: public${destImgRel}`);
    }
  }

  // 6. Cálculo da Avaliação Nutricional (Score Determinístico)
  const audit = calcularScoreAnaliseRotulo(
    meta.species as any,
    meta.lifeStage as any,
    {
      umidadeMaxPct: meta.umidadeMaxPct,
      proteinaBrutaMinPct: meta.proteinaBrutaMinPct,
      extratoEtereoMinPct: meta.extratoEtereoMinPct,
      materiaFibrosaMaxPct: meta.materiaFibrosaMaxPct,
      materiaMineralMaxPct: meta.materiaMineralMaxPct,
      calcioMinPct: meta.calcioMinPct,
      calcioMaxPct: meta.calcioMaxPct,
      fosforoMinPct: meta.fosforoMinPct,
      sodioMinPct: meta.sodioMinPct,
      omega3MinPct: meta.omega3MinPct,
    },
    {
      topIngredientes: meta.topIngredientsList,
      antioxidanteTipo: meta.antioxidantType as any,
      omega3OuPrebioticosGarantidos: true,
      claimCarneTipo: 'COM_CARNE_FRESCA',
    },
    meta.foodType as any
  );

  const isCoadjuvante = meta.legalCategory === 'ALIMENTO_COADJUVANTE';
  const isComplementar = meta.legalCategory === 'ALIMENTO_COMPLEMENTAR';

  const finalScoreTotal = isCoadjuvante || isComplementar ? null : audit.scoreTotal;
  const finalClassificationTier = isCoadjuvante
    ? 'COADJUVANTE'
    : isComplementar
    ? 'COMPLEMENTAR'
    : audit.classificacaoFaixa;

  const finalScoreBreakdown = isComplementar
    ? [
        {
          pilar: 'Classificação Legal MAPA',
          pontos_obtidos: 0,
          pontos_max: 0,
          justificativa:
            'Alimento Específico / Complementar: Produto formulado como agrado, petisco ou hidratação suplementar. Não possui suplementação vitamínico-mineral completa de uso exclusivo, devendo ser oferecido em conjunto com a alimentação diária balanceada.',
        },
      ]
    : audit.extratoPontos;

  console.log(`📊 Score: ${finalScoreTotal ?? 'N/A'} (${finalClassificationTier})`);

  // 7. Parecer Editorial com Gemini AI
  console.log(`🤖 Gerando parecer editorial técnico via Gemini AI...`);
  const editorialOpinion = await generateEditorialOpinionWithGemini({
    commercialName: meta.commercialName,
    brand: meta.brand,
    species: meta.species,
    lifeStage: meta.lifeStage,
    foodType: meta.foodType,
    legalCategory: meta.legalCategory,
    coadjuvanteCondition: meta.coadjuvanteCondition,
    proteinaBrutaMinPct: meta.proteinaBrutaMinPct,
    energiaMetabolizavelKcalKg: meta.energiaMetabolizavelKcalKg,
    antioxidantType: meta.antioxidantType,
    containsGmo: meta.containsGmo,
    topIngredients: meta.topIngredientsList,
    scoreTotal: finalScoreTotal,
    classificationTier: finalClassificationTier,
    extratoPontos: audit.extratoPontos,
    calcioMinPct: meta.calcioMinPct,
    calcioMaxPct: meta.calcioMaxPct,
    fosforoMinPct: meta.fosforoMinPct,
    umidadeMaxPct: meta.umidadeMaxPct,
    extratoEtereoMinPct: meta.extratoEtereoMinPct,
  });

  // 7.1. Arquivamento do Código-Fonte HTML Original para Custódia Probatória
  const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);
  fs.writeFileSync(destHtmlPath, html, 'utf-8');
  console.log(`📄 Código-Fonte HTML Original Arquivado para Custódia: public${destHtmlRel}`);

  // 8. Upsert no Banco de Dados
  await prisma.product.upsert({
    where: { slug: targetSlug },
    update: {
      commercialName: meta.commercialName,
      brand: meta.brand,
      manufacturerLegalName: meta.manufacturerLegalName,
      legalCategory: meta.legalCategory,
      species: meta.species,
      lifeStage: meta.lifeStage,
      breedSize: meta.breedSize,
      foodType: meta.foodType,
      coadjuvanteCondition: meta.coadjuvanteCondition,
      sourceUrl: meta.sourceUrl,
      sourceDocumentUrl: destHtmlRel,
      frontLabelImageUrl: destImgRel,
      analyzedBatch: 'LOTE-WEB-INGESTION',
      labelCollectionDate: new Date(),
      curatorResponsible: 'Ingestão Automática Web',

      moistureMaxPct: meta.umidadeMaxPct,
      crudeProteinMinPct: meta.proteinaBrutaMinPct,
      etherExtractMinPct: meta.extratoEtereoMinPct,
      crudeFiberMaxPct: meta.materiaFibrosaMaxPct,
      mineralMatterMaxPct: meta.materiaMineralMaxPct,
      calciumMinPct: meta.calcioMinPct,
      calciumMaxPct: meta.calcioMaxPct,
      phosphorusMinPct: meta.fosforoMinPct,
      sodiumMinPct: meta.sodioMinPct,
      omega3MinPct: meta.omega3MinPct,

      meatClaimType: 'COM_CARNE',
      containsGmo: meta.containsGmo,
      gmoIngredients: meta.gmoIngredients,
      antioxidantType: meta.antioxidantType,
      topIngredients: JSON.stringify(meta.topIngredientsList),
      editorialOpinion,

      scoreTotal: finalScoreTotal,
      classificationTier: finalClassificationTier,
      scoreBreakdown: finalScoreBreakdown,
      calculatedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      id: productId,
      slug: targetSlug,
      commercialName: meta.commercialName,
      brand: meta.brand,
      manufacturerLegalName: meta.manufacturerLegalName,
      legalCategory: meta.legalCategory,
      species: meta.species,
      lifeStage: meta.lifeStage,
      breedSize: meta.breedSize,
      foodType: meta.foodType,
      coadjuvanteCondition: meta.coadjuvanteCondition,
      sourceUrl: meta.sourceUrl,
      sourceDocumentUrl: destHtmlRel,
      frontLabelImageUrl: destImgRel,
      analyzedBatch: 'LOTE-WEB-INGESTION',
      labelCollectionDate: new Date(),
      curatorResponsible: 'Ingestão Automática Web',

      moistureMaxPct: meta.umidadeMaxPct,
      crudeProteinMinPct: meta.proteinaBrutaMinPct,
      etherExtractMinPct: meta.extratoEtereoMinPct,
      crudeFiberMaxPct: meta.materiaFibrosaMaxPct,
      mineralMatterMaxPct: meta.materiaMineralMaxPct,
      calciumMinPct: meta.calcioMinPct,
      calciumMaxPct: meta.calcioMaxPct,
      phosphorusMinPct: meta.fosforoMinPct,
      sodiumMinPct: meta.sodioMinPct,
      omega3MinPct: meta.omega3MinPct,

      meatClaimType: 'COM_CARNE',
      containsGmo: meta.containsGmo,
      gmoIngredients: meta.gmoIngredients,
      antioxidantType: meta.antioxidantType,
      topIngredients: JSON.stringify(meta.topIngredientsList),
      editorialOpinion,

      scoreTotal: finalScoreTotal,
      classificationTier: finalClassificationTier,
      scoreBreakdown: finalScoreBreakdown,
      calculatedAt: new Date(),
    },
  });

  console.log(`\n🎉 PRODUTO CADASTRADO / ATUALIZADO COM SUCESSO!`);
  console.log(`👉 Visualizar no Portal: http://localhost:3000/produto/${targetSlug}\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const targetUrl = args[0];

  if (targetUrl && targetUrl.startsWith('http')) {
    await processUrl(targetUrl);
    return;
  }

  // Se não passou URL via CLI, verifica arquivo de lote (prioriza produtos_cadastro/urls_cadastro.txt)
  const candidateBatchFiles = [
    path.join(process.cwd(), 'produtos_cadastro', 'urls_cadastro.txt'),
    path.join(process.cwd(), 'scripts', 'data', 'urls_cadastro.txt'),
  ];
  const batchFile = candidateBatchFiles.find((f) => fs.existsSync(f));

  if (batchFile) {
    const content = fs.readFileSync(batchFile, 'utf-8');
    const urls = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'));

    if (urls.length > 0) {
      console.log(`📁 Encontradas ${urls.length} URLs no arquivo "${path.relative(process.cwd(), batchFile)}".`);
      for (const u of urls) {
        await processUrl(u);
      }
      const template = `# ==============================================================================
# PetRankings — Cadastro em Lote por URL
# ==============================================================================
# Cole aqui as URLs oficiais das páginas de produtos que deseja cadastrar.
# Uma URL por linha (linhas iniciadas com # são ignoradas).
`;
      fs.writeFileSync(batchFile, template, 'utf-8');
      console.log(`\n✅ URLs processadas com sucesso! Arquivo "${path.relative(process.cwd(), batchFile)}" limpo para novos cadastros.\n`);
      return;
    }
  }

  console.log(`Uso do comando:`);
  console.log(`  npm run cadastrar:url <URL_DO_PRODUTO>`);
  console.log(`Ou insira URLs (uma por linha) no arquivo: produtos_cadastro/urls_cadastro.txt`);
}

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase().includes('cadastrar-por-url')) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
