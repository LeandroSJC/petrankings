import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import * as cheerio from 'cheerio';

async function checkBrokenImages() {
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

  const missingFiles: typeof products = [];
  const missingUrls: typeof products = [];

  for (const p of products) {
    if (!p.frontLabelImageUrl) {
      missingUrls.push(p);
      continue;
    }

    if (p.frontLabelImageUrl.startsWith('/uploads/')) {
      const diskPath = path.join(process.cwd(), 'public', p.frontLabelImageUrl);
      if (!fs.existsSync(diskPath) || fs.statSync(diskPath).size === 0) {
        missingFiles.push(p);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Relatório de Integridade de Imagens`);
  console.log(`========================================`);
  console.log(`Total de produtos no catálogo: ${products.length}`);
  console.log(`Imagens locais ausentes no disco (/uploads/): ${missingFiles.length}`);
  console.log(`Produtos sem URL de imagem: ${missingUrls.length}`);

  if (missingFiles.length > 0) {
    console.log(`\nLista de produtos com imagem faltando no disco:`);
    missingFiles.forEach(p => {
      console.log(`- [${p.brand}] ${p.commercialName}`);
      console.log(`  Slug: ${p.slug}`);
      console.log(`  Path: ${p.frontLabelImageUrl}`);
      console.log(`  Fonte: ${p.sourceUrl}\n`);
    });
  }
}

checkBrokenImages().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
