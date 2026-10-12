import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import { chromium, type Browser } from 'playwright';
import prisma from '../src/lib/prisma';
import { parseProductFromHtml } from '../src/lib/html-product-parser';

let playwrightBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!playwrightBrowser) {
    playwrightBrowser = await chromium.launch({ headless: true });
  }
  return playwrightBrowser;
}

async function closeBrowser() {
  if (playwrightBrowser) {
    await playwrightBrowser.close().catch(() => {});
    playwrightBrowser = null;
  }
}

function cleanImageUrl(rawUrl: string): string {
  let cleaned = rawUrl;
  if (cleaned.includes('%3A') && !cleaned.startsWith('http')) {
    try { cleaned = decodeURIComponent(cleaned); } catch {}
  }
  if (cleaned.includes('%3A') && !cleaned.startsWith('http')) {
    try { cleaned = decodeURIComponent(cleaned); } catch {}
  }
  return cleaned
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\//g, '/')
    .replace(/[\\"'`\s]+$/, '');
}

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
      },
    });
    if (res.ok) {
      const html = await res.text();
      if (html && html.length > 5000) {
        return html;
      }
    }
  } catch (err: any) {
    console.warn(`  ⚠️ Fetch direto falhou (${err.message}). Tentando Playwright...`);
  }

  // Fallback Playwright
  try {
    const browser = await getBrowser();
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(1000);
    const content = await page.content();
    await page.close();
    return content;
  } catch (pwErr: any) {
    console.error(`  ❌ Playwright também falhou: ${pwErr.message}`);
    return null;
  }
}

function extractImageUrlsFromHtml(html: string, pageUrl: string): string[] {
  const images: string[] = [];
  const $ = cheerio.load(html);

  // 1. Tags img com /_next/image ou blob
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src.includes('brfsawebsitespet.blob.core.windows.net')) {
      const nextUrlMatch = src.match(/url=([^&]+)/i);
      if (nextUrlMatch) {
        let dec = decodeURIComponent(nextUrlMatch[1]);
        if (dec.includes('%3A') && !dec.startsWith('http')) {
          try { dec = decodeURIComponent(dec); } catch {}
        }
        images.push(cleanImageUrl(dec));
      } else {
        images.push(cleanImageUrl(src));
      }
    }
  });

  // 2. Busca por regex de blob no HTML bruto / scripts
  const rawMatches = html.match(/https:\\?\/\\?\/brfsawebsitespet\.blob\.core\.windows\.net\/gran-plus\/[^\s"'<>]+/gi) || [];
  for (const m of rawMatches) {
    images.push(cleanImageUrl(m));
  }

  // 3. Parser genérico do projeto
  const parsed = parseProductFromHtml(html, pageUrl);
  if (parsed.imageUrl) {
    images.push(cleanImageUrl(parsed.imageUrl));
  }

  // Remove duplicatas preservando ordem
  return [...new Set(images.filter((u) => u.startsWith('http')))];
}

async function downloadAndProcessImage(imgUrl: string, destPath: string, referer?: string): Promise<{ ok: boolean; size?: number; dimensions?: string; error?: string }> {
  try {
    const res = await fetch(imgUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ...(referer ? { Referer: referer } : {}),
      },
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const arrayBuffer = await res.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    if (rawBuffer.length === 0) {
      return { ok: false, error: 'Buffer vazio retornado pelo servidor' };
    }

    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Otimização com Sharp para WebP qualidade 90
    const webpBuffer = await sharp(rawBuffer)
      .rotate()
      .webp({ quality: 90 })
      .toBuffer();

    fs.writeFileSync(destPath, webpBuffer);
    const meta = await sharp(webpBuffer).metadata();

    return {
      ok: true,
      size: webpBuffer.length,
      dimensions: `${meta.width}x${meta.height}`,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}

async function main() {
  console.log('================================================================');
  console.log('🚀 [PetRankings] REPARO E DOWNLOAD DAS IMAGENS DA MARCA GRANPLUS');
  console.log('================================================================\n');

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { brand: { contains: 'GranPlus', mode: 'insensitive' } },
        { commercialName: { contains: 'GranPlus', mode: 'insensitive' } },
        { slug: { contains: 'granplus', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      frontLabelImageUrl: true,
      sourceUrl: true,
      sourceDocumentUrl: true,
    },
    orderBy: { commercialName: 'asc' },
  });

  console.log(`📦 Total de produtos GranPlus encontrados: ${products.length}\n`);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;
  const updatedFiles: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const targetRel = `/uploads/produto_${p.id}.webp`;
    const targetDiskPath = path.join(process.cwd(), 'public', targetRel.replace(/^\//, ''));

    console.log(`[${i + 1}/${products.length}] 🐾 ${p.commercialName}`);
    console.log(`    Slug: ${p.slug} | ID: ${p.id}`);

    // Verifica se já tem o arquivo local válido e banco já aponta para ele
    if (
      p.frontLabelImageUrl === targetRel &&
      fs.existsSync(targetDiskPath) &&
      fs.statSync(targetDiskPath).size > 1000
    ) {
      console.log(`    ✅ Imagem local já existe e está íntegra (${fs.statSync(targetDiskPath).size} bytes). Pulando.`);
      skippedCount++;
      continue;
    }

    if (!p.sourceUrl) {
      console.warn(`    ⚠️ Produto sem sourceUrl cadastrada! Não é possível acessar o site oficial.`);
      failCount++;
      continue;
    }

    console.log(`    🌐 Acessando página oficial: ${p.sourceUrl}`);
    const html = await fetchPageHtml(p.sourceUrl);

    if (!html) {
      console.error(`    ❌ Falha ao carregar o HTML da página oficial.`);
      failCount++;
      continue;
    }

    const candidateUrls = extractImageUrlsFromHtml(html, p.sourceUrl);
    if (candidateUrls.length === 0) {
      console.error(`    ❌ Nenhuma imagem da Azure Blob encontrada no HTML do produto.`);
      failCount++;
      continue;
    }

    console.log(`    🖼️ ${candidateUrls.length} candidato(s) de imagem localizado(s). Tentando download...`);

    let downloaded = false;
    for (const imgCandidate of candidateUrls) {
      const res = await downloadAndProcessImage(imgCandidate, targetDiskPath, p.sourceUrl);
      if (res.ok) {
        console.log(`    🎉 Sucesso! Salvo em: ${targetRel} (${res.dimensions}, ${res.size} bytes)`);

        // Atualiza no banco de dados
        await prisma.product.update({
          where: { id: p.id },
          data: {
            frontLabelImageUrl: targetRel,
            updatedAt: new Date(),
          },
        });
        console.log(`    💾 Banco de dados atualizado com sucesso: frontLabelImageUrl = ${targetRel}`);

        downloaded = true;
        successCount++;
        updatedFiles.push(targetDiskPath);
        break;
      } else {
        console.warn(`    ⚠️ Falha no download de ${imgCandidate.slice(0, 60)}...: ${res.error}`);
      }
    }

    if (!downloaded) {
      console.error(`    ❌ Nenhum dos candidatos de imagem pôde ser baixado com sucesso.`);
      failCount++;
    }

    // Pequena pausa respeitosa de 200ms entre requisições
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n================================================================');
  console.log(`🏁 RESULTADO DO PROCESSAMENTO:`);
  console.log(`   ✅ Baixadas e atualizadas: ${successCount}`);
  console.log(`   ⏭️ Já estavam íntegras:    ${skippedCount}`);
  console.log(`   ❌ Falhas:                 ${failCount}`);
  console.log(`   📦 Total processado:       ${products.length}`);
  console.log('================================================================\n');

  await closeBrowser();

  // Opcional sincronização via SCP se configurado
  if (updatedFiles.length > 0 && process.env.SSH_TARGET) {
    console.log(`📡 Sincronizando ${updatedFiles.length} arquivos com o servidor de produção (${process.env.SSH_TARGET})...`);
    try {
      const { execSync } = require('child_process');
      const quoted = updatedFiles.map((f) => `"${f.replace(/\\/g, '/')}"`).join(' ');
      execSync(`scp ${quoted} ${process.env.SSH_TARGET}:/home/ubuntu/petrankings/public/uploads/`, { stdio: 'inherit' });
      console.log('✓ [Sincronização SCP] Concluída com sucesso!');
    } catch (scpErr: any) {
      console.warn('⚠️ Sincronização automática via SCP não executada ou falhou:', scpErr.message);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
