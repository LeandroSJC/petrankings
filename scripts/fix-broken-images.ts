import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { parseProductFromHtml } from '../src/lib/html-product-parser';

async function fixBrokenImages() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      frontLabelImageUrl: true,
      sourceUrl: true,
    }
  });

  const missingProducts: typeof products = [];

  for (const p of products) {
    if (p.frontLabelImageUrl && p.frontLabelImageUrl.startsWith('/uploads/')) {
      const diskPath = path.join(process.cwd(), 'public', p.frontLabelImageUrl);
      if (!fs.existsSync(diskPath) || fs.statSync(diskPath).size === 0) {
        missingProducts.push(p);
      }
    }
  }

  console.log(`Encontrados ${missingProducts.length} produtos com imagem ausente no disco.\n`);

  const formatUrl = (u: string) => {
    try {
      const obj = new URL(u);
      const cleanPath = obj.pathname
        .split('/')
        .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
        .join('/');
      return `${obj.origin}${cleanPath}${obj.search}`;
    } catch {
      return u;
    }
  };

  let fixedCount = 0;

  for (let i = 0; i < missingProducts.length; i++) {
    const p = missingProducts[i];
    console.log(`[${i + 1}/${missingProducts.length}] Recuperando imagem para: "${p.commercialName}"`);
    console.log(`   Fonte: ${p.sourceUrl}`);

    if (!p.sourceUrl) {
      console.warn('   ⚠️ Sem sourceUrl!');
      continue;
    }

    try {
      // 1. Fetch da página oficial
      const res = await fetch(p.sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });

      if (!res.ok) {
        console.warn(`   ⚠️ Erro HTTP ${res.status} ao acessar a fonte.`);
        continue;
      }

      const html = await res.text();
      const parsed = parseProductFromHtml(html, p.sourceUrl);

      if (!parsed.imageUrl) {
        console.warn('   ⚠️ Nenhuma imagem identificada na página oficial.');
        continue;
      }

      console.log(`   Imagem remota identificada: ${parsed.imageUrl}`);

      // 2. Download seguro sem dupla codificação
      const safeUrl = formatUrl(parsed.imageUrl);
      const imgRes = await fetch(safeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        }
      });

      if (!imgRes.ok) {
        console.warn(`   ⚠️ Erro ao baixar imagem remota: HTTP ${imgRes.status}`);
        continue;
      }

      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.byteLength < 500) {
        console.warn(`   ⚠️ Imagem corrompida ou pequena demais (${buf.byteLength} bytes).`);
        continue;
      }

      const destPath = path.join(process.cwd(), 'public', p.frontLabelImageUrl!);
      fs.writeFileSync(destPath, buf);
      console.log(`   ✅ Salva com sucesso (${buf.byteLength} bytes) em: ${p.frontLabelImageUrl}`);
      fixedCount++;
    } catch (err: any) {
      console.error(`   ❌ Falha:`, err.message);
    }

    // Pequena pausa para evitar rate limit
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n========================================`);
  console.log(`✅ Recuperação finalizada!`);
  console.log(`Imagens recuperadas e salvas com sucesso: ${fixedCount}/${missingProducts.length}`);
  console.log(`========================================\n`);
}

fixBrokenImages().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
