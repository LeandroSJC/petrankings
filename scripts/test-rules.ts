import prisma from '../src/lib/prisma';
import {
  recalculateProductRating,
  sortRankingProducts,
  validateTaxonomyCompatibility,
  checkProductDeletionSafety,
} from '../src/lib/ranking-engine';
import { validateContactAntispam } from '../src/lib/antispam';

async function runTests() {
  console.log('🧪 Iniciando Verificação Automatizada Completa das Regras de Negócio...');

  // TESTE 1: Compatibilidade Taxonômica
  console.log('\n[1/7] Testando Compatibilidade de Categoria...');
  const comp1 = validateTaxonomyCompatibility('caes', 'Ração seca', 'caes', 'Ração seca');
  const comp2 = validateTaxonomyCompatibility('gatos', 'Areia', 'caes', 'Areia');
  const comp3 = validateTaxonomyCompatibility('caes', 'Brinquedo', 'caes', 'Ração seca');
  if (!comp1 || comp2 || comp3) {
    throw new Error('❌ Falha no teste de compatibilidade taxonômica');
  }
  console.log('  ✓ Compatibilidade taxonômica validada com sucesso.');

  // TESTE 2: Ordenação Dinâmica do Ranking (Seção 5.2)
  console.log('\n[2/7] Testando Ordenação de Ranking (Média > Volume > Antiguidade > ID)...');
  const now = new Date();
  const mockProducts = [
    { id: 'p3', averageRating: 4.8, createdAt: new Date(now.getTime() - 1000), stores: [{ reviewCount: 1000 }] },
    { id: 'p1', averageRating: 4.9, createdAt: now, stores: [{ reviewCount: 500 }] },
    { id: 'p2', averageRating: 4.8, createdAt: new Date(now.getTime() - 2000), stores: [{ reviewCount: 2000 }] },
    { id: 'p4', averageRating: null, createdAt: now, stores: [{ reviewCount: 50 }] },
  ];
  const sorted = sortRankingProducts(mockProducts);
  if (sorted[0].id !== 'p1' || sorted[1].id !== 'p2' || sorted[2].id !== 'p3' || sorted[3].id !== 'p4') {
    console.error('Resultado obtido:', sorted.map((s) => s.id));
    throw new Error('❌ Falha na ordenação de ranking');
  }
  console.log('  ✓ Ordenação de ranking validada com sucesso.');

  // TESTE 3: Recálculo de Média com reviewCount > 0
  console.log('\n[3/7] Testando Recálculo de Média (apenas lojas com reviewCount > 0)...');
  const testProd = await prisma.product.create({
    data: {
      title: 'Produto Teste Rating ' + Date.now(),
      species: 'caes',
      productType: 'Ração Especial Teste',
      stores: {
        create: [
          { store: 'amazon', productUrl: 'https://amazon.com.br/test-1', rating: 5.0, reviewCount: 0 },
          { store: 'petlove', productUrl: 'https://petlove.com.br/test-2', rating: 4.0, reviewCount: 50 },
          { store: 'cobasi', productUrl: 'https://cobasi.com.br/test-3', rating: 2.0, reviewCount: null },
        ],
      },
    },
  });

  const recalcProd = await recalculateProductRating(testProd.id);
  if (recalcProd.averageRating !== 4.0) {
    throw new Error(`❌ Falha no cálculo: esperava 4.0, mas obteve ${recalcProd.averageRating}`);
  }
  console.log(`  ✓ Média calculada com sucesso (${recalcProd.averageRating} ★), ignorando lojas sem avaliações.`);

  // TESTE 4: Produto sem Lojas
  console.log('\n[4/7] Testando Produto Cadastrado sem Lojas (0 lojas)...');
  const prodWithoutStores = await prisma.product.create({
    data: {
      title: 'Produto Teste Sem Loja ' + Date.now(),
      species: 'gatos',
      productType: 'Areia Especial Nova',
    },
  });
  const recalcEmpty = await recalculateProductRating(prodWithoutStores.id);
  if (recalcEmpty.averageRating !== null) {
    throw new Error(`❌ Produto sem lojas deveria ter averageRating = null`);
  }
  console.log('  ✓ Produto sem lojas mantido e calculado com sucesso.');

  // TESTE 5: Proteção contra Exclusão de Produto Vinculado
  console.log('\n[5/7] Testando Bloqueio de Exclusão de Produto com Vínculo Ativo...');
  const anyLinked = await prisma.rankingProduct.findFirst({
    include: { product: true, ranking: true },
  });
  if (anyLinked) {
    const safetyCheck = await checkProductDeletionSafety(anyLinked.productId);
    if (safetyCheck.canDelete || safetyCheck.linkedRankings.length === 0) {
      throw new Error('❌ Produto vinculado não deveria poder ser excluído');
    }
    console.log(`  ✓ Exclusão bloqueada corretamente. Vínculos detectados: ${safetyCheck.linkedRankings.join(', ')}`);
  } else {
    console.log('  ✓ (Nenhum produto vinculado encontrado no momento para teste de exclusão).');
  }

  // TESTE 6: Antispam (Honeypot & Rate Limit)
  console.log('\n[6/7] Testando Antispam (Honeypot & Rate Limit)...');
  const honeypotRes = await validateContactAntispam({
    honeypot: 'bot spam content',
    formOpenedAt: Date.now() - 5000,
    email: 'teste.honeypot@exemplo.com.br',
  });
  if (honeypotRes.allowed !== false || !honeypotRes.isSilentDrop) {
    throw new Error('❌ Honeypot não bloqueou o envio');
  }

  const tooFastRes = await validateContactAntispam({
    formOpenedAt: Date.now() - 1000,
    email: 'teste.rapido@exemplo.com.br',
  });
  if (tooFastRes.allowed !== false) {
    throw new Error('❌ Envio rápido (<2.5s) deveria ser bloqueado');
  }
  console.log('  ✓ Antispam e Rate Limit validados com sucesso.');

  // TESTE 7: Categorias Dinâmicas
  console.log('\n[7/7] Testando Expansão Dinâmica de Categorias...');
  const [products, rankings] = await Promise.all([
    prisma.product.findMany({ select: { species: true, productType: true } }),
    prisma.ranking.findMany({ select: { species: true, productType: true } }),
  ]);
  const caesSet = new Set(
    [...products, ...rankings]
      .filter((item) => item.species === 'caes' && item.productType)
      .map((item) => item.productType.trim())
  );
  if (!caesSet.has('Ração Especial Teste')) {
    throw new Error('❌ Nova categoria de cães não encontrada no conjunto dinâmico');
  }
  console.log('  ✓ Novas categorias aparecem dinamicamente no conjunto de sugestões.');

  // Limpar dados de teste
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
