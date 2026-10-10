import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { Especie, FaseVida, TipoAlimento, CategoriaLegal } from '../src/lib/audit-engine/types';

const DETERMINISTIC_REGEX = /(?:Alimento (?:seco|úmido) do segmento|Alimento dietoterápico coadjuvante formulado especialmente|Alimento específico \/ complementar|ao demonstrar atendimento aos pisos regulatórios|demonstrando alta densidade nutricional e atendimento pleno aos parâmetros do Manual Pet Food Brasil|Classificado Sob Observação \(|na auditoria técnica do PetRankings\..*A pontuação foi penalizada porque)/i;

export function syncProgressFile(allProducts: any[], lastDenialReason?: string) {
  const processed: any[] = [];
  const pending: any[] = [];

  for (const p of allProducts) {
    const isDeterministic = !p.editorialOpinion || p.editorialOpinion.trim().length === 0 || DETERMINISTIC_REGEX.test(p.editorialOpinion);

    if (isDeterministic) {
      pending.push({
        id: p.id,
        slug: p.slug,
        commercialName: p.commercialName,
        brand: p.brand,
        species: p.species,
        legalCategory: p.legalCategory,
        scoreTotal: p.scoreTotal,
        classificationTier: p.classificationTier,
      });
    } else {
      processed.push({
        id: p.id,
        slug: p.slug,
        commercialName: p.commercialName,
        brand: p.brand,
        species: p.species,
        legalCategory: p.legalCategory,
        scoreTotal: p.scoreTotal,
        classificationTier: p.classificationTier,
        updatedAt: p.updatedAt,
        editorialOpinionSnippet: p.editorialOpinion ? p.editorialOpinion.slice(0, 140) + '...' : '',
      });
    }
  }

  const outDir = path.join(process.cwd(), 'scripts', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filePath = path.join(outDir, 'editorial-revision-progress.json');

  const payload = {
    lastUpdated: new Date().toISOString(),
    lastDenialReason: lastDenialReason || null,
    summary: {
      totalProducts: allProducts.length,
      processedByGemini: processed.length,
      pending: pending.length,
      percentComplete: `${((processed.length / allProducts.length) * 100).toFixed(2)}%`,
    },
    processed,
    pending,
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
}

async function runEditorialRevision() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ ERRO CRÍTICO: Variável GEMINI_API_KEY não encontrada no ambiente (.env).');
    process.exit(1);
  }

  console.log('🔍 Identificando produtos com parecer editorial determinístico (não gerados pelo Gemini)...');

  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      species: true,
      lifeStage: true,
      foodType: true,
      legalCategory: true,
      coadjuvanteCondition: true,
      crudeProteinMinPct: true,
      etherExtractMinPct: true,
      calciumMinPct: true,
      calciumMaxPct: true,
      phosphorusMinPct: true,
      moistureMaxPct: true,
      antioxidantType: true,
      containsGmo: true,
      topIngredients: true,
      scoreTotal: true,
      classificationTier: true,
      scoreBreakdown: true,
      editorialOpinion: true,
      updatedAt: true,
    },
    orderBy: { id: 'asc' },
  });

  // Gera/sincroniza o arquivo JSON de progresso logo no início
  syncProgressFile(allProducts);

  const targetProducts = allProducts.filter((p) => {
    if (!p.editorialOpinion || p.editorialOpinion.trim().length === 0) return true;
    return DETERMINISTIC_REGEX.test(p.editorialOpinion);
  });

  console.log(`📊 Total de produtos no banco: ${allProducts.length}`);
  console.log(`🎯 Produtos para revisão pelo Gemini: ${targetProducts.length}`);

  if (targetProducts.length === 0) {
    console.log('✅ Nenhum produto pendente de revisão pelo Gemini!');
    return;
  }

  let successCount = 0;
  let stoppedDueToDenial = false;
  let stopReason = '';

  for (let i = 0; i < targetProducts.length; i++) {
    const product = targetProducts[i];
    const currentIndex = i + 1;
    const total = targetProducts.length;

    console.log(`\n[${currentIndex}/${total}] Processando: "${product.commercialName}" (${product.slug})...`);

    // 1. Processar ingredientes
    let topIngredientsList: string[] = [];
    try {
      topIngredientsList = JSON.parse(product.topIngredients);
    } catch {
      topIngredientsList = product.topIngredients.split(',').map((s) => s.trim());
    }

    try {
      const generatedText = await generateEditorialOpinionWithGemini({
        commercialName: product.commercialName,
        brand: product.brand,
        species: product.species as Especie,
        lifeStage: product.lifeStage as FaseVida,
        foodType: product.foodType as TipoAlimento,
        legalCategory: product.legalCategory as CategoriaLegal,
        coadjuvanteCondition: product.coadjuvanteCondition,
        proteinaBrutaMinPct: product.crudeProteinMinPct || 0,
        energiaMetabolizavelKcalKg: null,
        antioxidantType: product.antioxidantType as any,
        containsGmo: product.containsGmo,
        topIngredients: topIngredientsList,
        scoreTotal: product.scoreTotal,
        classificationTier: product.classificationTier || 'N/A',
        extratoPontos: Array.isArray(product.scoreBreakdown) ? (product.scoreBreakdown as any[]) : undefined,
        calcioMinPct: product.calciumMinPct || undefined,
        calcioMaxPct: product.calciumMaxPct,
        fosforoMinPct: product.phosphorusMinPct || undefined,
        umidadeMaxPct: product.moistureMaxPct || undefined,
        extratoEtereoMinPct: product.etherExtractMinPct || undefined,
      });

      // Salvar imediatamente no banco de dados
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          editorialOpinion: generatedText,
          updatedAt: new Date(),
        },
      });

      // Atualiza o produto na memória e no arquivo de progresso JSON
      product.editorialOpinion = generatedText;
      product.updatedAt = updated.updatedAt;
      syncProgressFile(allProducts);

      successCount++;
      console.log(`✅ [${successCount} atualizados] Texto gerado e salvo:`);
      console.log(`   "${generatedText.slice(0, 100)}..."`);

      // Pausa estratégica de 4.5 segundos entre requisições para evitar rate limit
      console.log('⏳ Pausa preventiva de 4.5 segundos...');
      await new Promise((r) => setTimeout(r, 4500));
    } catch (err: any) {
      stoppedDueToDenial = true;
      stopReason = err.message || 'Falha na comunicação com a API Gemini';
      console.warn(`\n🛑 [INTERRUPÇÃO MANDATÓRIA] O Gemini negou serviço ou falhou:`);
      console.warn(`   ${stopReason}`);
      console.warn(`   Parando o processo imediatamente conforme instrução do usuário.`);
      syncProgressFile(allProducts, stopReason);
      break;
    }
  }

  syncProgressFile(allProducts, stoppedDueToDenial ? stopReason : undefined);

  console.log('\n==================================================');
  console.log('📋 RELATÓRIO FINAL DA REVISÃO EDITORIAL:');
  console.log(`- Produtos revisados e salvos nesta execução: ${successCount}`);
  console.log(`- Processo parou por negação de serviço? ${stoppedDueToDenial ? 'SIM' : 'NÃO (Concluído com êxito)'}`);
  if (stoppedDueToDenial) {
    console.log(`- Motivo da parada: ${stopReason}`);
  }
  console.log('📁 Arquivo de progresso atualizado em: scripts/data/editorial-revision-progress.json');
  console.log('==================================================\n');
}

runEditorialRevision()
  .catch((e) => {
    console.error('Erro no script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
