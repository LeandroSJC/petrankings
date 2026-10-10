import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { stripWeightFromTitle, normalizeIngredient } from '../src/lib/utils';
import { processUrl } from './cadastrar-por-url';

interface ProductMetadata {
  commercialName: string;
  slug: string;
  brand: string;
  manufacturerLegalName: string;
  species: 'GATO' | 'CAO' | 'CAO_E_GATO';
  lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR';
  foodType: 'SECO' | 'UMIDO';
  breedSize: 'TODOS' | 'MINI_PEQUENO' | 'MEDIO_GRANDE';
  legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR';
  coadjuvanteCondition: string | null;
  sourceUrl: string;

  // Garantias Oficiais
  umidadeMaxPct: number;
  proteinaBrutaMinPct: number;
  extratoEtereoMinPct: number;
  materiaMineralMaxPct: number;
  materiaFibrosaMaxPct: number;
  calcioMinPct: number;
  calcioMaxPct: number | null;
  fosforoMinPct: number;
  sodioMinPct: number | null;
  omega3MinPct: number | null;
  energiaMetabolizavelKcalKg: number | null;

  // Ingredientes & Rotulagem
  topIngredientsList: string[];
  containsGmo: boolean;
  gmoIngredients: string | null;
  antioxidantType: 'NATURAL' | 'SINTETICO' | 'MISTO';
}

async function processAll() {
  const dir = path.join(process.cwd(), 'produtos_cadastro');
  if (!fs.existsSync(dir)) {
    console.error(`Diretório ${dir} não encontrado!`);
    return;
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Processa URLs pendentes em produtos_cadastro/urls_cadastro.txt (se houver)
  const batchUrlFile = path.join(dir, 'urls_cadastro.txt');
  if (fs.existsSync(batchUrlFile)) {
    const rawBatch = fs.readFileSync(batchUrlFile, 'utf-8');
    const lines = rawBatch
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http') || (l.startsWith('*') && l.includes('http')));

    if (lines.length > 0) {
      console.log(`\n================================================================`);
      console.log(`🌐 INGESTÃO DE URLs EM LOTE (${lines.length} encontradas em produtos_cadastro/urls_cadastro.txt)`);
      console.log(`================================================================\n`);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isStarred = line.startsWith('*');
        const u = line.replace(/^\*\s*/, '').trim();
        console.log(`\n👉 Ingestão [${i + 1}/${lines.length}]: ${u}${isStarred ? ' (🌟 2ª Imagem Solicitada)' : ''}`);
        try {
          await processUrl(u, { preferSecondImage: isStarred });
        } catch (err: any) {
          console.error(`❌ Erro no processamento da URL ${u}:`, err.message);
        }
        if (i < lines.length - 1) {
          // Pausa preventiva de 2s para respeitar limites de taxa da API Gemini
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
      // Mantém o arquivo com o template explicativo para novos cadastros
      const template = `# ==============================================================================
# PetRankings — Cadastro em Lote por URL
# ==============================================================================
# Cole aqui as URLs oficiais das páginas de produtos que deseja cadastrar.
# Uma URL por linha (linhas iniciadas com # são ignoradas).
`;
      fs.writeFileSync(batchUrlFile, template, 'utf-8');
      console.log(`\n✅ URLs processadas com sucesso! Arquivo produtos_cadastro/urls_cadastro.txt limpo para novas inserções.\n`);
    }
  }

  const allFiles = fs.readdirSync(dir);
  const docFiles = allFiles.filter((f) => f.endsWith('.html') || f.endsWith('.htm'));

  if (docFiles.length === 0) {
    console.log(`\n📁 Nenhum arquivo (.html, .htm ou .pdf) pendente na pasta "produtos_cadastro/". Tudo atualizado!\n`);
    return;
  }

  console.log(`\n================================================================`);
  console.log(`🤖 PIPELINE OFICIAL DE CADASTRO E AVALIAÇÃO NUTRICIONAL PETRANKINGS`);
  console.log(`📁 Diretório de Entrada: produtos_cadastro/ (${docFiles.length} produtos pendentes)`);
  console.log(`================================================================\n`);

  for (const docFile of docFiles) {
    const ext = path.extname(docFile).toLowerCase();
    const baseName = path.basename(docFile, ext);
    const docFullPath = path.join(dir, docFile);
    const isHtml = ext === '.html' || ext === '.htm';

    let meta: ProductMetadata;
    let docSha256 = '';
    let remoteImageUrl: string | null = null;

    const htmlContent = fs.readFileSync(docFullPath, 'utf-8');
    docSha256 = crypto.createHash('sha256').update(htmlContent).digest('hex');
    const htmlMeta = parseProductFromHtml(htmlContent, '');
    remoteImageUrl = htmlMeta.imageUrl;
    meta = {
      commercialName: stripWeightFromTitle(htmlMeta.commercialName || baseName),
      slug: htmlMeta.slug || baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: htmlMeta.brand,
      manufacturerLegalName: htmlMeta.manufacturerLegalName,
      species: htmlMeta.species,
      lifeStage: htmlMeta.lifeStage,
      foodType: htmlMeta.foodType,
      breedSize: htmlMeta.breedSize,
      legalCategory: htmlMeta.legalCategory,
      coadjuvanteCondition: htmlMeta.coadjuvanteCondition,
      sourceUrl: htmlMeta.sourceUrl,
      umidadeMaxPct: htmlMeta.umidadeMaxPct,
      proteinaBrutaMinPct: htmlMeta.proteinaBrutaMinPct,
      extratoEtereoMinPct: htmlMeta.extratoEtereoMinPct,
      materiaMineralMaxPct: htmlMeta.materiaMineralMaxPct,
      materiaFibrosaMaxPct: htmlMeta.materiaFibrosaMaxPct,
      calcioMinPct: htmlMeta.calcioMinPct,
      calcioMaxPct: htmlMeta.calcioMaxPct,
      fosforoMinPct: htmlMeta.fosforoMinPct,
      sodioMinPct: htmlMeta.sodioMinPct,
      omega3MinPct: htmlMeta.omega3MinPct,
      energiaMetabolizavelKcalKg: htmlMeta.energiaMetabolizavelKcalKg,
      topIngredientsList: htmlMeta.topIngredientsList,
      containsGmo: htmlMeta.containsGmo,
      gmoIngredients: htmlMeta.gmoIngredients,
      antioxidantType: htmlMeta.antioxidantType,
    };

    // 3. Verifica se o produto já existe no banco por slug
    const existing = await prisma.product.findUnique({
      where: { slug: meta.slug },
    });

    // 4. Localiza imagem correspondente na pasta de entrada
    const imgFile = allFiles.find((f) => {
      const e = path.extname(f).toLowerCase();
      const n = path.basename(f, e);
      return n === baseName && ['.webp', '.png', '.jpg', '.jpeg', '.avif'].includes(e);
    });

    // Mantém o ID existente ou gera um novo com prefixo cmtz
    const productId = existing ? existing.id : 'cmtz' + crypto.randomBytes(10).toString('hex');

    // 5. Destinos padronizados em public/uploads/
    let destImgRel = `/uploads/produto_${productId}.webp`;
    const destDocRel = `/uploads/ficha_${productId}.html`;
    const destImgPath = path.join(process.cwd(), 'public', destImgRel);
    const destDocPath = path.join(process.cwd(), 'public', destDocRel);

    if (imgFile) {
      const imgFullPath = path.join(dir, imgFile);
      if (path.extname(imgFullPath).toLowerCase() === '.webp') {
        fs.copyFileSync(imgFullPath, destImgPath);
      } else {
        const sharp = require('sharp');
        await sharp(imgFullPath).webp({ quality: 85 }).toFile(destImgPath);
      }
    } else if (existing?.frontLabelImageUrl && fs.existsSync(path.join(process.cwd(), 'public', existing.frontLabelImageUrl))) {
      destImgRel = existing.frontLabelImageUrl;
      console.log(`   ℹ️ Reutilizando imagem packshot existente: ${destImgRel}`);
    } else if (remoteImageUrl) {
      console.log(`   🖼️ Baixando packshot oficial a partir do HTML (${remoteImageUrl})...`);
      try {
        const imgRes = await fetch(remoteImageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          fs.writeFileSync(destImgPath, buf);
          console.log(`   ✅ Imagem salva em: public${destImgRel}`);
        }
      } catch {
        console.warn(`   ⚠️ Falha ao baixar imagem remota.`);
      }
    } else {
      console.warn(`⚠️ [AVISO] Imagem correspondente não encontrada para: "${baseName}" e produto não possui imagem anterior. Ignorado.`);
      continue;
    }

    fs.copyFileSync(docFullPath, destDocPath);
    console.log(`   📄 Arquivo Original Arquivado para Custódia: public${destDocRel}`);

    // 6. Executa Motor de Avaliação Nutricional Oficial
    const auditFase: FaseVida = meta.lifeStage;

    const garantias = {
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
    };

    const isCoadjuvante = meta.legalCategory === 'ALIMENTO_COADJUVANTE';
    const isComplementar = meta.legalCategory === 'ALIMENTO_COMPLEMENTAR';

    const audit = calcularScoreAnaliseRotulo(
      meta.species,
      auditFase,
      garantias,
      {
        topIngredientes: meta.topIngredientsList,
        antioxidanteTipo: meta.antioxidantType,
        omega3OuPrebioticosGarantidos: (meta.omega3MinPct ?? 0) > 0,
        claimCarneTipo: 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: meta.foodType,
      },
      meta.foodType
    );

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

    // 7. Parecer Técnico com Inteligência Artificial Gemini (interrompe se API indisponível)
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

    // 8. Upsert no PostgreSQL via Prisma
    const saved = await prisma.product.upsert({
      where: { slug: meta.slug },
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
        sourceDocumentUrl: destDocRel,
        frontLabelImageUrl: destImgRel,
        analyzedBatch: 'LOTE-WEB-2026-09',
        labelCollectionDate: new Date('2026-09-13T12:00:00Z'),
        curatorResponsible: 'Curadoria Técnica',

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
        editorialOpinion: editorialOpinion,

        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: finalScoreBreakdown as any,
        calculatedAt: new Date(),
        isPublished: true,
      },
      create: {
        id: productId,
        slug: meta.slug,
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
        sourceDocumentUrl: destDocRel,
        frontLabelImageUrl: destImgRel,
        analyzedBatch: 'LOTE-WEB-2026-09',
        labelCollectionDate: new Date('2026-09-13T12:00:00Z'),
        curatorResponsible: 'Curadoria Técnica',

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
        editorialOpinion: editorialOpinion,

        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: finalScoreBreakdown as any,
        calculatedAt: new Date(),
        isPublished: true,
      },
    });

    console.log(`✅ [CADASTRADO] ${saved.commercialName}`);
    console.log(`   ID: ${saved.id} | Slug: ${saved.slug}`);
    console.log(`   Categoria: ${saved.legalCategory} ${saved.coadjuvanteCondition ? '(' + saved.coadjuvanteCondition + ')' : ''}`);
    console.log(`   Score: ${saved.scoreTotal !== null ? saved.scoreTotal + ' (' + saved.classificationTier + ')' : (saved.legalCategory === 'ALIMENTO_COMPLEMENTAR' ? 'Alimento Complementar / Petisco (Sem Score de Ranking)' : 'Prescrição Clínica (Sem Score de Ranking)')}`);
    console.log(`   Transgênicos: ${saved.containsGmo ? 'SIM (' + (saved.gmoIngredients || 'Declarado') + ')' : 'NÃO (LIVRE)'}`);
    console.log(`   Conservantes: ${saved.antioxidantType}`);
    console.log(`   Ingredientes: ${meta.topIngredientsList.length} itens cadastrados`);
    console.log(`   Packshot: ${saved.frontLabelImageUrl}`);
    console.log(`   Ficha Oficial: ${saved.sourceDocumentUrl}`);
    console.log(`   SHA-256: ${docSha256}`);

    // 8. Exclusão segura dos arquivos da pasta de entrada após persistência bem-sucedida
    try {
      if (fs.existsSync(docFullPath)) fs.unlinkSync(docFullPath);
      if (imgFile && fs.existsSync(path.join(dir, imgFile))) fs.unlinkSync(path.join(dir, imgFile));
      console.log(`   🗑️ Arquivos originais de produtos_cadastro/ removidos com sucesso.`);
    } catch (err) {
      console.warn(`   ⚠️ Não foi possível remover os arquivos de entrada:`, err);
    }
    // Pausa preventiva de 3s para respeitar limites de taxa da API Gemini
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('----------------------------------------------------------------');
  }

  console.log(`\n🎉 Todos os produtos de produtos_cadastro/ foram analisados e sincronizados com sucesso!\n`);

  // Atualiza o arquivo de rastreamento editorial JSON
  try {
    const DETERMINISTIC_REGEX = /(?:Alimento (?:seco|úmido) do segmento|Alimento dietoterápico coadjuvante formulado especialmente|Alimento específico \/ complementar|ao demonstrar atendimento aos pisos regulatórios|demonstrando alta densidade nutricional e atendimento pleno aos parâmetros do Manual Pet Food Brasil|Classificado Sob Observação \(|na auditoria técnica do PetRankings\..*A pontuação foi penalizada porque)/i;
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        commercialName: true,
        brand: true,
        species: true,
        legalCategory: true,
        scoreTotal: true,
        classificationTier: true,
        editorialOpinion: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
    });

    const processed: any[] = [];
    const pending: any[] = [];

    for (const p of allProducts) {
      const isDeterministic = !p.editorialOpinion || p.editorialOpinion.trim().length === 0 || DETERMINISTIC_REGEX.test(p.editorialOpinion);
      if (isDeterministic) {
        pending.push({
          id: p.id,
          slug: p.slug,
          commercialName: p.commercialName,
          brand: p.brand,
          species: p.species,
          legalCategory: p.legalCategory,
          scoreTotal: p.scoreTotal,
          classificationTier: p.classificationTier,
        });
      } else {
        processed.push({
          id: p.id,
          slug: p.slug,
          commercialName: p.commercialName,
          brand: p.brand,
          species: p.species,
          legalCategory: p.legalCategory,
          scoreTotal: p.scoreTotal,
          classificationTier: p.classificationTier,
          updatedAt: p.updatedAt,
          editorialOpinionSnippet: p.editorialOpinion ? p.editorialOpinion.slice(0, 140) + '...' : '',
        });
      }
    }

    const outDir = path.join(process.cwd(), 'scripts', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const progressFile = path.join(outDir, 'editorial-revision-progress.json');

    fs.writeFileSync(
      progressFile,
      JSON.stringify(
        {
          lastUpdated: new Date().toISOString(),
          summary: {
            totalProducts: allProducts.length,
            processedByGemini: processed.length,
            pending: pending.length,
            percentComplete: `${((processed.length / allProducts.length) * 100).toFixed(2)}%`,
          },
          processed,
          pending,
        },
        null,
        2
      ),
      'utf-8'
    );
    console.log(`📊 Arquivo de progresso editorial atualizado com ${allProducts.length} produtos no total.`);
  } catch (err) {
    console.warn(`⚠️ Não foi possível sincronizar o arquivo de progresso JSON:`, err);
  }
}

processAll()
  .catch((e) => {
    console.error('❌ Erro no pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
