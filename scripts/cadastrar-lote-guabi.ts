import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';

async function main() {
  await ensureTunnelOpen();

  const missingPath = path.join(process.cwd(), 'scratch', 'guabi-missing-urls.json');
  if (!fs.existsSync(missingPath)) {
    console.error('Arquivo guabi-missing-urls.json não encontrado!');
    return;
  }

  const urls: string[] = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));

  console.log(`\n================================================================`);
  console.log(`🚀 INICIANDO CADASTRO EM LOTE — GUABI NATURAL (BRF PET)`);
  console.log(`📦 Total de Produtos Oficiais a Cadastrar: ${urls.length}`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`👉 [${i + 1}/${urls.length}] Processando URL: ${url}`);
    console.log(`----------------------------------------------------------------`);

    try {
      const normalizedUrl = url.trim().replace(/\/$/, '');
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sourceUrl: url },
            { sourceUrl: normalizedUrl },
            { sourceUrl: normalizedUrl + '/' },
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
        console.log(`✅ [${i + 1}/${urls.length}] Sucesso!`);
      } else {
        errorCount++;
        console.error(`❌ [${i + 1}/${urls.length}] Falha no processamento da URL.`);
      }
    } catch (err: any) {
      errorCount++;
      console.error(`💥 Erro fatal ao processar ${url}: ${err.message}`);
    }

    // Pequena pausa respeitosa entre requisições
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n================================================================`);
  console.log(`🏁 FINALIZAÇÃO DO CADASTRO EM LOTE — GUABI NATURAL`);
  console.log(`================================================================`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`⏩ Pulados (já existentes): ${skippedCount}`);
  console.log(`❌ Falhas: ${errorCount}`);
  console.log(`================================================================\n`);

  await closePlaywright();
  await closeTunnel();
}

main().catch(async (e) => {
  console.error(e);
  await closePlaywright();
  await closeTunnel();
  process.exit(1);
});
