import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import { generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { Prisma } from '@prisma/client';

async function main() {
  console.log('================================================================');
  console.log('🚀 RECLASSIFICAÇÃO DOS SACHÊS GUABI NATURAL -> ALIMENTO COMPLEMENTAR');
  console.log('================================================================\n');

  await ensureTunnelOpen();

  const products = await prisma.product.findMany({
    where: {
      brand: { contains: 'Guabi', mode: 'insensitive' },
      commercialName: { contains: 'Sachê' },
    },
    orderBy: { commercialName: 'asc' },
  });

  console.log(`📦 Encontrados ${products.length} sachês Guabi Natural para reclassificação.\n`);

  for (const prod of products) {
    console.log(`----------------------------------------------------------------`);
    console.log(`🐾 Atualizando: "${prod.commercialName}"`);
    console.log(`   ID: ${prod.id} | Espécie: ${prod.species}`);

    let parsedIngredients: string[] = [];
    try {
      parsedIngredients = Array.isArray(prod.topIngredients)
        ? prod.topIngredients
        : JSON.parse(prod.topIngredients || '[]');
    } catch {
      parsedIngredients = prod.topIngredients ? prod.topIngredients.split(',').map((s) => s.trim()) : [];
    }

    console.log(`   🤖 Gerando novo parecer editorial de Alimento Complementar via Gemini...`);
    let opinion = '';
    try {
      opinion = await generateEditorialOpinionWithGemini({
        commercialName: prod.commercialName,
        brand: prod.brand,
        species: prod.species as any,
        lifeStage: prod.lifeStage as any,
        breedSize: prod.breedSize as any,
        foodType: 'UMIDO',
        legalCategory: 'ALIMENTO_COMPLEMENTAR',
        score: null,
        tier: 'COMPLEMENTAR' as any,
        extratoPontos: [],
        antioxidantType: (prod.antioxidantType as any) || 'NATURAL',
        containsGmo: prod.containsGmo ?? false,
        garantias: {
          proteinaBrutaMinPct: prod.crudeProteinMinPct,
          extratoEtereoMinPct: prod.etherExtractMinPct,
          umidadeMaxPct: prod.moistureMaxPct,
          calcioMinPct: prod.calciumMinPct,
          calcioMaxPct: prod.calciumMaxPct,
          fosforoMinPct: prod.phosphorusMinPct,
          materiaFibrosaMaxPct: prod.crudeFiberMaxPct,
          materiaMineralMaxPct: prod.mineralMatterMaxPct,
          sodioMinPct: prod.sodiumMinPct,
          omega3MinPct: prod.omega3MinPct,
        },
        ingredientes: parsedIngredients,
      });
      console.log(`   ✓ Parecer gerado: "${opinion.slice(0, 120)}..."`);
    } catch (err: any) {
      console.warn(`   ⚠️ Erro ao chamar Gemini (${err.message}). Usando formato padrão.`);
      const fase = prod.species === 'GATO' ? 'gatos' : 'cães';
      opinion = `O ${prod.commercialName} classifica-se como alimento específico e complementar do tipo sachê úmido (topper de hidratação), formulado com carnes nobres e ingredientes naturais para enriquecer e umedecer a refeição diária de ${fase}. Por ser um alimento complementar de baixa caloria e alta umidade (94,5%), ele não contém suplementação vitamínico-mineral completa para atuar como dieta exclusiva e não substitui o alimento completo e balanceado. Deve ser oferecido misturado à ração seca ou como agrado, proporcionando variedade e excelente suporte hídrico.`;
    }

    await prisma.product.update({
      where: { id: prod.id },
      data: {
        legalCategory: 'ALIMENTO_COMPLEMENTAR',
        foodType: 'UMIDO',
        scoreTotal: null,
        classificationTier: 'COMPLEMENTAR',
        scoreBreakdown: Prisma.DbNull,
        editorialOpinion: opinion,
        updatedAt: new Date(),
      },
    });

    console.log(`   💾 Banco atualizado com sucesso para ALIMENTO_COMPLEMENTAR!`);
  }

  console.log('\n================================================================');
  console.log('🏁 RECLASSIFICAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('================================================================\n');

  await prisma.$disconnect();
  closeTunnel();
}

main().catch(async (err) => {
  console.error('❌ Erro no script:', err);
  await prisma.$disconnect();
  closeTunnel();
});
