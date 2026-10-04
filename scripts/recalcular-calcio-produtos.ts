import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import {
  calcularScoreAnaliseRotulo,
  generateTechnicalEditorialOpinion,
  FaseVida,
  TipoAlimento
} from '../src/lib/audit-engine';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`\n🔍 [Recálculo de Cálcio] Iniciando varredura (Modo: ${isDryRun ? 'DRY-RUN (Simulação)' : 'APLICAR NO BANCO'})...\n`);

  // Busca produtos Magnus, Qualidy, Origens, Bionatural ou com cálcio atípico
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { brand: { contains: 'Magnus', mode: 'insensitive' } },
        { brand: { contains: 'Qualidy', mode: 'insensitive' } },
        { brand: { contains: 'Origens', mode: 'insensitive' } },
        { brand: { contains: 'Bionatural', mode: 'insensitive' } },
        { calciumMinPct: { gt: 3.0 } },
        { calciumMaxPct: { gt: 4.0 } },
      ],
    },
    orderBy: { commercialName: 'asc' },
  });

  console.log(`📋 Encontrados ${products.length} produtos candidatos para revisão de Cálcio e recálculo.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    // Localiza o arquivo HTML correspondente
    let htmlPath = product.sourceDocumentUrl
      ? path.join(process.cwd(), 'public', product.sourceDocumentUrl)
      : path.join(process.cwd(), 'public', 'uploads', `ficha_${product.id}.html`);

    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.join(process.cwd(), 'public', 'uploads', `ficha_${product.id}.html`);
    }

    if (!fs.existsSync(htmlPath)) {
      console.warn(`⚠️ [PULADO] Arquivo HTML não encontrado para: "${product.commercialName}" (${htmlPath})`);
      skippedCount++;
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const parsed = parseProductFromHtml(html, product.sourceUrl);

    const oldMin = product.calciumMinPct;
    const oldMax = product.calciumMaxPct;
    const newMin = parsed.calcioMinPct;
    const newMax = parsed.calcioMaxPct;

    const hasChanged = oldMin !== newMin || oldMax !== newMax;

    if (!hasChanged) {
      skippedCount++;
      continue;
    }

    // Recalcula score oficial com os novos valores
    const auditFase: FaseVida = parsed.lifeStage;
    const foodType: TipoAlimento = parsed.foodType;

    const garantias = {
      umidadeMaxPct: parsed.umidadeMaxPct,
      proteinaBrutaMinPct: parsed.proteinaBrutaMinPct,
      extratoEtereoMinPct: parsed.extratoEtereoMinPct,
      materiaFibrosaMaxPct: parsed.materiaFibrosaMaxPct,
      materiaMineralMaxPct: parsed.materiaMineralMaxPct,
      calcioMinPct: parsed.calcioMinPct,
      calcioMaxPct: parsed.calcioMaxPct,
      fosforoMinPct: parsed.fosforoMinPct,
      sodioMinPct: parsed.sodioMinPct,
      omega3MinPct: parsed.omega3MinPct,
    };

    const isCoadjuvante = parsed.legalCategory === 'ALIMENTO_COADJUVANTE';
    const isComplementar = parsed.legalCategory === 'ALIMENTO_COMPLEMENTAR';

    const audit = calcularScoreAnaliseRotulo(
      parsed.species,
      auditFase,
      garantias,
      {
        topIngredientes: parsed.topIngredientsList,
        antioxidanteTipo: parsed.antioxidantType,
        omega3OuPrebioticosGarantidos: (parsed.omega3MinPct ?? 0) > 0,
        claimCarneTipo: 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: parsed.foodType,
      },
      parsed.foodType
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
            status: 'APROVADO' as const,
            justificativa:
              'Alimento específico / complementar (petisco, bifinho ou biscoito). Por determinação da IN MAPA 30/2009 e ABINPET 11ª Edição, não concorre em rankings bromatológicos de nutrição diária completa.',
          },
        ]
      : audit.extratoPontos;

    const editorialOpinion = generateTechnicalEditorialOpinion({
      commercialName: parsed.commercialName,
      brand: parsed.brand,
      species: parsed.species,
      lifeStage: parsed.lifeStage,
      legalCategory: parsed.legalCategory,
      coadjuvanteCondition: parsed.coadjuvanteCondition,
      foodType: parsed.foodType,
      proteinaBrutaMinPct: parsed.proteinaBrutaMinPct,
      extratoEtereoMinPct: parsed.extratoEtereoMinPct,
      materiaMineralMaxPct: parsed.materiaMineralMaxPct,
      materiaFibrosaMaxPct: parsed.materiaFibrosaMaxPct,
      antioxidantType: parsed.antioxidantType,
      containsGmo: parsed.containsGmo,
      topIngredients: parsed.topIngredientsList,
      scoreTotal: finalScoreTotal,
      classificationTier: finalClassificationTier,
      extratoPontos: audit.extratoPontos,
      calcioMinPct: parsed.calcioMinPct,
      calcioMaxPct: parsed.calcioMaxPct,
      fosforoMinPct: parsed.fosforoMinPct,
      umidadeMaxPct: parsed.umidadeMaxPct,
    });

    console.log(`✅ [${parsed.brand}] ${parsed.commercialName}`);
    console.log(`   Cálcio Mín: ${oldMin}% ➔ ${newMin}% | Cálcio Máx: ${oldMax}% ➔ ${newMax}%`);
    console.log(`   Score: ${product.scoreTotal ?? 'N/A'} ➔ ${finalScoreTotal ?? 'N/A'} (${finalClassificationTier})`);

    if (!isDryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          calciumMinPct: newMin,
          calciumMaxPct: newMax,
          scoreTotal: finalScoreTotal,
          classificationTier: finalClassificationTier,
          scoreBreakdown: finalScoreBreakdown as any,
          editorialOpinion: editorialOpinion,
          calculatedAt: new Date(),
        },
      });
    }

    updatedCount++;
  }

  console.log(`\n======================================================`);
  console.log(`🎉 Resumo da Operação:`);
  console.log(`   - Atualizados: ${updatedCount}`);
  console.log(`   - Sem alteração: ${skippedCount}`);
  console.log(`   - Modo: ${isDryRun ? 'DRY-RUN (Nenhuma alteração gravada)' : 'GRAVADO COM SUCESSO NO BANCO'}`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro na execução:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
