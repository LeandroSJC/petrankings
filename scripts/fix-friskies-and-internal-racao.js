const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Atualizando Produto Específico ---');

  // 1. O produto apontado pelo usuário
  const p1 = await prisma.product.update({
    where: { slug: 'friskies-gatos-umida-racao-filhotes-frango-ao-molho' },
    data: {
      commercialName: 'Purina Friskies Gatos Filhotes Frango ao Molho (Sachê)'
    }
  });
  console.log(`[ATUALIZADO] ${p1.slug} -> "${p1.commercialName}"`);

  // 2. Limpeza adicional de outros termos residuais ("Ração Úmida para", "Ração Seca para", "Ração para")
  const products = await prisma.product.findMany({
    where: {
      commercialName: {
        contains: 'Ração',
        mode: 'insensitive'
      }
    },
    select: { id: true, brand: true, commercialName: true, slug: true, foodType: true }
  });

  console.log(`\nVerificando outros ${products.length} produtos que ainda contêm a palavra 'Ração' no meio do nome...`);

  let count = 0;
  for (const p of products) {
    let newName = p.commercialName;

    // Remove "Ração Úmida para " ou "Ração Úmida "
    if (/ração\s+úmida\s+(?:para\s+)?/i.test(newName)) {
      newName = newName.replace(/ração\s+úmida\s+(?:para\s+)?/i, '');
      if (!newName.includes('(Sachê)') && !newName.includes('(Lata)') && p.foodType === 'UMIDO') {
        newName = `${newName} (Sachê)`;
      }
    }

    // Remove "Ração Seca para " ou "Ração Seca "
    newName = newName.replace(/ração\s+seca\s+(?:para\s+)?/i, '');

    // Remove "Ração para " ou "Ração "
    newName = newName.replace(/ração\s+(?:para\s+)?/i, '');

    // Limpeza de marcas duplicadas soltas (ex: Dog Chow Dog Chow)
    newName = newName.replace(/\bDog Chow Dog Chow\b/gi, 'Dog Chow');
    newName = newName.replace(/\bPurina Friskies Friskies\b/gi, 'Purina Friskies');

    // Normalização de plurais frequentes
    newName = newName.replace(/\bCão Adulto\b/g, 'Cães Adultos');
    newName = newName.replace(/\bCão Filhote\b/g, 'Cães Filhotes');
    newName = newName.replace(/\bGato Adulto\b/g, 'Gatos Adultos');
    newName = newName.replace(/\bGato Filhote\b/g, 'Gatos Filhotes');
    newName = newName.replace(/\bGato Castrado\b/g, 'Gatos Castrados');

    // Espaçamentos
    newName = newName.replace(/\s{2,}/g, ' ').trim();

    if (newName !== p.commercialName) {
      await prisma.product.update({
        where: { id: p.id },
        data: { commercialName: newName }
      });
      console.log(`[ATUALIZADO]`);
      console.log(`  De:   "${p.commercialName}"`);
      console.log(`  Para: "${newName}"\n`);
      count++;
    }
  }

  console.log(`Total de produtos adicionais normalizados: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
