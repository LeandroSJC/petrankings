import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('================================================================');
  console.log('🚀 [Three Dogs & Three Cats] CAPTURA DE PACKSHOTS OFICIAIS');
  console.log('================================================================\n');

  await ensureTunnelOpen();

  // Busca todos os produtos Three Dogs e Three Cats no banco
  const products = await prisma.product.findMany({
    where: {
      brand: { in: ['Three Dogs', 'Three Cats'] },
    },
    select: {
      id: true,
      commercialName: true,
      brand: true,
      slug: true,
      sourceUrl: true,
      frontLabelImageUrl: true,
    },
    orderBy: { commercialName: 'asc' },
  });

  console.log(`📦 Encontrados ${products.length} produtos Three Dogs / Three Cats no banco de dados.\n`);

  const updatedFilesForScp: string[] = [];
  const processedProductIds = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });

  const listingUrls = [
    { url: 'https://threepetfood.com.br/pt/caes', especie: 'CÃES' },
    { url: 'https://threepetfood.com.br/pt/gatos', especie: 'GATOS' },
  ];

  for (const { url, especie } of listingUrls) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`🌐 Navegando na listagem oficial de ${especie}: ${url}`);
    console.log(`----------------------------------------------------------------`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Extrai todas as imagens de produtos (que contenham blob.core.windows.net/three)
    const pageImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter((i) => i.src && decodeURIComponent(i.src).includes('blob.core.windows.net/three'))
        .map((i) => ({
          src: i.src,
          alt: (i.alt || '').trim(),
        }));
    });

    console.log(`  🔍 Imagens de produtos identificadas na página: ${pageImages.length}`);

    for (const imgData of pageImages) {
      if (!imgData.alt) continue;

      // Localiza produto pelo slug exato ou contido no alt
      const matchedProd = products.find((p) => {
        const pSlug = p.slug.toLowerCase();
        const alt = imgData.alt.toLowerCase();
        return pSlug === alt || alt.includes(pSlug) || pSlug.includes(alt);
      });

      if (!matchedProd) {
        console.warn(`  ⚠️ Nenhuma correspondência no banco para imagem com alt: "${imgData.alt}"`);
        continue;
      }

      if (processedProductIds.has(matchedProd.id)) {
        continue;
      }

      // Tenta extrair a URL de alta resolução original direta do blob
      let downloadUrl = imgData.src;
      try {
        const parsedUrl = new URL(imgData.src);
        const originalBlobUrl = parsedUrl.searchParams.get('url');
        if (originalBlobUrl && originalBlobUrl.startsWith('http')) {
          downloadUrl = originalBlobUrl;
        }
      } catch {}

      console.log(`\n👉 Baixando packshot oficial da embalagem:`);
      console.log(`   Produto: "${matchedProd.commercialName}"`);
      console.log(`   Slug: ${matchedProd.slug} | ID: ${matchedProd.id}`);
      console.log(`   Download URL: ${downloadUrl.slice(0, 100)}...`);

      try {
        let imgRes = await page.request.get(downloadUrl);
        if (imgRes.status() !== 200 && downloadUrl !== imgData.src) {
          console.warn(`   ⚠️ Falha HTTP ${imgRes.status()} no blob direto. Tentando fallback pela URL do Next.js...`);
          imgRes = await page.request.get(imgData.src);
        }

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

        // Atualiza banco de dados com caminho relativo local padronizado
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
