import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';

async function main() {
  console.log('🔄 [PetRankings] Recalculando scores com o Motor Nutricional Calibrado (ABINPET 11ª Ed., MAPA, FEDIAF)...\n');

  const products = await prisma.product.findMany({
    where: {
      legalCategory: 'ALIMENTO_COMPLETO',
    },
  });

  console.log(`📦 Encontrados ${products.length} alimentos completos para reavaliação determinística.\n`);

  let atualizados = 0;
  let inalterados = 0;

  for (const p of products) {
    let ingredients: string[] = [];
    try {
      ingredients = Array.isArray(p.topIngredients)
        ? p.topIngredients
        : JSON.parse(p.topIngredients || '[]');
    } catch {
      ingredients = p.topIngredients
        ? p.topIngredients.split(',').map((s) => s.trim())
        : [];
    }

    const isFilhote = p.lifeStage === 'CRESCIMENTO_INICIAL' || p.lifeStage === 'CRESCIMENTO_FINAL' || p.lifeStage === 'FILHOTE';
    const auditFase: FaseVida = (isFilhote ? 'CRESCIMENTO_INICIAL' : p.lifeStage) as FaseVida;

    const isWet = p.foodType === 'UMIDO';
    const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(
      p.commercialName + ' ' + p.slug
    );

    const garantias = {
      umidadeMaxPct: p.moistureMaxPct ?? (isWet ? 82 : 10),
      proteinaBrutaMinPct: p.crudeProteinMinPct,
      extratoEtereoMinPct: p.etherExtractMinPct,
      materiaFibrosaMaxPct: p.crudeFiberMaxPct,
      materiaMineralMaxPct: p.mineralMatterMaxPct,
      calcioMinPct: p.calciumMinPct,
      calcioMaxPct: p.calciumMaxPct,
      fosforoMinPct: p.phosphorusMinPct,
      sodioMinPct: p.sodiumMinPct,
      omega3MinPct: p.omega3MinPct,
    };

    const audit = calcularScoreAnaliseRotulo(
      p.species as any,
      auditFase,
      garantias,
      {
        topIngredientes: ingredients,
        antioxidanteTipo: (p.antioxidantType as any) || 'SINTETICO',
        containsGmo: p.containsGmo,
        omega3OuPrebioticosGarantidos: isWet
          ? (p.omega3MinPct ?? 0) >= 0.015
          : (p.omega3MinPct ?? 0) >= 0.2,
        claimCarneTipo: (p.meatClaimType as any) || 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: p.foodType as any,
        isLightOuControlePeso: isLight,
        nomeComercial: p.commercialName,
      },
      p.foodType as any
    );

    const mudou = audit.scoreTotal !== p.scoreTotal || audit.classificacaoFaixa !== p.classificationTier;

    if (mudou) {
      atualizados++;
      await prisma.product.update({
        where: { id: p.id },
        data: {
          scoreTotal: audit.scoreTotal,
          classificationTier: audit.classificacaoFaixa,
          scoreBreakdown: audit.extratoPontos as any,
          calculatedAt: new Date(),
        },
      });

      if (atualizados <= 15 || atualizados % 100 === 0) {
        console.log(`[${atualizados}] ${p.commercialName}: ${p.scoreTotal} (${p.classificationTier}) ➔ ${audit.scoreTotal} (${audit.classificacaoFaixa})`);
      }
    } else {
      inalterados++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ Recálculo concluído com sucesso!`);
  console.log(`📊 Atualizados no PostgreSQL: ${atualizados}`);
  console.log(`⏸️ Inalterados (já estavam precisos): ${inalterados}`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
