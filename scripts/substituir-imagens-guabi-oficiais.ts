import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('================================================================');
  console.log('🚀 [Guabi Natural] CAPTURA E SUBSTITUIÇÃO DE PACKSHOTS OFICIAIS');
  console.log('================================================================\n');

  await ensureTunnelOpen();

  // Busca todos os 18 produtos Guabi Natural no banco
  const products = await prisma.product.findMany({
    where: { brand: 'Guabi Natural' },
    select: {
      id: true,
      commercialName: true,
      slug: true,
      sourceUrl: true,
      frontLabelImageUrl: true,
    },
    orderBy: { commercialName: 'asc' },
  });

  console.log(`📦 Encontrados ${products.length} produtos Guabi Natural cadastrados no banco de dados.\n`);

  const updatedFilesForScp: string[] = [];
  const processedProductIds = new Set<string>();

  // Inicia browser Playwright
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });

  const listingUrls = [
    { url: 'https://www.guabinatural.com.br/pt/caes', especie: 'CÃES' },
    { url: 'https://www.guabinatural.com.br/pt/gatos', especie: 'GATOS' },
  ];

  for (const { url, especie } of listingUrls) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`🌐 Navegando na listagem oficial de ${especie}: ${url}`);
    console.log(`----------------------------------------------------------------`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Remove qualquer modal/overlay
    await page.evaluate(() => {
      document.querySelectorAll('[data-state="open"], .fixed.inset-0, [class*="alert"]').forEach((el) => el.remove());
    });

    // Clica em "Mais Produtos" sucessivamente para renderizar todo o catálogo
    for (let attempt = 0; attempt < 8; attempt++) {
      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const moreBtn = btns.find((b) => b.textContent && b.textContent.includes('Mais Produtos'));
        if (moreBtn && moreBtn.offsetParent !== null) {
          moreBtn.click();
          return true;
        }
        return false;
      });
      if (!clicked) break;
      console.log(`  ✓ Clicado "Mais Produtos" (iteração #${attempt + 1})`);
      await page.waitForTimeout(1500);
    }

    // Coleta todos os cards de produto da página
    const cards = await page.$$('.rounded-xl');
    console.log(`  🔍 Total de cards renderizados na página: ${cards.length}`);

    for (const card of cards) {
      const link = await card.$('a[href*="/caes/"], a[href*="/gatos/"]');
      if (!link) continue;

      const href = await link.getAttribute('href');
      if (!href) continue;

      const slug = href.split('/').filter(Boolean).pop() || '';

      // Localiza o produto correspondente no banco
      const matchedProd = products.find(
        (p) => p.slug === slug || p.sourceUrl?.endsWith(`/${slug}`) || p.sourceUrl?.includes(slug)
      );

      if (!matchedProd) {
        // Produto na listagem não está entre os 18 catalogados
        continue;
      }

      if (processedProductIds.has(matchedProd.id)) {
        continue;
      }

      const img = await card.$('img');
      if (!img) {
        console.warn(`  ⚠️ Card sem imagem para: ${matchedProd.commercialName}`);
        continue;
      }

      const imgSrc = await img.evaluate((el: HTMLImageElement) => el.src);
      if (!imgSrc) continue;

      console.log(`\n👉 Baixando packshot oficial da embalagem:`);
      console.log(`   Produto: "${matchedProd.commercialName}"`);
      console.log(`   Slug: ${slug} | ID: ${matchedProd.id}`);
      console.log(`   Imagem URL: ${imgSrc.slice(0, 100)}...`);

      try {
        const imgRes = await page.request.get(imgSrc);
        if (imgRes.status() !== 200) {
          console.error(`   ❌ Falha HTTP ${imgRes.status()} ao baixar packshot.`);
          continue;
        }

        const imgBytes = await imgRes.body();
        const optimizedWebp = await sharp(imgBytes)
          .rotate()
          .webp({ quality: 90 })
          .toBuffer();

        const meta = await sharp(optimizedWebp).metadata();
        const targetRel = `/uploads/produto_${matchedProd.id}.webp`;
        const diskPath = path.join(process.cwd(), 'public', 'uploads', `produto_${matchedProd.id}.webp`);

        fs.writeFileSync(diskPath, optimizedWebp);
        console.log(`   ✅ Packshot salvo: public/uploads/produto_${matchedProd.id}.webp (${meta.width}x${meta.height}, ${optimizedWebp.length} bytes)`);

        // Atualiza banco de dados
        await prisma.product.update({
          where: { id: matchedProd.id },
          data: {
            frontLabelImageUrl: targetRel,
            updatedAt: new Date(),
          },
        });
        console.log(`   💾 Banco atualizado: frontLabelImageUrl = "${targetRel}"`);

        updatedFilesForScp.push(diskPath);
        processedProductIds.add(matchedProd.id);
      } catch (err: any) {
        console.error(`   ❌ Erro ao processar packshot de ${matchedProd.commercialName}:`, err.message);
      }
    }
  }

  await browser.close();

  console.log(`\n================================================================`);
  console.log(`🏁 PROCESSAMENTO DE PACKSHOTS CONCLUÍDO!`);
  console.log(`✅ Sucesso: ${processedProductIds.size} de ${products.length} produtos atualizados com a embalagem oficial.`);
  console.log(`================================================================\n`);

  // Se algum produto não foi encontrado na listagem, avisa
  const missing = products.filter((p) => !processedProductIds.has(p.id));
  if (missing.length > 0) {
    console.warn(`⚠️ ${missing.length} produtos não foram encontrados nas listagens:`);
    missing.forEach((p) => console.warn(`   - ${p.commercialName} (${p.slug})`));
  }

  // Sincronização via SCP com o servidor Oracle VPS em produção
  if (updatedFilesForScp.length > 0) {
    console.log(`\n🚀 [Sincronização] Enviando ${updatedFilesForScp.length} packshots oficiais para o servidor Oracle Cloud...`);
    const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';
    const remoteDest = `${sshTarget}:/home/ubuntu/petrankings/public/uploads/`;

    const quotedFiles = updatedFilesForScp.map((p) => `"${p.replace(/\\/g, '/')}"`).join(' ');
    const scpCmd = `scp ${quotedFiles} ${remoteDest}`;

    try {
      execSync(scpCmd, { stdio: 'inherit' });
      console.log('✓ [Sincronização] Todas as embalagens oficiais foram sincronizadas na VPS de produção!');
    } catch (scpErr: any) {
      console.error('❌ Erro na sincronização SCP com a VPS:', scpErr.message);
    }
  }

  await prisma.$disconnect();
  closeTunnel();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  closeTunnel();
});

