import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';

async function main() {
  await ensureTunnelOpen();

  const prodsPath = path.join(process.cwd(), 'scratch', 'tutano-all-products.json');
  if (!fs.existsSync(prodsPath)) {
    console.error('Arquivo tutano-all-products.json não encontrado!');
    return;
  }

  const validUrls: string[] = JSON.parse(fs.readFileSync(prodsPath, 'utf-8'));

  console.log(`\n================================================================`);
  console.log(`🚀 INICIANDO CADASTRO EM LOTE — CARGILL / NUTRON PET (TUTANO)`);
  console.log(`📦 Total de Produtos Oficiais a Cadastrar: ${validUrls.length}`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < validUrls.length; i++) {
    const url = validUrls[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`👉 [${i + 1}/${validUrls.length}] Processando URL: ${url}`);
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
      } else {
        errorCount++;
      }
    } catch (err: any) {
      console.error(`❌ Erro ao processar ${url}:`, err.message);
      errorCount++;
    }

    // Intervalo de segurança para respeitar a cota da API Gemini (1.5s)
    if (i < validUrls.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log(`\n================================================================`);
  console.log(`🏁 CADASTRO EM LOTE DA CARGILL / TUTANO CONCLUÍDO!`);
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
