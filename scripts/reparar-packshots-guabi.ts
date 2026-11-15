import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { chromium } from 'playwright';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';

async function main() {
  await ensureTunnelOpen();

  console.log('🚀 Iniciando coleta de packshots oficiais de alta resolução da Guabi Natural...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'pt-BR',
  });
  const page = await context.newPage();

  const slugToImgSrc: Record<string, string> = {};

  // 1. CÃES
  console.log('Acessando catálogo de Cães da Guabi Natural...');
  await page.goto('https://www.guabinatural.com.br/pt/caes', { waitUntil: 'networkidle', timeout: 35000 });
  await page.evaluate(() => {
    document.querySelectorAll('[role="alertdialog"], .fixed.inset-0, [data-state="open"]').forEach(el => el.remove());
  });

  // Click MAIS PRODUTOS
  for (let c = 0; c < 5; c++) {
    const hasMore = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('MAIS PRODUTOS'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!hasMore) break;
    await page.waitForTimeout(2000);
  }

  const caesCards = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/pt/caes/"]'));
    return anchors.map(a => {
      const img = a.querySelector('img') || a.closest('div')?.querySelector('img');
      return {
        slug: img?.alt || a.href.split('/').filter(Boolean).pop() || '',
        src: img?.src || '',
      };
    }).filter(c => c.slug && c.src.includes('_next/image'));
  });

  for (const c of caesCards) {
    slugToImgSrc[c.slug] = c.src;
  }
  console.log(`Cards de Cães mapeados: ${caesCards.length}`);

  // 2. GATOS
  console.log('Acessando catálogo de Gatos da Guabi Natural...');
  await page.goto('https://www.guabinatural.com.br/pt/gatos', { waitUntil: 'networkidle', timeout: 35000 });
  await page.evaluate(() => {
    document.querySelectorAll('[role="alertdialog"], .fixed.inset-0, [data-state="open"]').forEach(el => el.remove());
  });

  for (let c = 0; c < 5; c++) {
    const hasMore = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('MAIS PRODUTOS'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!hasMore) break;
    await page.waitForTimeout(2000);
  }

  const gatosCards = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/pt/gatos/"]'));
    return anchors.map(a => {
      const img = a.querySelector('img') || a.closest('div')?.querySelector('img');
      return {
        slug: img?.alt || a.href.split('/').filter(Boolean).pop() || '',
        src: img?.src || '',
      };
    }).filter(c => c.slug && c.src.includes('_next/image'));
  });

  for (const c of gatosCards) {
    slugToImgSrc[c.slug] = c.src;
  }
  console.log(`Cards de Gatos mapeados: ${gatosCards.length}`);

  await browser.close();

  console.log(`\nTotal de slugs mapeados para imagens oficiais: ${Object.keys(slugToImgSrc).length}`);

  // Buscar produtos Guabi Natural que estejam com placeholder
  const placeholderProds = await prisma.product.findMany({
    where: {
      brand: 'Guabi Natural',
      frontLabelImageUrl: { contains: 'placeholder' },
    },
    select: { id: true, slug: true, commercialName: true, frontLabelImageUrl: true },
  });

  console.log(`\nProdutos com placeholder para atualizar: ${placeholderProds.length}`);

  let updatedCount = 0;
  for (const prod of placeholderProds) {
    const imgSrc = slugToImgSrc[prod.slug];
    if (!imgSrc) {
      console.warn(`⚠️ Nenhuma imagem encontrada no catálogo para o slug: ${prod.slug}`);
      continue;
    }

    console.log(`\n👉 Baixando packshot para "${prod.commercialName}" (${prod.slug})...`);
    try {
      const imgRes = await fetch(imgSrc, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Referer: 'https://www.guabinatural.com.br/',
        },
      });

      if (!imgRes.ok) {
        console.error(`❌ Erro HTTP ${imgRes.status} ao baixar imagem: ${imgSrc}`);
        continue;
      }

      const buf = Buffer.from(await imgRes.arrayBuffer());
      const destRel = `/uploads/produto_${prod.id}.webp`;
      const destAbs = path.join(process.cwd(), 'public', 'uploads', `produto_${prod.id}.webp`);

      await sharp(buf).trim().webp({ quality: 90 }).toFile(destAbs);

      await prisma.product.update({
        where: { id: prod.id },
        data: { frontLabelImageUrl: destRel },
      });

      console.log(`✅ Packshot salvo e associado com sucesso: ${destRel}`);
      updatedCount++;
    } catch (err: any) {
      console.error(`❌ Falha ao processar imagem para ${prod.slug}: ${err.message}`);
    }
  }

  console.log(`\n🏁 Concluído! Total atualizado: ${updatedCount}/${placeholderProds.length}`);

  await closeTunnel();
}

main().catch(async (e) => {
  console.error(e);
  await closeTunnel();
  process.exit(1);
});
