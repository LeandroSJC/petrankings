import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';

async function main() {
  await ensureTunnelOpen();

  const listingPath = path.join(process.cwd(), 'scratch', 'extracted-listing-urls.json');
  if (!fs.existsSync(listingPath)) {
    console.error('Arquivo extracted-listing-urls.json não encontrado!');
    return;
  }

  const data = JSON.parse(fs.readFileSync(listingPath, 'utf-8'));
  const allUrls: string[] = [
    ...data.guabi,
    ...data.three,
    ...data.equilibrio,
    ...data.matsuda,
  ];

  console.log(`\n================================================================`);
  console.log(`🚀 INICIANDO CADASTRO EM LOTE DE PRODUTOS OFICIAIS`);
  console.log(`📦 Total de URLs encontradas nos fabricantes: ${allUrls.length}`);
  console.log(`   - Guabi Natural: ${data.guabi.length}`);
  console.log(`   - Three Dogs / Cats: ${data.three.length}`);
  console.log(`   - Equilíbrio: ${data.equilibrio.length}`);
  console.log(`   - Matsuda Pet: ${data.matsuda.length}`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allUrls.length; i++) {
    const url = allUrls[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`👉 [${i + 1}/${allUrls.length}] Ingerindo: ${url}`);
    console.log(`----------------------------------------------------------------`);

    try {
      // Verifica se já está cadastrado no banco por sourceUrl
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sourceUrl: url },
            { sourceUrl: url.replace(/\/$/, '') },
            { sourceUrl: url.replace(/\/$/, '') + '/' },
          ],
        },
        select: { id: true, commercialName: true, slug: true },
      });

      if (existing) {
        console.log(`⏩ Produto já cadastrado no catálogo: "${existing.commercialName}" (${existing.slug}). Pulando.`);
        skippedCount++;
        continue;
      }

      const ok = await processUrl(url);
      if (ok) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (err: any) {
      console.error(`❌ Erro ao processar ${url}:`, err.message);
      errorCount++;
    }

    // Intervalo de segurança para respeitar a cota da API Gemini
    if (i < allUrls.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n================================================================`);
  console.log(`🏁 CADASTRO EM LOTE CONCLUÍDO!`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`⏩ Já existentes no banco: ${skippedCount}`);
  console.log(`⚠️ Falhas / Pulados: ${errorCount}`);
  console.log(`================================================================\n`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await closePlaywright();
    await prisma.$disconnect();
    closeTunnel();
  });

