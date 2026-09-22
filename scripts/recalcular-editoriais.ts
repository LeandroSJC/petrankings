import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { Especie, FaseVida, TipoAlimento, CategoriaLegal, AntioxidanteTipo } from '../src/lib/audit-engine/types';

async function main() {
  const args = process.argv.slice(2);
  const targetSlug = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const targetFilter = args.find((a) => a.startsWith('--filter='))?.split('=')[1];
  const processAll = args.includes('--all');

  console.log(`\n================================================================`);
  console.log(`🤖 RECALCULO EDITORIAL COM GOOGLE GEMINI 3.6 FLASH & AUDITORIA`);
  console.log(`================================================================\n`);

  let whereClause: any = {};
  if (targetSlug) {
    whereClause.slug = targetSlug;
    console.log(`🎯 Filtrando apenas pelo slug: "${targetSlug}"`);
  } else if (targetFilter) {
    whereClause.OR = [
      { commercialName: { contains: targetFilter, mode: 'insensitive' } },
      { brand: { contains: targetFilter, mode: 'insensitive' } },
      { slug: { contains: targetFilter, mode: 'insensitive' } },
    ];
    console.log(`🔍 Filtrando por termo: "${targetFilter}"`);
  } else if (!processAll) {
    // Por padrão sem flag, foca nos produtos que foram foco das auditorias recentes
    whereClause.OR = [
      { brand: { contains: 'whiskas', mode: 'insensitive' } },
    ];
    console.log(`ℹ️ Nenhuma flag passada. Processando produtos Whiskas por padrão.`);
    console.log(`   (Para processar todos os 44 produtos, use: npx tsx scripts/recalcular-editoriais.ts --all)`);
  } else {
    console.log(`🌐 Modo --all ativado: processando todos os produtos do catálogo.`);
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { commercialName: 'asc' },
  });

  console.log(`\nTotal de produtos selecionados: ${products.length}\n`);

  const dogBreedsRegex =
    /golden retriever|labrador|pit bull|bulldog|buldogue|pug|shih tzu|spitz|lhasa|malt[eê]s|yorkshire|rottweiler|pastor|poodle|beagle|dachshund|schnauzer|chihuahua|boxer|border collie|cocker|pinscher|dálmata|dalmata|basset/i;

  let speciesFixed = 0;
  let updatedCount = 0;

  for (const product of products) {
    // 1. Verificação e correção de espécie canina
    let species: Especie = product.species as Especie;
    const isGato =
      /gato|gatos|felin/i.test(product.commercialName) || /gato|gatos|felin/i.test(product.slug);
    const isCao =
      dogBreedsRegex.test(product.commercialName) ||
      dogBreedsRegex.test(product.slug) ||
      /c[ãa]o|c[ãa]es|cachorro|canin/i.test(product.commercialName) ||
      /c[ãa]o|c[ãa]es|cachorro|canin/i.test(product.slug);

    if (isCao && !isGato && species === 'GATO') {
      species = 'CAO';
      speciesFixed++;
      console.log(`   🐶 Espécie corrigida de GATO para CAO: "${product.commercialName}"`);
    }

    const lifeStage: FaseVida = product.lifeStage as FaseVida;
    const foodType: TipoAlimento = product.foodType as TipoAlimento;
    const legalCategory: CategoriaLegal = product.legalCategory as CategoriaLegal;
    const isCoadjuvante = legalCategory === 'ALIMENTO_COADJUVANTE';
    const isComplementar = legalCategory === 'ALIMENTO_COMPLEMENTAR';

    let topIngredients: string[] = [];
    try {
      topIngredients = JSON.parse(product.topIngredients || '[]');
    } catch {
      topIngredients = [];
    }

    const garantias = {
      umidadeMaxPct: product.moistureMaxPct || 10,
      proteinaBrutaMinPct: product.crudeProteinMinPct || 0,
      extratoEtereoMinPct: product.etherExtractMinPct || 0,
      materiaFibrosaMaxPct: product.crudeFiberMaxPct || 0,
      materiaMineralMaxPct: product.mineralMatterMaxPct || 0,
      calcioMinPct: product.calciumMinPct || 0,
      calcioMaxPct: product.calciumMaxPct,
      fosforoMinPct: product.phosphorusMinPct || 0,
      sodioMinPct: product.sodiumMinPct,
      omega3MinPct: product.omega3MinPct,
    };

    // 2. Recalcula Análise de Rótulo
    const audit = calcularScoreAnaliseRotulo(
      species,
      lifeStage,
      garantias,
      {
        topIngredientes: topIngredients,
        antioxidanteTipo: product.antioxidantType as AntioxidanteTipo,
        omega3OuPrebioticosGarantidos: (product.omega3MinPct ?? 0) > 0,
        claimCarneTipo: 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: foodType,
      },
      foodType
    );

    const finalScoreTotal = isCoadjuvante || isComplementar ? null : audit.scoreTotal;
    const finalClassificationTier = isCoadjuvante
      ? 'COADJUVANTE'
      : isComplementar
      ? 'COMPLEMENTAR'
      : audit.classificacaoFaixa;

    const finalScoreBreakdown = isComplementar
      ? [
          {
            pilar: 'Classificação Legal MAPA',
            pontos_obtidos: 0,
            pontos_max: 0,
            justificativa:
              'Alimento Específico / Complementar: Produto formulado como agrado, petisco ou hidratação suplementar. Não possui suplementação vitamínico-mineral completa de uso exclusivo, devendo ser oferecido em conjunto com a alimentação diária balanceada.',
          },
        ]
      : audit.extratoPontos;

    // 3. Gera parecer técnico transparente e imparcial via Gemini AI (com fallback determinístico)
    console.log(`🤖 Gerando parecer editorial com Gemini AI para: "${product.commercialName}"...`);
    const newEditorialOpinion = await generateEditorialOpinionWithGemini({
      commercialName: product.commercialName,
      brand: product.brand,
      species: species,
      lifeStage: lifeStage,
      foodType: foodType,
      legalCategory: legalCategory,
      coadjuvanteCondition: product.coadjuvanteCondition,
      proteinaBrutaMinPct: product.crudeProteinMinPct || 0,
      energiaMetabolizavelKcalKg: null,
      antioxidantType: product.antioxidantType as AntioxidanteTipo,
      containsGmo: product.containsGmo,
      topIngredients: topIngredients,
      scoreTotal: finalScoreTotal,
      classificationTier: finalClassificationTier,
      extratoPontos: audit.extratoPontos,
      calcioMinPct: product.calciumMinPct || 0,
      calcioMaxPct: product.calciumMaxPct,
      fosforoMinPct: product.phosphorusMinPct || 0,
      umidadeMaxPct: product.moistureMaxPct || 10,
    });

    console.log(`   📝 Parecer gerado:\n   "${newEditorialOpinion}"\n`);

    // 4. Atualiza no PostgreSQL
    await prisma.product.update({
      where: { id: product.id },
      data: {
        species: species,
        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: finalScoreBreakdown as any,
        editorialOpinion: newEditorialOpinion,
      },
    });

    updatedCount++;

    // Pausa preventiva de 1s para respeitar limites de taxa do Google AI Studio
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n================================================================`);
  console.log(`✅ Sincronização concluída com sucesso!`);
  console.log(`   - Produtos atualizados: ${updatedCount}`);
  console.log(`   - Espécies caninas corrigidas: ${speciesFixed}`);
  console.log(`================================================================\n`);
}

main()
  .catch((err) => {
    console.error('❌ Erro no recálculo:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
