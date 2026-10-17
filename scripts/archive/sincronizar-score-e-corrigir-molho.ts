import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';

async function main() {
  console.log('🐾 1. Corrigindo classificação de Molho Especial Dudogs Sabor Carne...');
  await prisma.product.update({
    where: { slug: 'molho-especial-dudogs-sabor-carne' },
    data: {
      legalCategory: 'ALIMENTO_COMPLEMENTAR',
      scoreTotal: null,
      classificationTier: 'COMPLEMENTAR',
      scoreBreakdown: [
        {
          pilar: 'Classificação Legal MAPA',
          pontos_obtidos: 0,
          pontos_max: 0,
          justificativa:
            'Alimento Específico / Complementar: Produto formulado como molho palatabilizante para cobertura na ração seca. O fabricante declara expressamente no rótulo oficial que este produto NÃO substitui o alimento completo, não devendo ser fornecido como refeição diária exclusiva.',
        },
      ],
      editorialOpinion:
        'O Molho Especial Dudogs Sabor Carne é classificado como alimento específico/complementar destinado a enriquecer o paladar e aumentar a atratividade da alimentação de cães adultos. Conforme advertência regulatória expressa do fabricante no rótulo oficial (em conformidade com as normas do MAPA), este produto não substitui o alimento completo e balanceado, atuando como cobertura palatabilizante sobre a ração seca diária. Sua composição traz hidrolisado de fígado de suíno, alho e enriquecimento vitamínico-mineral, contando com conservação por BHT e sorbato de potássio.',
      calculatedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Molho Especial Dudogs atualizado para ALIMENTO_COMPLEMENTAR (scoreTotal = null).');

  console.log('\n📊 2. Sincronizando scores de todos os produtos do banco de dados...');
  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const p of products) {
    if (p.legalCategory === 'ALIMENTO_COADJUVANTE' || p.legalCategory === 'ALIMENTO_COMPLEMENTAR') {
      // Garante que alimentos coadjuvantes e complementares nunca tenham scoreTotal residual
      if (p.scoreTotal !== null) {
        await prisma.product.update({
          where: { id: p.id },
          data: { scoreTotal: null, updatedAt: new Date() },
        });
        console.log(`🧹 [LIMPEZA] Removido scoreTotal de ${p.commercialName} (${p.legalCategory})`);
      }
      continue;
    }

    let ingredients: string[] = [];
    try {
      ingredients = JSON.parse(p.topIngredients || '[]');
    } catch {
      ingredients = p.topIngredients ? p.topIngredients.split(',') : [];
    }

    const isWet = p.foodType === 'UMIDO';
    const isFilhote =
      p.lifeStage === 'CRESCIMENTO_INICIAL' ||
      p.lifeStage === 'CRESCIMENTO_FINAL' ||
      p.lifeStage === 'FILHOTE';
    const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(
      p.commercialName + ' ' + p.slug
    );

    const audit = calcularScoreAnaliseRotulo(
      p.species as any,
      (isFilhote ? 'CRESCIMENTO_INICIAL' : p.lifeStage) as any,
      {
        umidadeMaxPct: p.moistureMaxPct,
        proteinaBrutaMinPct: p.crudeProteinMinPct,
        extratoEtereoMinPct: p.etherExtractMinPct,
        materiaFibrosaMaxPct: p.crudeFiberMaxPct,
        materiaMineralMaxPct: p.mineralMatterMaxPct,
        calcioMinPct: p.calciumMinPct,
        calcioMaxPct: p.calciumMaxPct,
        fosforoMinPct: p.phosphorusMinPct,
        sodioMinPct: p.sodiumMinPct,
        omega3MinPct: p.omega3MinPct,
      },
      {
        topIngredientes: ingredients,
        antioxidanteTipo: p.antioxidantType as any,
        omega3OuPrebioticosGarantidos: isWet
          ? !!(p.omega3MinPct && p.omega3MinPct >= 0.015)
          : !!(p.omega3MinPct && p.omega3MinPct >= 0.2),
        claimCarneTipo: (p.meatClaimType as any) || 'COM_CARNE',
        isLightOuControlePeso: isLight,
        nomeComercial: p.commercialName,
      },
      p.foodType as any
    );

    const scoreDiverge = p.scoreTotal !== audit.scoreTotal;
    const faixaDiverge = p.classificationTier !== audit.classificacaoFaixa;

    if (scoreDiverge || faixaDiverge) {
      updatedCount++;
      console.log(
        `🔄 [SYNC] ${p.slug}: Score ${p.scoreTotal} -> ${audit.scoreTotal} | Faixa ${p.classificationTier} -> ${audit.classificacaoFaixa}`
      );
      await prisma.product.update({
        where: { id: p.id },
        data: {
          scoreTotal: audit.scoreTotal,
          classificationTier: audit.classificacaoFaixa,
          scoreBreakdown: audit.extratoPontos as any,
          calculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }

  console.log(`\n🎉 Sincronização concluída! ${updatedCount} produtos atualizados no banco.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
