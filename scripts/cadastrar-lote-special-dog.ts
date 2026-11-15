import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';

const specialDogUrls: string[] = [
  'https://www.specialdog.com.br/produtos-caes/super-premium-natural/bionatural-caes-racas-pequenas-adultos-carne',
  'https://www.specialdog.com.br/produtos-caes/super-premium-natural/bionatural-caes-racas-medias-e-grandes-adultos-carne',
  'https://www.specialcat.com.br/produtos-gatos/super-premium-natural/bionatural-prime-gatos-adultos-salmao',
  'https://www.specialcat.com.br/produtos-gatos/super-premium-natural/bionatural-prime-gatos-castrados-salmao',
  'https://www.specialcat.com.br/produtos-gatos/super-premium-natural/bionatural-gatos-castrados-peixe-branco',
  'https://www.specialcat.com.br/produtos-gatos/super-premium-natural/bionatural-gatos-castrados-carne',
  'https://www.specialdog.com.br/produtos-caes/premium-especial/special-dog-ultralife-caes-racas-pequenas-adultos-sabor-carne',
  'https://www.specialcat.com.br/produtos-gatos/premium-especial/sache-special-cat-ultralife-adultos-sabor-salmao',
  'https://www.specialcat.com.br/produtos-gatos/premium-especial/special-cat-ultralife-gatos-adultos-sabor-salmao',
  'https://www.specialcat.com.br/produtos-gatos/premium-especial/special-cat-ultralife-gatos-castrados-sabor-carne',
  'https://www.specialcat.com.br/produtos-gatos/premium-especial/special-cat-ultralife-gatos-castrados-sabor-salmao',
  'https://www.specialcat.com.br/produtos-gatos/premium-especial/special-cat-ultralife-gatos-filhotes-sabor-salmao',
];

async function main() {
  await ensureTunnelOpen();

  console.log(`\n================================================================`);
  console.log(`🚀 INICIANDO CADASTRO EM LOTE — SPECIAL DOG COMPANY (MANFRIM)`);
  console.log(`📦 Total de Produtos Oficiais a Cadastrar: ${specialDogUrls.length}`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < specialDogUrls.length; i++) {
    const url = specialDogUrls[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`👉 [${i + 1}/${specialDogUrls.length}] Processando URL: ${url}`);
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
        console.log(`✅ [${i + 1}/${specialDogUrls.length}] Sucesso!`);
      } else {
        errorCount++;
        console.error(`❌ [${i + 1}/${specialDogUrls.length}] Falha no processamento da URL.`);
      }
    } catch (err: any) {
      errorCount++;
      console.error(`💥 Erro fatal ao processar ${url}: ${err.message}`);
    }

    // Pequena pausa respeitosa entre requisições
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n================================================================`);
  console.log(`🏁 FINALIZAÇÃO DO CADASTRO EM LOTE — SPECIAL DOG COMPANY`);
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
