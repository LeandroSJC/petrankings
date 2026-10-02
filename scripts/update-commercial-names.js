const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeCommercialName(name, brand) {
  if (!name) return '';
  let cleaned = name.trim();

  // 1. Remove prefixos "Ração Seca para", "Ração Seca", "Ração Úmida para", "Ração Úmida", "Ração para", "Ração"
  cleaned = cleaned.replace(/^ração\s+(?:seca\s+|úmida\s+)?(?:para\s+)?/i, '');

  // 2. Se a marca estiver em ALL CAPS (ex: WHISKAS), normalizar para a grafia cadastrada (Whiskas)
  if (brand) {
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
    cleaned = cleaned.replace(brandRegex, brand);
  }

  // 3. Ajuste de claims promocionais residuais
  cleaned = cleaned.replace(/:\s*Seu\s+Pequeno\s+Pet\s+Amará/i, '');

  // 4. Limpeza de múltiplos espaços
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

async function main() {
  console.log('--- Iniciando Normalização de Nomes Comerciais (Invariante 13) ---');
  
  const products = await prisma.product.findMany({
    where: {
      commercialName: {
        startsWith: 'Ração',
        mode: 'insensitive'
      }
    },
    select: { id: true, brand: true, commercialName: true, slug: true }
  });

  console.log(`Produtos identificados para atualização: ${products.length}\n`);

  let updatedCount = 0;

  for (const product of products) {
    const newName = normalizeCommercialName(product.commercialName, product.brand);
    
    if (newName && newName !== product.commercialName) {
      await prisma.product.update({
        where: { id: product.id },
        data: { commercialName: newName }
      });
      console.log(`[ATUALIZADO]`);
      console.log(`  De:   "${product.commercialName}"`);
      console.log(`  Para: "${newName}"\n`);
      updatedCount++;
    }
  }

  console.log(`Total de produtos normalizados com sucesso: ${updatedCount}`);
}

main()
  .catch((err) => {
    console.error('Erro na normalização:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
