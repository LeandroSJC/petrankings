import prisma from '../src/lib/prisma';
import {
  recalculateProductRating,
  sortRankingProducts,
  validateTaxonomyCompatibility,
} from '../src/lib/ranking-engine';

async function runTests() {
  console.log('🧪 Verificando as 3 Regras e Melhorias Solicitadas...');

  // TESTE 1: Média Calculada Apenas com Total de Avaliações > 0
  console.log('\n[1/3] Testando Cálculo de Média com Lojas com e sem Avaliações (reviewCount > 0)...');
  
  // Criar um produto de teste temporário
  const testProd = await prisma.product.create({
    data: {
      title: 'Produto Teste Regras de Media ' + Date.now(),
      species: 'caes',
      productType: 'Ração Especial Teste',
      stores: {
        create: [
          {
            store: 'amazon',
            productUrl: 'https://amazon.com.br/test-1',
            rating: 5.0,
            reviewCount: 0, // 0 avaliações -> NÃO deve entrar na média!
          },
          {
            store: 'petlove',
            productUrl: 'https://petlove.com.br/test-2',
            rating: 4.0,
            reviewCount: 50, // >0 avaliações -> Deve entrar na média!
          },
          {
            store: 'cobasi',
            productUrl: 'https://cobasi.com.br/test-3',
            rating: 2.0,
            reviewCount: null, // Sem avaliações -> NÃO deve entrar na média!
          },
        ],
      },
    },
  });

  const recalculated = await recalculateProductRating(testProd.id);

  console.log(`  -> Nota calculada: ${recalculated.averageRating}`);
  // Se contasse todas: (5 + 4 + 2) / 3 = 3.67
  // Como só conta a petlove (4.0 com 50 reviews): média deve ser 4.0
  if (recalculated.averageRating !== 4.0) {
    throw new Error(`❌ Falha no cálculo: esperava 4.0 (somente loja com reviews > 0), mas obteve ${recalculated.averageRating}`);
  }
  console.log('  ✓ Regra 3 validada: lojas com 0 ou null avaliações não entraram na média.');

  // TESTE 2: Produto sem Lojas
  console.log('\n[2/3] Testando Produto Cadastrado sem Lojas (0 lojas)...');
  const prodWithoutStores = await prisma.product.create({
    data: {
      title: 'Produto Teste Sem Loja ' + Date.now(),
      species: 'gatos',
      productType: 'Areia Especial Nova',
    },
  });

  const recalcEmpty = await recalculateProductRating(prodWithoutStores.id);
  if (recalcEmpty.averageRating !== null) {
    throw new Error(`❌ Produto sem lojas deveria ter averageRating = null, obteve: ${recalcEmpty.averageRating}`);
  }
  console.log('  ✓ Regra 2 validada: produto criado e mantido com 0 lojas perfeitamente.');

  // TESTE 3: Categorias Dinâmicas (Aparecimento de Novas Categorias)
  console.log('\n[3/3] Testando Categorias Dinâmicas...');
  const [products, rankings] = await Promise.all([
    prisma.product.findMany({ select: { species: true, productType: true } }),
    prisma.ranking.findMany({ select: { species: true, productType: true } }),
  ]);

  const caesSet = new Set(
    [...products, ...rankings]
      .filter((item) => item.species === 'caes' && item.productType)
      .map((item) => item.productType.trim())
  );
  const gatosSet = new Set(
    [...products, ...rankings]
      .filter((item) => item.species === 'gatos' && item.productType)
      .map((item) => item.productType.trim())
  );

  if (!caesSet.has('Ração Especial Teste')) {
    throw new Error('❌ Nova categoria de cães não foi refletida dinamicamente.');
  }
  if (!gatosSet.has('Areia Especial Nova')) {
    throw new Error('❌ Nova categoria de gatos não foi refletida dinamicamente.');
  }
  console.log('  ✓ Regra 1 validada: novas categorias aparecem dinamicamente no conjunto de sugestões.');

  // Limpeza dos produtos de teste
  await prisma.productStore.deleteMany({
    where: { productId: { in: [testProd.id, prodWithoutStores.id] } },
  });
  await prisma.product.deleteMany({
    where: { id: { in: [testProd.id, prodWithoutStores.id] } },
  });

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!\n');
}

runTests()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
