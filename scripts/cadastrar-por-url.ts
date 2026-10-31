import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import net from 'net';
import { spawn, type ChildProcess } from 'child_process';
import sharp from 'sharp';
import { chromium, type Browser, type Page } from 'playwright';
import prisma from '../src/lib/prisma';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';

let autoTunnel: ChildProcess | null = null;

async function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function ensureTunnelOpen() {
  const isOpen = await isPortOpen(5433);
  if (isOpen) {
    console.log('📡 [Túnel SSH] Porta 5433 ativa.');
    return;
  }

  console.log('🔒 [Túnel SSH] Abrindo túnel temporário seguro com a Oracle Cloud (porta 5433)...');
  const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';
  autoTunnel = spawn('ssh', ['-L', '5433:127.0.0.1:5432', '-N', sshTarget], {
    stdio: 'ignore',
    windowsHide: true,
  });

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isPortOpen(5433)) {
      console.log('✓ [Túnel SSH] Conexão estabelecida com sucesso na porta 5433!\n');
      return;
    }
  }

  throw new Error('Não foi possível estabelecer o túnel SSH com a Oracle Cloud na porta 5433.');
}

export function closeTunnel() {
  if (autoTunnel) {
    console.log('🔌 [Túnel SSH] Encerrando túnel temporário.');
    autoTunnel.kill();
    autoTunnel = null;
  }
}

let playwrightBrowser: Browser | null = null;
let playwrightPage: Page | null = null;

async function getPlaywrightPage(): Promise<Page> {
  if (!playwrightBrowser) {
    playwrightBrowser = await chromium.launch({ headless: true });
    const context = await playwrightBrowser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    playwrightPage = await context.newPage();
  }
  return playwrightPage!;
}

export async function closePlaywright() {
  if (playwrightBrowser) {
    await playwrightBrowser.close().catch(() => {});
    playwrightBrowser = null;
    playwrightPage = null;
  }
}

export async function fetchWithBrowserHeaders(url: string, retries = 3): Promise<{ status: number; html: string; error?: string }> {
  const fortbrainMatch = url.match(/fortbrain\.com\.br\/produtos\/(\d+)/i);
  if (fortbrainMatch) {
    const prodId = fortbrainMatch[1];
    if (prodId === '39') {
      return {
        status: 200,
        html: '',
        error: 'PULADO: Produto ID 39 é Granulado Higiênico (argila sanitária natural, não é alimento pet).',
      };
    }
    try {
      console.log(`⚡ [API Fortbrain] Ingerindo produto ID ${prodId} via API REST oficial do fabricante...`);
      const apiRes = await fetch(`https://fortbrain.com.br/connect/api/produtos-novo/${prodId}?lang=pt`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });
      if (!apiRes.ok) {
        return { status: apiRes.status, html: '', error: `Erro na API Fortbrain: ${apiRes.statusText}` };
      }
      const data = await apiRes.json();
      const ptData = (data.traducoes || []).find((t: any) => t.idioma === 'pt') || data.traducoes?.[0];
      const nome = ptData?.nome_produto || data.nome || '';
      const niveisHtml = ptData?.niveis_garantia || '';
      let compHtml = ptData?.composicao_basica || '';
      // Garante espaços nas quebras de bloco para não aglutinar palavras adjacentes
      compHtml = compHtml
        .replace(/&nbsp;/g, ' ')
        .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, ' </p> ')
        .replace(/<br\s*\/?>/gi, ' <br/> ');
      const fotoObj = (data.fotos || []).find((f: any) => f.principal === 1) || (data.fotos || [])[0];
      const fotoUrl = fotoObj ? `https://fortbrain.com.br/connect${fotoObj.url_foto}` : '';

      let garantiasTable = '';
      if (Array.isArray(data.garantias) && data.garantias.length > 0) {
        garantiasTable = `
          <table>
            <thead><tr><th>Nutriente</th><th>Valor</th></tr></thead>
            <tbody>
              ${data.garantias.map((g: any) => `<tr><td>${g.garantia_nome_pt || g.nome} (${g.operador_texto_pt || ''})</td><td>${g.valor} ${g.unidade_simbolo || ''}</td></tr>`).join('\n')}
            </tbody>
          </table>
        `;
      }

      const generatedHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${nome} — Fortbrain</title>
  <meta property="og:title" content="${nome}" />
  <meta property="og:image" content="${fotoUrl}" />
  <meta property="og:url" content="${url}" />
</head>
<body>
  <div class="product-header">
    <h1 class="product_title">${nome}</h1>
    <div class="brand">Fortbrain</div>
  </div>
  <div class="product-image">
    <img src="${fotoUrl}" alt="${nome}" />
  </div>
  <div class="niveis-garantia">
    <h2>Níveis de Garantia</h2>
    ${garantiasTable}
    ${niveisHtml}
  </div>
  <div class="composicao-basica">
    <h2>Composição Básica</h2>
    ${compHtml}
  </div>
</body>
</html>
      `;
      return { status: 200, html: generatedHtml };
    } catch (err: any) {
      return { status: 0, html: '', error: `Falha ao consultar API Fortbrain: ${err.message}` };
    }
  }

  const isFvo = /fvoalimentos\.com\.br/i.test(url);
  const customHeaders: Record<string, string> = isFvo
    ? {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    : {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: customHeaders,
      });

      const status = res.status;
      const html = await res.text();

      // Se for barrado por 403, 406 (Mod_Security) ou Cloudflare Challenge, aciona o Chromium do Playwright
      if (status === 403 || status === 406 || /challenges\.cloudflare\.com|cloudflare-static|not acceptable/i.test(html)) {
        console.log(`🛡️ Desafio de segurança detectado (Status ${status}). Acionando navegador headless Playwright...`);
        try {
          const page = await getPlaywrightPage();
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
          await page.waitForTimeout(600);
          const pwHtml = await page.content();
          if (pwHtml && pwHtml.length > 5000) {
            return { status: 200, html: pwHtml };
          }
        } catch (pwErr: any) {
          console.warn(`⚠️ Playwright falhou na URL ${url}: ${pwErr.message}`);
        }
      }

      return { status, html };
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      } else {
        // Fallback final com Playwright
        try {
          console.log(`🛡️ Falha de conexão direta. Tentando navegador headless Playwright...`);
          const page = await getPlaywrightPage();
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
          await page.waitForTimeout(600);
          const pwHtml = await page.content();
          if (pwHtml && pwHtml.length > 5000) {
            return { status: 200, html: pwHtml };
          }
        } catch (pwErr: any) {
          return { status: 0, html: '', error: err.message };
        }
        return { status: 0, html: '', error: err.message };
      }
    }
  }
  return { status: 0, html: '', error: 'Falha após tentativas' };
}

async function downloadImage(imgUrl: string, destPath: string, retries = 3): Promise<boolean> {
  const formatUrl = (u: string) => {
    try {
      // Decode then re-encode without breaking path characters like '=', ',', ':', etc.
      return encodeURI(decodeURI(u));
    } catch {
      return u;
    }
  };
  const encoded = imgUrl.startsWith('http') ? formatUrl(imgUrl) : imgUrl;

  let referer: string | undefined;
  try {
    referer = new URL(imgUrl).origin + '/';
  } catch {}

  const isFvoImg = /fvoalimentos\.com\.br/i.test(imgUrl);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(encoded, {
        headers: {
          'User-Agent': isFvoImg
            ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          ...(referer ? { Referer: referer } : {}),
        },
      });
      if (!res.ok) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        return false;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) return false;
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (destPath.endsWith('.webp')) {
        try {
          await sharp(buf).webp({ quality: 90 }).toFile(destPath);
        } catch {
          fs.writeFileSync(destPath, buf);
        }
      } else {
        fs.writeFileSync(destPath, buf);
      }
      return true;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  return false;
}

export async function processUrl(url: string, options?: { preferSecondImage?: boolean; skipImageDownload?: boolean }): Promise<boolean> {
  console.log(`\n================================================================`);
  console.log(`🌐 INGESTÃO DIRETA POR URL`);
  console.log(`🔗 Alvo: ${url}${options?.preferSecondImage ? ' (🌟 2ª Imagem Solicitada)' : ''}`);
  console.log(`================================================================\n`);

  console.log('📡 Conectando ao website oficial do fabricante...');
  const { status, html, error } = await fetchWithBrowserHeaders(url);

  if (error) {
    console.error(`❌ Erro de conexão com a URL: ${error}`);
    return false;
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
    return false;
  }

  if (status !== 200 || !html) {
    console.error(`❌ O servidor retornou status HTTP ${status} sem conteúdo legível.`);
    return false;
  }

  console.log(`✅ Página carregada com sucesso (HTML: ${(html.length / 1024).toFixed(1)} KB).`);
  console.log('🔍 Extraindo metadados, níveis de garantia e composição do DOM...');

  const meta = parseProductFromHtml(html, url, options);

  if (!meta.commercialName) {
    console.error(`❌ Não foi possível identificar o nome comercial do produto no HTML.`);
    return false;
  }

  console.log(`\n📦 Produto: "${meta.commercialName}"`);
  console.log(`🏷️ Marca: ${meta.brand} | Espécie: ${meta.species} | Fase: ${meta.lifeStage} | Formato: ${meta.foodType}`);
  console.log(`⚖️ Categoria Legal: ${meta.legalCategory} ${meta.coadjuvanteCondition ? `(Condição: ${meta.coadjuvanteCondition})` : ''}`);
  console.log(`🥗 Ingredientes identificados: ${meta.topIngredientsList.length}`);
  console.log(`   #1: ${meta.topIngredientsList[0] || 'N/D'}`);

  if (meta.topIngredientsList.length === 0) {
    console.warn(`⚠️ PULANDO CADASTRO: A página oficial não disponibilizou a lista de ingredientes/composição.`);
    console.warn(`   Conforme as diretrizes (Regras 6 e 11), dados ausentes não são inventados nem cadastrados.`);
    return false;
  }

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

  const skipImageDownload =
    options?.skipImageDownload ||
    process.env.SKIP_IMAGE_DOWNLOAD === 'true' ||
    process.argv.includes('--skip-images');

  const defaultPlaceholder =
    meta.species === 'GATO' ? '/uploads/placeholder-gato.webp' : '/uploads/placeholder-cao.webp';

  let destImgRel = existing?.frontLabelImageUrl || defaultPlaceholder;

  if (skipImageDownload) {
    if (!existing?.frontLabelImageUrl || existing.frontLabelImageUrl.includes('placeholder')) {
      destImgRel = defaultPlaceholder;
      console.log(`🖼️ [Placeholder Padrão] Download remoto ignorado a pedido do curador.`);
      console.log(`   🐾 Atribuído placeholder minimalista oficial: ${destImgRel}`);
    } else {
      console.log(`🖼️ [Imagem Mantida] Download ignorado; mantendo packshot existente: ${destImgRel}`);
    }
  } else if (meta.imageUrl) {
    const targetImgRel =
      destImgRel.includes('placeholder') || !destImgRel
        ? `/uploads/produto_${productId}.webp`
        : destImgRel;
    const destImgPath = path.join(process.cwd(), 'public', targetImgRel);
    console.log(`🖼️ Baixando packshot oficial em alta resolução (${meta.imageUrl})...`);
    const imgOk = await downloadImage(meta.imageUrl, destImgPath);
    if (!imgOk) {
      console.warn('⚠️ Falha ao baixar imagem remota para armazenamento local.');
      const localFileExists =
        existing?.frontLabelImageUrl &&
        fs.existsSync(path.join(process.cwd(), 'public', existing.frontLabelImageUrl.replace(/^\//, '')));
      if (!localFileExists) {
        destImgRel = meta.imageUrl;
      }
    } else {
      destImgRel = targetImgRel;
      console.log(`✅ Imagem salva em: public${destImgRel}`);
    }
  }

  // 6. Cálculo da Avaliação Nutricional (Score Determinístico)
  const isWet = meta.foodType === 'UMIDO';
  const isFilhote = meta.lifeStage === 'CRESCIMENTO_INICIAL' || meta.lifeStage === 'CRESCIMENTO_FINAL';
  const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(meta.commercialName);

  const audit = calcularScoreAnaliseRotulo(
    meta.species as any,
    (isFilhote ? 'CRESCIMENTO_INICIAL' : meta.lifeStage) as any,
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
      omega3OuPrebioticosGarantidos: isWet
        ? !!(meta.omega3MinPct && meta.omega3MinPct >= 0.015)
        : !!(meta.omega3MinPct && meta.omega3MinPct >= 0.2),
      claimCarneTipo: 'COM_CARNE',
      isLightOuControlePeso: isLight,
      nomeComercial: meta.commercialName,
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
  return true;
}

async function main() {
  await ensureTunnelOpen();

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
      const successfulUrls: string[] = [];
      const skippedUrls: { url: string; reason: string }[] = [];

      for (let i = 0; i < urls.length; i++) {
        const u = urls[i];
        console.log(`\n👉 Ingestão [${i + 1}/${urls.length}]: ${u}`);
        try {
          const ok = await processUrl(u);
          if (ok) {
            successfulUrls.push(u);
          } else {
            skippedUrls.push({ url: u, reason: 'Página oficial sem lista de ingredientes/garantias ou erro de extração' });
          }
        } catch (err: any) {
          console.error(`❌ Erro no processamento da URL ${u}:`, err.message);
          skippedUrls.push({ url: u, reason: err.message });
        }
        if (i < urls.length - 1) {
          // Pausa preventiva de 2s para respeitar limites de taxa da API Gemini
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      let template = `# ==============================================================================
# PetRankings — Cadastro em Lote por URL
# ==============================================================================
# Cole aqui as URLs oficiais das páginas de produtos que deseja cadastrar.
# Uma URL por linha (linhas iniciadas com # são ignoradas).
`;
      if (skippedUrls.length > 0) {
        template += `\n# --- PENDENTES / PULADOS POR FALTA DE DADOS OFICIAIS NO SITE DO FABRICANTE ---\n`;
        skippedUrls.forEach((s) => {
          template += `# Motivo: ${s.reason}\n${s.url}\n\n`;
        });
      }
      fs.writeFileSync(batchFile, template, 'utf-8');
      console.log(`\n================================================================`);
      console.log(`🏁 RESUMO DO PROCESSAMENTO EM LOTE:`);
      console.log(`✅ Sucesso: ${successfulUrls.length} produtos cadastrados no banco`);
      console.log(`⚠️ Pulados: ${skippedUrls.length} produtos mantidos no arquivo para acompanhamento`);
      console.log(`================================================================\n`);
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
    .finally(async () => {
      await closePlaywright();
      await prisma.$disconnect();
      closeTunnel();
    });
}
