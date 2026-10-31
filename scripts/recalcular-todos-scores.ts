import * as fs from 'fs';
import * as path from 'path';
import prisma from '../src/lib/prisma';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`🔄 [PetRankings] Recalculando scores com sincronização de custódia HTML (${isDryRun ? 'SIMULAÇÃO / DRY-RUN' : 'APLICAR NO BANCO'})...\n`);

  const products = await prisma.product.findMany({
    where: {
      legalCategory: 'ALIMENTO_COMPLETO',
    },
  });

  console.log(`📦 Encontrados ${products.length} alimentos completos para reavaliação determinística.\n`);

  let atualizados = 0;
  let inalterados = 0;
  let garantiasSincronizadas = 0;

  for (const p of products) {
    let htmlPath = '';
    const archiveUrl = p.sourceArchiveUrl || p.sourceDocumentUrl;
    if (archiveUrl && archiveUrl.includes('/uploads/')) {
      const filename = path.basename(archiveUrl);
      htmlPath = path.join(process.cwd(), 'public', 'uploads', filename);
    } else if (p.sourceDocumentUrl) {
      htmlPath = path.join(process.cwd(), 'public', p.sourceDocumentUrl);
    }
    if (!htmlPath || !fs.existsSync(htmlPath)) {
      htmlPath = path.join(process.cwd(), 'public', 'uploads', `ficha_${p.id}.html`);
    }

    let parsed: any = null;
    if (fs.existsSync(htmlPath)) {
      try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        parsed = parseProductFromHtml(html, p.sourceUrl);
      } catch (err) {
        // Fallback to DB fields
      }
    }

    const umidade = parsed ? parsed.umidadeMaxPct : (p.moistureMaxPct ?? (p.foodType === 'UMIDO' ? 82 : 10));
    const pb = parsed ? parsed.proteinaBrutaMinPct : p.crudeProteinMinPct;
    const ee = parsed ? parsed.extratoEtereoMinPct : p.etherExtractMinPct;
    const fb = parsed ? parsed.materiaFibrosaMaxPct : p.crudeFiberMaxPct;
    const mm = parsed ? parsed.materiaMineralMaxPct : p.mineralMatterMaxPct;
    const caMin = parsed ? parsed.calcioMinPct : p.calciumMinPct;
    const caMax = parsed ? parsed.calcioMaxPct : p.calciumMaxPct;
    const pMin = parsed ? parsed.fosforoMinPct : p.phosphorusMinPct;
    const sodio = parsed ? parsed.sodioMinPct : p.sodiumMinPct;
    const omega = parsed ? parsed.omega3MinPct : p.omega3MinPct;
    const gmo = parsed ? parsed.containsGmo : p.containsGmo;
    const antioxidant = parsed ? parsed.antioxidantType : p.antioxidantType;

    let ingredients: string[] = [];
    if (parsed && Array.isArray(parsed.topIngredients) && parsed.topIngredients.length > 0) {
      ingredients = parsed.topIngredients;
    } else if (parsed && Array.isArray(parsed.topIngredientsList) && parsed.topIngredientsList.length > 0) {
      ingredients = parsed.topIngredientsList;
    } else {
      try {
        ingredients = Array.isArray(p.topIngredients)
          ? p.topIngredients
          : JSON.parse(p.topIngredients || '[]');
      } catch {
        ingredients = p.topIngredients
          ? p.topIngredients.split(',').map((s) => s.trim())
          : [];
      }
    }

    const isFilhote = p.lifeStage === 'CRESCIMENTO_INICIAL' || p.lifeStage === 'CRESCIMENTO_FINAL' || p.lifeStage === 'FILHOTE';
    const auditFase: FaseVida = (isFilhote ? 'CRESCIMENTO_INICIAL' : p.lifeStage) as FaseVida;

    const isWet = p.foodType === 'UMIDO';
    const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(
      p.commercialName + ' ' + p.slug
    );

    const garantias = {
      umidadeMaxPct: umidade,
      proteinaBrutaMinPct: pb,
      extratoEtereoMinPct: ee,
      materiaFibrosaMaxPct: fb,
      materiaMineralMaxPct: mm,
      calcioMinPct: caMin,
      calcioMaxPct: caMax,
      fosforoMinPct: pMin,
      sodioMinPct: sodio,
      omega3MinPct: omega,
    };

    const audit = calcularScoreAnaliseRotulo(
      p.species as any,
      auditFase,
      garantias,
      {
        topIngredientes: ingredients,
        antioxidanteTipo: (antioxidant as any) || 'SINTETICO',
        containsGmo: gmo,
        omega3OuPrebioticosGarantidos: isWet
          ? (omega ?? 0) >= 0.015
          : (omega ?? 0) >= 0.2,
        claimCarneTipo: (p.meatClaimType as any) || 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: p.foodType as any,
        isLightOuControlePeso: isLight,
        nomeComercial: p.commercialName,
      },
      p.foodType as any
    );

    const caMaxDiff = caMax !== p.calciumMaxPct;
    const omegaDiff = (omega ?? null) !== (p.omega3MinPct ?? null);
    const scoreDiff = audit.scoreTotal !== p.scoreTotal || audit.classificacaoFaixa !== p.classificationTier;

    let breakdownDiff = false;
    const current = (p.scoreBreakdown as any[]) || [];
    const fresh = audit.extratoPontos || [];
    if (current.length !== fresh.length) {
      breakdownDiff = true;
    } else {
      for (let i = 0; i < current.length; i++) {
        if (
          current[i].pilar !== fresh[i].pilar ||
          current[i].pontos_obtidos !== fresh[i].pontos_obtidos ||
          current[i].pontos_max !== fresh[i].pontos_max ||
          current[i].justificativa !== fresh[i].justificativa
        ) {
          breakdownDiff = true;
          break;
        }
      }
    }

    if (caMaxDiff || omegaDiff) {
      garantiasSincronizadas++;
    }

    if (scoreDiff || caMaxDiff || omegaDiff || breakdownDiff) {
      atualizados++;
      if (!isDryRun) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            scoreTotal: audit.scoreTotal,
            classificationTier: audit.classificacaoFaixa,
            scoreBreakdown: audit.extratoPontos as any,
            calciumMinPct: caMin,
            calciumMaxPct: caMax,
            omega3MinPct: omega,
            sodiumMinPct: sodio,
            topIngredients: JSON.stringify(ingredients),
            calculatedAt: new Date(),
          },
        });
      }

      if (atualizados <= 15 || atualizados % 100 === 0 || p.slug.includes('dogchow-adultos-todos-os-tamanhos-sabor-cordeiro')) {
        console.log(`[${atualizados}] ${p.commercialName} (${p.slug}): ${p.scoreTotal} (${p.classificationTier}) ➔ ${audit.scoreTotal} (${audit.classificacaoFaixa})`);
      }
    } else {
      inalterados++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ Processamento concluído!`);
  console.log(`📊 Atualizados: ${atualizados}`);
  console.log(`🔄 Garantias ressincronizadas do HTML: ${garantiasSincronizadas}`);
  console.log(`⏸️ Inalterados: ${inalterados}`);
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
