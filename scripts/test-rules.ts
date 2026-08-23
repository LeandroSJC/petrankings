import prisma from '../src/lib/prisma';
import {
  recalculateProductRating,
  sortRankingProducts,
  validateTaxonomyCompatibility,
  checkProductDeletionSafety,
} from '../src/lib/ranking-engine';
import { validateContactAntispam } from '../src/lib/antispam';

async function runTests() {
  console.log('🧪 Iniciando Verificação Automatizada das Regras de Negócio...');

  // TESTE 1: Compatibilidade Taxonômica
  console.log('\n[1/6] Testando Compatibilidade de Categoria...');
  const comp1 = validateTaxonomyCompatibility('caes', 'Ração seca', 'caes', 'Ração seca');
  const comp2 = validateTaxonomyCompatibility('gatos', 'Areia', 'caes', 'Areia');
  const comp3 = validateTaxonomyCompatibility('caes', 'Brinquedo', 'caes', 'Ração seca');
  if (!comp1 || comp2 || comp3) {
    throw new Error('❌ Falha no teste de compatibilidade taxonômica');
  }
  console.log('  ✓ Compatibilidade taxonômica validada com sucesso.');

  // TESTE 2: Ordenação Dinâmica do Ranking (Seção 5.2)
  console.log('\n[2/6] Testando Ordenação de Ranking (Média > Volume > Antiguidade > ID)...');
  const now = new Date();
  const mockProducts = [
    { id: 'p3', averageRating: 4.8, createdAt: new Date(now.getTime() - 1000), stores: [{ reviewCount: 1000 }] },
    { id: 'p1', averageRating: 4.9, createdAt: now, stores: [{ reviewCount: 500 }] },
    { id: 'p2', averageRating: 4.8, createdAt: new Date(now.getTime() - 2000), stores: [{ reviewCount: 2000 }] },
    { id: 'p4', averageRating: null, createdAt: now, stores: [{ reviewCount: 50 }] },
  ];
  const sorted = sortRankingProducts(mockProducts);
  if (sorted[0].id !== 'p1' || sorted[1].id !== 'p2' || sorted[2].id !== 'p3' || sorted[3].id !== 'p4') {
    console.error('Resultado obtido:', sorted.map(s => s.id));
    throw new Error('❌ Falha na ordenação de ranking');
  }
  console.log('  ✓ Ordenação de ranking validada com sucesso.');

  // TESTE 3: Recálculo de Média e Propagação de Atualização
  console.log('\n[3/6] Testando Recálculo de Média e Propagação de Atualização...');
  const firstProduct = await prisma.product.findFirst({
    where: { title: { contains: 'Royal Canin Maxi' } },
    include: { stores: true, rankings: true },
  });
  if (!firstProduct) throw new Error('Produto de teste não encontrado');

  const rankingBefore = await prisma.ranking.findUnique({
    where: { id: firstProduct.rankings[0].rankingId },
  });

  // Atualizar nota de uma loja
  await prisma.productStore.update({
    where: { id: firstProduct.stores[0].id },
    data: { rating: 5.0 },
  });

  const updatedProd = await recalculateProductRating(firstProduct.id);
  const rankingAfter = await prisma.ranking.findUnique({
    where: { id: firstProduct.rankings[0].rankingId },
  });

  if (!updatedProd.averageRating || updatedProd.averageRating <= 0) {
    throw new Error('❌ Falha no recálculo da nota média');
  }
  if (!rankingAfter?.dataUpdatedAt || (rankingBefore?.dataUpdatedAt && rankingAfter.dataUpdatedAt.getTime() < rankingBefore.dataUpdatedAt.getTime())) {
    throw new Error('❌ Falha na propagação da data para os rankings vinculados');
  }
  console.log(`  ✓ Média recalculada (${updatedProd.averageRating}) e propagada para rankings.`);

  // TESTE 4: Proteção contra Exclusão de Produto Vinculado (Seção 5.4)
  console.log('\n[4/6] Testando Bloqueio de Exclusão de Produto com Vínculo Ativo...');
  const safetyCheck = await checkProductDeletionSafety(firstProduct.id);
  if (safetyCheck.canDelete) {
    throw new Error('❌ Produto vinculado não deveria poder ser excluído');
  }
  if (safetyCheck.linkedRankings.length === 0) {
    throw new Error('❌ Lista de rankings vinculados deveria ser retornada');
  }
  console.log(`  ✓ Exclusão bloqueada corretamente. Vínculos detectados: ${safetyCheck.linkedRankings.join(', ')}`);

  // TESTE 5: Antispam - Campo Isca (Honeypot)
  console.log('\n[5/6] Testando Antispam (Honeypot)...');
  const honeypotRes = await validateContactAntispam({
    honeypot: 'bot spam content',
    formOpenedAt: Date.now() - 5000,
    email: 'teste.honeypot@exemplo.com.br',
  });
  if (honeypotRes.allowed !== false || !honeypotRes.isSilentDrop) {
    throw new Error('❌ Honeypot não bloqueou o envio');
  }
  console.log('  ✓ Honeypot validado com sucesso.');

  // TESTE 6: Antispam - Tempo Mínimo & Limite por E-mail
  console.log('\n[6/6] Testando Antispam (Tempo Mínimo & Rate Limit)...');
  const tooFastRes = await validateContactAntispam({
    formOpenedAt: Date.now() - 1000, // Menos de 2.5s
    email: 'teste.rapido@exemplo.com.br',
  });
  if (tooFastRes.allowed !== false) {
    throw new Error('❌ Envio rápido (<2.5s) deveria ser bloqueado');
  }

  const validRes = await validateContactAntispam({
    formOpenedAt: Date.now() - 3500, // Mais de 2.5s
    email: 'teste.valido@exemplo.com.br',
  });
  if (!validRes.allowed) {
    throw new Error('❌ Envio válido deveria ter sido aceito: ' + validRes.reason);
  }

  const duplicateRes = await validateContactAntispam({
    formOpenedAt: Date.now() - 3500,
    email: 'teste.valido@exemplo.com.br', // Mesmo e-mail antes de 60s
  });
  if (duplicateRes.allowed !== false) {
    throw new Error('❌ Segundo envio do mesmo e-mail antes de 60s deveria ser bloqueado');
  }
  console.log('  ✓ Tempo mínimo (< 2.5s) e rate limit (60s) validados com sucesso.');

  console.log('\n🎉 TODOS OS TESTES DE REGRAS DE NEGÓCIO PASSARAM COM SUCESSO!\n');
}

runTests()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
