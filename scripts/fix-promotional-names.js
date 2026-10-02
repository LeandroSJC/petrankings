const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MANUAL_CORRECTIONS = {
  // Purina Friskies com chamadas de marketing no H1 original
  'cmtz76491da9f3d5ea3d8627': 'Purina Friskies Gatos Adultos Atum ao Molho (Sachê)',
  'cmtzaa5449681a36366c5af0': 'Purina Friskies Gatos Adultos Cordeiro ao Molho (Sachê)',
  'cmtz8bb11f1edf624599a0ea': 'Purina Friskies Gatos Adultos Carne ao Molho',
  'cmtz45d18d56712c959621f9': 'Purina Friskies Gatos Adultos Mar de Sabores',
  'cmtzbb6aa878f93a542fb55f': 'Purina Friskies Gatos Filhotes Peixe Branco ao Molho (Sachê)',
  'cmtz52cebbc51c81ffabeed7': 'Purina Friskies Gatos Adultos Salmão ao Molho (Sachê)',
  'cmtz18cebf572c0cfaff4d79': 'Purina Friskies Gatos Filhotes Carne ao Molho (Sachê)',
  'cmtz859a25729a7827e4d46a': 'Purina Friskies Gatos Adultos Megamix',

  // Purina ONE com chamada de marketing
  'cmtzb16cb2f6205c12fd8768': 'Purina ONE Gatos Adultos Frango e Salmão',

  // Purina Dog Chow
  'cmtz8316b373b61311fa76ff': 'Purina Dog Chow Cães Filhotes Minis e Pequenos Carne e Arroz (Sachê)',
};

async function main() {
  console.log('--- Corrigindo Nomes com Textos Promocionais / Fora do Padrão ---');

  let updatedCount = 0;

  for (const [id, newName] of Object.entries(MANUAL_CORRECTIONS)) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, commercialName: true, slug: true }
    });

    if (product) {
      await prisma.product.update({
        where: { id },
        data: { commercialName: newName }
      });
      console.log(`[ATUALIZADO]`);
      console.log(`  Slug: ${product.slug}`);
      console.log(`  De:   "${product.commercialName}"`);
      console.log(`  Para: "${newName}"\n`);
      updatedCount++;
    }
  }

  // Também ajustar produtos iniciando com "Sachê Special..." para seguir [Marca] [Linha] [Espécie] [Fase] [Sabor] (Sachê)
  const sacheProducts = await prisma.product.findMany({
    where: {
      commercialName: {
        startsWith: 'Sachê Special',
        mode: 'insensitive'
      }
    },
    select: { id: true, brand: true, commercialName: true, species: true, lifeStage: true }
  });

  for (const p of sacheProducts) {
    // Ex: "Sachê Special Dog Ultralife Filhotes Sabor Frango"
    // -> "Special Dog Ultralife Cães Filhotes Sabor Frango (Sachê)"
    let name = p.commercialName.replace(/^sachê\s+/i, '').trim();
    
    // Inserir espécie se faltar
    const speciesLabel = p.species === 'CAO' ? 'Cães' : 'Gatos';
    if (!name.includes('Cães') && !name.includes('Gatos') && !name.includes('Cão') && !name.includes('Gato')) {
      // Inserir após a marca/linha
      if (name.startsWith('Special Dog Ultralife')) {
        name = name.replace('Special Dog Ultralife', `Special Dog Ultralife ${speciesLabel}`);
      } else if (name.startsWith('Special Dog')) {
        name = name.replace('Special Dog', `Special Dog ${speciesLabel}`);
      } else if (name.startsWith('Special Cat Ultralife')) {
        name = name.replace('Special Cat Ultralife', `Special Cat Ultralife ${speciesLabel}`);
      } else if (name.startsWith('Special Cat')) {
        name = name.replace('Special Cat', `Special Cat ${speciesLabel}`);
      }
    }

    if (!name.endsWith('(Sachê)')) {
      name = `${name} (Sachê)`;
    }

    if (name !== p.commercialName) {
      await prisma.product.update({
        where: { id: p.id },
        data: { commercialName: name }
      });
      console.log(`[ATUALIZADO SACHÊ SPECIAL]`);
      console.log(`  De:   "${p.commercialName}"`);
      console.log(`  Para: "${name}"\n`);
      updatedCount++;
    }
  }

  console.log(`Total de produtos normalizados nesta etapa: ${updatedCount}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
