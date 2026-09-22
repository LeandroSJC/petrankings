import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';

async function main() {
  console.log('🔄 Iniciando recálculo determinístico para alimentos úmidos no PostgreSQL...\n');

  const umidos = await prisma.product.findMany({
    where: { foodType: 'UMIDO' },
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      legalCategory: true,
      species: true,
      lifeStage: true,
      foodType: true,
      moistureMaxPct: true,
      crudeProteinMinPct: true,
      etherExtractMinPct: true,
      crudeFiberMaxPct: true,
      mineralMatterMaxPct: true,
      calciumMinPct: true,
      calciumMaxPct: true,
      phosphorusMinPct: true,
      sodiumMinPct: true,
      omega3MinPct: true,
      containsGmo: true,
      antioxidantType: true,
      meatClaimType: true,
      topIngredients: true,
      scoreTotal: true,
      classificationTier: true,
    },
  });

  console.log(`Encontrados ${umidos.length} produtos úmidos cadastrados.`);

  let atualizadosCompletos = 0;
  let reclassificadosComplementares = 0;
  let coadjuvantesMantidos = 0;

  for (const p of umidos) {
    const isCoadjuvante = p.legalCategory === 'ALIMENTO_COADJUVANTE' || /nutri[çc][ãa]o cl[íi]nica/i.test(p.commercialName);

    // Alimentos Complementares (Toppers em caldo de filé nobre sem premix mineral completo de cálcio/fósforo)
    const isComplementar =
      /premier.*gourmet/i.test(p.commercialName) ||
      (/nattu.*[úu]mido/i.test(p.commercialName) && (p.calciumMinPct || 0) <= 0.05) ||
      (/org[âa]nico/i.test(p.commercialName) && (p.calciumMinPct || 0) <= 0.05) ||
      ((p.calciumMinPct || 0) <= 0.05 && (p.phosphorusMinPct || 0) <= 0.08);

    if (isCoadjuvante) {
      console.log(`ℹ️ [COADJUVANTE] ${p.commercialName} — Mantido sem score competitivo.`);
      coadjuvantesMantidos++;
      continue;
    }

    if (isComplementar) {
      const tierLabel = /golden/i.test(p.commercialName) ? 'Premium Especial' : 'Super Premium';
      const faseLabel = p.lifeStage === 'CRESCIMENTO_INICIAL' ? 'filhotes' : (p.lifeStage === 'SENIOR' ? 'sênior' : 'adultos');
      const gmoStr = p.containsGmo ? 'com ingredientes transgênicos' : 'livre de transgênicos';
      const conservStr = p.antioxidantType === 'NATURAL' ? 'conservantes 100% naturais' : 'antioxidantes sintéticos';

      const opinion = `Alimento úmido complementar ${tierLabel} para ${p.species === 'GATO' ? 'gatos' : 'cães'} (${faseLabel}), à base de filés nobres em caldo com ${p.crudeProteinMinPct}% de proteína bruta, ${conservStr} e ${gmoStr}. Formulado sem premix mineral completo, destinado à hidratação suplementar e agrado, devendo ser oferecido em combinação com alimento completo habitual.`;

      // Reclassifica para ALIMENTO_COMPLEMENTAR
      await prisma.product.update({
        where: { id: p.id },
        data: {
          legalCategory: 'ALIMENTO_COMPLEMENTAR',
          classificationTier: 'COMPLEMENTAR',
          scoreTotal: null,
          editorialOpinion: opinion,
          scoreBreakdown: [
            {
              pilar: 'Classificação Legal MAPA',
              pontos_obtidos: 0,
              pontos_max: 0,
              justificativa:
                'Alimento Complementar / Específico: Indicado para agrado, recompensa e hidratação suplementar à base de filés nobres em caldo. Não possui premix mineral completo e deve ser oferecido associado a uma ração completa.',
            },
          ] as any,
          calculatedAt: new Date(),
        },
      });

      console.log(`⭐ [COMPLEMENTAR] ${p.commercialName} — Reclassificado para ALIMENTO_COMPLEMENTAR.`);
      reclassificadosComplementares++;
      continue;
    }

    // Alimento Completo Úmido (GoldeN Gourmet, PremieR Formula Úmidos)
    let ings: string[] = [];
    try {
      ings = JSON.parse(p.topIngredients);
    } catch {
      ings = p.topIngredients.split(',').map((s) => s.trim());
    }

    const audit = calcularScoreAnaliseRotulo(
      p.species as any,
      p.lifeStage as FaseVida,
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
        topIngredientes: ings,
        antioxidanteTipo: p.antioxidantType as any,
        omega3OuPrebioticosGarantidos: (p.omega3MinPct ?? 0) > 0,
        claimCarneTipo: (p.meatClaimType as any) || 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: 'UMIDO',
      },
      'UMIDO'
    );

    await prisma.product.update({
      where: { id: p.id },
      data: {
        legalCategory: 'ALIMENTO_COMPLETO',
        scoreTotal: audit.scoreTotal,
        classificationTier: audit.classificacaoFaixa,
        scoreBreakdown: audit.extratoPontos as any,
        calculatedAt: new Date(),
      },
    });

    console.log(
      `✅ [COMPLETO ÚMIDO] ${p.commercialName}: Score anterior = ${p.scoreTotal} -> NOVO SCORE = ${audit.scoreTotal} (${audit.faixaNomeFormatado})`
    );
    atualizadosCompletos++;
  }

  console.log('\n📊 Resumo da Atualização:');
  console.log(`- Alimentos Úmidos Completos recalculados: ${atualizadosCompletos}`);
  console.log(`- Alimentos Complementares (Toppers) reclassificados: ${reclassificadosComplementares}`);
  console.log(`- Alimentos Coadjuvantes Úmidos preservados: ${coadjuvantesMantidos}`);
  console.log('\nConcluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no recálculo:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
