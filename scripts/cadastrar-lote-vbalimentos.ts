import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';

async function main() {
  await ensureTunnelOpen();

  const prodsPath = path.join(process.cwd(), 'scratch', 'vbalimentos-all-products.json');
  if (!fs.existsSync(prodsPath)) {
    console.error('Arquivo vbalimentos-all-products.json não encontrado!');
    return;
  }

  const allRaw = JSON.parse(fs.readFileSync(prodsPath, 'utf-8'));
  const validProducts = allRaw.filter((p: any) => p.titulo !== 'Finotrato Bio-Litter');

  console.log(`\n================================================================`);
  console.log(`🚀 INICIANDO CADASTRO EM LOTE — VB ALIMENTOS`);
  console.log(`📦 Total de Alimentos Oficiais Encontrados: ${validProducts.length}`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < validProducts.length; i++) {
    const item = validProducts[i];
    const url = item.link;
    console.log(`\n----------------------------------------------------------------`);
    console.log(`👉 [${i + 1}/${validProducts.length}] Processando: "${item.titulo}"`);
    console.log(`🔗 URL: ${url}`);
    console.log(`----------------------------------------------------------------`);

    try {
      const normalizedUrl = url.trim().replace(/\/$/, '');
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sourceUrl: url },
            { sourceUrl: normalizedUrl },
            { sourceUrl: normalizedUrl + '/' },
            { slug: item.uri },
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

    // Intervalo de segurança para respeitar a cota da API Gemini (1.5s)
    if (i < validProducts.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log(`\n================================================================`);
  console.log(`🏁 CADASTRO EM LOTE DA VB ALIMENTOS CONCLUÍDO!`);
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
