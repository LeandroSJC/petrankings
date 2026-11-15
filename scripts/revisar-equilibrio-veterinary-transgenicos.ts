import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';

const TARGET_SLUGS = [
  'veterinary-gatos-obesity-diabetic',
  'veterinary-gatos-urinary',
  'veterinary-hypoallergenic',
  'veterinary-obesity-diabetic',
  'veterinary-renal',
  'veterinary-urinary',
  // Inclui também os 5 novos para enriquecer os doadores de genes no gmoIngredients
  'veterinary-hepatic',
  'veterinary-intestinal',
  'veterinary-gatos-renal',
  'veterinary-gatos-intestinal',
  'veterinary-cardiac'
];

async function main() {
  console.log('================================================================');
  console.log('🧬 REVISÃO CIENTÍFICA: TRANSGÊNICOS EQUILÍBRIO VETERINARY');
  console.log('================================================================\n');

  await ensureTunnelOpen();

  for (let i = 0; i < TARGET_SLUGS.length; i++) {
    const slug = TARGET_SLUGS[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[${i + 1}/${TARGET_SLUGS.length}] Auditando: ${slug}`);
    console.log(`----------------------------------------------------------------`);

    const prod = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        commercialName: true,
        species: true,
        lifeStage: true,
        foodType: true,
        legalCategory: true,
        coadjuvanteCondition: true,
        sourceUrl: true,
        sourceDocumentUrl: true,
        containsGmo: true,
        gmoIngredients: true,
      }
    });

    if (!prod) {
      console.warn(`⚠️ Produto não encontrado no banco: ${slug}`);
      continue;
    }

    if (!prod.sourceDocumentUrl) {
      console.warn(`⚠️ Produto sem sourceDocumentUrl cadastrado: ${slug}`);
      continue;
    }

    const htmlPath = path.join(process.cwd(), 'public', prod.sourceDocumentUrl.replace(/^\//, ''));
    if (!fs.existsSync(htmlPath)) {
      console.warn(`⚠️ Arquivo de custódia não encontrado em: ${htmlPath}`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const meta = parseProductFromHtml(html, prod.sourceUrl);

    console.log(`📦 Nome Oficial Corrigido: "${meta.commercialName}"`);
    console.log(`🧬 Transgênico Anterior: ${prod.containsGmo} (${prod.gmoIngredients || 'Nenhum'})`);
    console.log(`✅ Transgênico Corrigido: ${meta.containsGmo} (${meta.gmoIngredients})`);
    console.log(`🥗 Ingredientes: ${meta.topIngredientsList.length} itens identificados`);

    // Auditoria para cálculo de extrato e parecer
    const isWet = meta.foodType === 'UMIDO';
    const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(meta.commercialName);
    const audit = calcularScoreAnaliseRotulo(
      meta.species as any,
      meta.lifeStage as any,
      {
        umidadeMaxPct: meta.umidadeMaxPct,
        proteinaBrutaMinPct: meta.proteinaBrutaMinPct,
        extratoEtereoMinPct: meta.extratoEtereoMinPct,
        materiaFibrosaMaxPct: meta.materiaFibrosaMaxPct,
        materiaMineralMaxPct: meta.materiaMineralMaxPct,
        calcioMinPct: meta.calcioMinPct,
        calcioMaxPct: meta.calcioMaxPct,
        fosforoMinPct: meta.fosforoMinPct,
        sodioMinPct: meta.sodioMinPct,
        omega3MinPct: meta.omega3MinPct,
      },
      {
        topIngredientes: meta.topIngredientsList,
        antioxidanteTipo: meta.antioxidantType as any,
        omega3OuPrebioticosGarantidos: isWet
          ? !!(meta.omega3MinPct && meta.omega3MinPct >= 0.015)
          : !!(meta.omega3MinPct && meta.omega3MinPct >= 0.2),
        claimCarneTipo: 'COM_CARNE',
        isLightOuControlePeso: isLight,
        nomeComercial: meta.commercialName,
        containsGmo: meta.containsGmo,
      },
      meta.foodType as any
    );

    console.log('🤖 Gerando parecer editorial atualizado com contexto de OGM e clínico via Gemini...');
    const editorialOpinion = await generateEditorialOpinionWithGemini({
      commercialName: meta.commercialName,
      brand: meta.brand,
      species: meta.species,
      lifeStage: meta.lifeStage,
      foodType: meta.foodType,
      legalCategory: 'ALIMENTO_COADJUVANTE',
      coadjuvanteCondition: prod.coadjuvanteCondition,
      proteinaBrutaMinPct: meta.proteinaBrutaMinPct,
      energiaMetabolizavelKcalKg: meta.energiaMetabolizavelKcalKg,
      antioxidantType: meta.antioxidantType,
      containsGmo: meta.containsGmo,
      topIngredients: meta.topIngredientsList,
      scoreTotal: null,
      classificationTier: 'COADJUVANTE',
      extratoPontos: audit.extratoPontos,
      calcioMinPct: meta.calcioMinPct,
      calcioMaxPct: meta.calcioMaxPct,
      fosforoMinPct: meta.fosforoMinPct,
      umidadeMaxPct: meta.umidadeMaxPct,
      extratoEtereoMinPct: meta.extratoEtereoMinPct,
    });

    // Atualiza registro no PostgreSQL
    await prisma.product.update({
      where: { id: prod.id },
      data: {
        commercialName: meta.commercialName,
        brand: meta.brand,
        containsGmo: meta.containsGmo,
        gmoIngredients: meta.gmoIngredients,
        topIngredients: JSON.stringify(meta.topIngredientsList),
        antioxidantType: meta.antioxidantType,
        scoreTotal: null,
        classificationTier: 'COADJUVANTE',
        legalCategory: 'ALIMENTO_COADJUVANTE',
        editorialOpinion,
      }
    });

    console.log(`💾 [${slug}] Registro atualizado com sucesso no banco de dados.`);
  }

  console.log('\n================================================================');
  console.log('🔍 AUDITORIA FINAL DE TRANSGÊNICOS NA LINHA EQUILÍBRIO VETERINARY');
  console.log('================================================================');

  const finalProds = await prisma.product.findMany({
    where: { slug: { in: TARGET_SLUGS } },
    select: {
      slug: true,
      commercialName: true,
      species: true,
      containsGmo: true,
      gmoIngredients: true,
      coadjuvanteCondition: true,
    },
    orderBy: { slug: 'asc' }
  });

  for (const p of finalProds) {
    console.log(`\n✓ [${p.slug}]`);
    console.log(`  Nome: ${p.commercialName} (${p.species})`);
    console.log(`  Condição: ${p.coadjuvanteCondition}`);
    console.log(`  containsGmo: ${p.containsGmo ? 'SIM (100% verificado)' : 'NÃO'}`);
    console.log(`  gmoIngredients: ${p.gmoIngredients}`);
  }

  closeTunnel();
}

main().catch(err => {
  console.error('Fatal:', err);
  closeTunnel();
  process.exit(1);
});
