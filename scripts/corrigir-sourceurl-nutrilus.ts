import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';

async function main() {
  console.log('🐾 Iniciando correção de sourceUrl dos produtos Nutrilus/Petlove...\n');
  await ensureTunnelOpen();

  const productsToFix = await prisma.product.findMany({
    where: {
      sourceUrl: {
        startsWith: '/',
      },
    },
    select: {
      id: true,
      commercialName: true,
      brand: true,
      sourceUrl: true,
    },
  });

  console.log(`📋 Total de produtos encontrados com URL relativa: ${productsToFix.length}`);

  let updatedCount = 0;
  for (const product of productsToFix) {
    const originalUrl = product.sourceUrl || '';
    const fixedUrl = `https://www.petlove.com.br${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;

    await prisma.product.update({
      where: { id: product.id },
      data: { sourceUrl: fixedUrl },
    });

    console.log(`✅ [${product.brand}] ${product.commercialName}`);
    console.log(`   De:   ${originalUrl}`);
    console.log(`   Para: ${fixedUrl}`);
    updatedCount++;
  }

  console.log(`\n🎉 Concluído! ${updatedCount} produtos atualizados com sucesso.`);

  // Verificação final
  const remaining = await prisma.product.count({
    where: {
      sourceUrl: {
        startsWith: '/',
      },
    },
  });

  console.log(`🔍 Produtos restantes com URL relativa no banco: ${remaining}`);
}

main()
  .catch((err) => {
    console.error('❌ Erro durante a execução:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    closeTunnel();
  });
