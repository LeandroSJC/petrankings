import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';

async function main() {
  console.log('🔄 Recalculando scores de todos os produtos com o novo dicionário de proteínas...\n');

  const products = await prisma.product.findMany();

  for (const p of products) {
    let ingredients: string[] = [];
    try {
      ingredients = JSON.parse(p.topIngredients || '[]');
    } catch {
      ingredients = [];
    }

    const auditFase: FaseVida = p.lifeStage as FaseVida;
    const garantias = {
      umidadeMaxPct: p.moistureMaxPct || 10,
      proteinaBrutaMinPct: p.crudeProteinMinPct || 30,
      extratoEtereoMinPct: p.etherExtractMinPct || 10,
      materiaFibrosaMaxPct: p.crudeFiberMaxPct || 4,
      materiaMineralMaxPct: p.mineralMatterMaxPct || 8,
      calcioMinPct: p.calciumMinPct || 1,
      calcioMaxPct: p.calciumMaxPct || 1.5,
      fosforoMinPct: p.phosphorusMinPct || 0.8,
      sodioMinPct: p.sodiumMinPct || 0.2,
      omega3MinPct: p.omega3MinPct || 0.3,
    };

    const audit = calcularScoreAnaliseRotulo(
      p.species as any,
      auditFase,
      garantias,
      {
        topIngredientes: ingredients.slice(0, 3),
        antioxidanteTipo: p.antioxidantType as any,
        omega3OuPrebioticosGarantidos: (p.omega3MinPct ?? 0) > 0,
        claimCarneTipo: (p.meatClaimType as any) || 'COM_CARNE',
        claimCarneAdequado: true,
      }
    );

    const scoreMudou = audit.scoreTotal !== p.scoreTotal;

    if (scoreMudou) {
      console.log(`✨ [ATUALIZADO] ${p.commercialName}`);
      console.log(`   Ingrediente 1: "${ingredients[0]}"`);
      console.log(`   Ingrediente 2: "${ingredients[1]}"`);
      console.log(`   Score Anterior: ${p.scoreTotal} ➔ Novo Score: ${audit.scoreTotal} (${audit.classificacaoFaixa})`);
      const pilar3 = audit.extratoPontos.find((it: any) => it.pilar === 'Ingredientes Principais');
      console.log(`   Justificativa Pilar 3: ${pilar3?.justificativa}\n`);

      await prisma.product.update({
        where: { id: p.id },
        data: {
          scoreTotal: audit.scoreTotal,
          classificationTier: audit.classificacaoFaixa,
          scoreBreakdown: audit.extratoPontos as any,
          calculatedAt: new Date(),
        },
      });
    }
  }

  console.log('✅ Verificação e sincronização concluídas!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
