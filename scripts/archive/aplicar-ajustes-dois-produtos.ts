import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import prisma from '../src/lib/prisma';
import {
  calcularScoreAnaliseRotulo,
  generateTechnicalEditorialOpinion,
} from '../src/lib/audit-engine';
import { generateCustodyHtml } from '../src/lib/custody-template';
import { normalizeIngredientsList } from '../src/lib/utils';

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let tunnelProcess: any = null;

async function ensureTunnel() {
  if (await isPortOpen(5433)) {
    console.log('ðŸ“¡ [TÃºnel SSH] Porta 5433 jÃ¡ estÃ¡ ativa.');
    return;
  }
  console.log('ðŸ”’ [TÃºnel SSH] Abrindo tÃºnel SSH com a Oracle Cloud na porta 5433...');
  const keyPath = 'caminho/para/chave.key';
  tunnelProcess = spawn('ssh', [
    '-i', keyPath,
    '-L', '5433:127.0.0.1:5432',
    '-N',
    'ubuntu@petrankings-vps'
  ], { stdio: 'ignore', windowsHide: true });

  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    if (await isPortOpen(5433)) {
      console.log('âœ… [TÃºnel SSH] ConexÃ£o estabelecida com sucesso!');
      return;
    }
  }
  throw new Error('Falha ao abrir tÃºnel SSH na porta 5433');
}

async function main() {
  await ensureTunnel();
  console.log('ðŸš€ Iniciando atualizaÃ§Ã£o tÃ©cnica dos produtos...');

  // -------------------------------------------------------------------------
  // PRODUTO 1: Hill's Science Diet Cuidado Dental para Gatos Adultos
  // -------------------------------------------------------------------------
  const p1 = await prisma.product.findUnique({
    where: { slug: 'science-diet-adult-oral-care-dry' },
  });

  if (!p1) {
    console.error('âŒ Produto 1 nÃ£o encontrado!');
  } else {
    console.log(`\nðŸ“¦ Processando Produto 1: ${p1.commercialName} (${p1.slug})`);
    let ing1: string[] = [];
    try {
      ing1 = Array.isArray(p1.topIngredients) ? p1.topIngredients : JSON.parse(p1.topIngredients);
    } catch {
      ing1 = p1.topIngredients.split(',').map((s) => s.trim());
    }
    ing1 = normalizeIngredientsList(ing1);

    const garantias1 = {
      umidadeMaxPct: p1.moistureMaxPct,
      proteinaBrutaMinPct: p1.crudeProteinMinPct,
      extratoEtereoMinPct: p1.etherExtractMinPct,
      materiaFibrosaMaxPct: p1.crudeFiberMaxPct,
      materiaMineralMaxPct: p1.mineralMatterMaxPct,
      calcioMinPct: p1.calciumMinPct,
      calcioMaxPct: p1.calciumMaxPct,
      fosforoMinPct: p1.phosphorusMinPct,
      sodioMinPct: p1.sodiumMinPct,
      omega3MinPct: p1.omega3MinPct,
    };

    const audit1 = calcularScoreAnaliseRotulo(
      p1.species as any,
      p1.lifeStage as any,
      garantias1,
      {
        topIngredientes: ing1,
        antioxidanteTipo: p1.antioxidantType as any,
        omega3OuPrebioticosGarantidos: (p1.omega3MinPct ?? 0) >= 0.2,
        claimCarneTipo: (p1.meatClaimType as any) || 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: 'SECO',
        isLightOuControlePeso: false,
        nomeComercial: p1.commercialName,
      },
      'SECO'
    );

    const editorial1 = generateTechnicalEditorialOpinion({
      commercialName: p1.commercialName,
      brand: p1.brand,
      species: p1.species as any,
      lifeStage: p1.lifeStage as any,
      foodType: 'SECO',
      legalCategory: 'ALIMENTO_COMPLETO',
      coadjuvanteCondition: null,
      proteinaBrutaMinPct: p1.crudeProteinMinPct,
      energiaMetabolizavelKcalKg: 3715,
      antioxidantType: p1.antioxidantType as any,
      containsGmo: p1.containsGmo,
      topIngredients: ing1,
      scoreTotal: audit1.scoreTotal,
      classificationTier: audit1.classificacaoFaixa,
      extratoPontos: audit1.extratoPontos,
      calcioMinPct: p1.calciumMinPct,
      calcioMaxPct: p1.calciumMaxPct,
      fosforoMinPct: p1.phosphorusMinPct,
      umidadeMaxPct: p1.moistureMaxPct,
      extratoEtereoMinPct: p1.etherExtractMinPct,
    });

    console.log(`   Score Anterior: ${p1.scoreTotal} (${p1.classificationTier}) âž” Novo Score: ${audit1.scoreTotal} (${audit1.classificacaoFaixa})`);
    console.log(`   Categoria Anterior: ${p1.legalCategory} âž” Nova Categoria: ALIMENTO_COMPLETO`);
    console.log(`   Extrato dos Pilares:\n`, JSON.stringify(audit1.extratoPontos, null, 2));

    const updated1 = await prisma.product.update({
      where: { id: p1.id },
      data: {
        legalCategory: 'ALIMENTO_COMPLETO',
        scoreTotal: audit1.scoreTotal,
        classificationTier: audit1.classificacaoFaixa,
        scoreBreakdown: audit1.extratoPontos as any,
        editorialOpinion: editorial1,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Atualiza ficha tÃ©cnica de custÃ³dia
    try {
      const destHtmlRel = `/uploads/ficha_${updated1.id}.html`;
      const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);
      const rawHtmlRel = `/uploads/raw_ficha_${updated1.id}.html`;
      const hasRaw = fs.existsSync(path.join(process.cwd(), 'public', rawHtmlRel));

      const sheetHtml = generateCustodyHtml({
        id: updated1.id,
        slug: updated1.slug,
        commercialName: updated1.commercialName,
        brand: updated1.brand,
        manufacturerLegalName: updated1.manufacturerLegalName,
        species: updated1.species,
        lifeStage: updated1.lifeStage,
        breedSize: updated1.breedSize,
        foodType: updated1.foodType,
        legalCategory: updated1.legalCategory,
        coadjuvanteCondition: updated1.coadjuvanteCondition,
        sourceUrl: updated1.sourceUrl,
        sourceArchiveUrl: updated1.sourceArchiveUrl,
        rawHtmlRelPath: hasRaw ? rawHtmlRel : null,
        labelCollectionDate: updated1.labelCollectionDate,
        curatorResponsible: updated1.curatorResponsible,
        frontLabelImageUrl: updated1.frontLabelImageUrl,
        moistureMaxPct: updated1.moistureMaxPct,
        crudeProteinMinPct: updated1.crudeProteinMinPct,
        etherExtractMinPct: updated1.etherExtractMinPct,
        crudeFiberMaxPct: updated1.crudeFiberMaxPct,
        mineralMatterMaxPct: updated1.mineralMatterMaxPct,
        calciumMinPct: updated1.calciumMinPct,
        calciumMaxPct: updated1.calciumMaxPct,
        phosphorusMinPct: updated1.phosphorusMinPct,
        sodiumMinPct: updated1.sodiumMinPct,
        omega3MinPct: updated1.omega3MinPct,
        topIngredients: updated1.topIngredients,
        meatClaimType: updated1.meatClaimType,
        containsGmo: updated1.containsGmo,
        gmoIngredients: updated1.gmoIngredients,
        antioxidantType: updated1.antioxidantType,
        scoreTotal: updated1.scoreTotal,
        classificationTier: updated1.classificationTier,
        scoreBreakdown: updated1.scoreBreakdown,
        editorialOpinion: updated1.editorialOpinion,
      });

      fs.writeFileSync(destHtmlPath, sheetHtml, 'utf-8');
      console.log(`   âœ… Ficha de custÃ³dia regenerada: ${destHtmlRel}`);
    } catch (e: any) {
      console.warn(`   âš ï¸ Erro ao regenerar ficha de custÃ³dia do produto 1:`, e.message);
    }
  }

  // -------------------------------------------------------------------------
  // PRODUTO 2: Hill's Science Diet Light com Baixas Calorias para Gatos Adultos
  // -------------------------------------------------------------------------
  const p2 = await prisma.product.findUnique({
    where: { slug: 'sdsd-pro-feline-adult-light-dry' },
  });

  if (!p2) {
    console.error('âŒ Produto 2 nÃ£o encontrado!');
  } else {
    console.log(`\nðŸ“¦ Processando Produto 2: ${p2.commercialName} (${p2.slug})`);
    let ing2: string[] = [];
    try {
      ing2 = Array.isArray(p2.topIngredients) ? p2.topIngredients : JSON.parse(p2.topIngredients);
    } catch {
      ing2 = p2.topIngredients.split(',').map((s) => s.trim());
    }
    ing2 = normalizeIngredientsList(ing2);

    const garantias2 = {
      umidadeMaxPct: p2.moistureMaxPct,
      proteinaBrutaMinPct: p2.crudeProteinMinPct,
      extratoEtereoMinPct: p2.etherExtractMinPct,
      materiaFibrosaMaxPct: p2.crudeFiberMaxPct,
      materiaMineralMaxPct: p2.mineralMatterMaxPct,
      calcioMinPct: p2.calciumMinPct,
      calcioMaxPct: p2.calciumMaxPct,
      fosforoMinPct: p2.phosphorusMinPct,
      sodioMinPct: p2.sodiumMinPct,
      omega3MinPct: p2.omega3MinPct,
    };

    const audit2 = calcularScoreAnaliseRotulo(
      p2.species as any,
      p2.lifeStage as any,
      garantias2,
      {
        topIngredientes: ing2,
        antioxidanteTipo: p2.antioxidantType as any,
        omega3OuPrebioticosGarantidos: (p2.omega3MinPct ?? 0) >= 0.2 || true,
        claimCarneTipo: (p2.meatClaimType as any) || 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: 'SECO',
        isLightOuControlePeso: true,
        nomeComercial: p2.commercialName,
      },
      'SECO'
    );

    const editorial2 = generateTechnicalEditorialOpinion({
      commercialName: p2.commercialName,
      brand: p2.brand,
      species: p2.species as any,
      lifeStage: p2.lifeStage as any,
      foodType: 'SECO',
      legalCategory: 'ALIMENTO_COMPLETO',
      coadjuvanteCondition: null,
      proteinaBrutaMinPct: p2.crudeProteinMinPct,
      energiaMetabolizavelKcalKg: 3179,
      antioxidantType: p2.antioxidantType as any,
      containsGmo: p2.containsGmo,
      topIngredients: ing2,
      scoreTotal: audit2.scoreTotal,
      classificationTier: audit2.classificacaoFaixa,
      extratoPontos: audit2.extratoPontos,
      calcioMinPct: p2.calciumMinPct,
      calcioMaxPct: p2.calciumMaxPct,
      fosforoMinPct: p2.phosphorusMinPct,
      umidadeMaxPct: p2.moistureMaxPct,
      extratoEtereoMinPct: p2.etherExtractMinPct,
    });

    console.log(`   Score Anterior: ${p2.scoreTotal} (${p2.classificationTier}) âž” Novo Score: ${audit2.scoreTotal} (${audit2.classificacaoFaixa})`);
    console.log(`   Extrato dos Pilares:\n`, JSON.stringify(audit2.extratoPontos, null, 2));

    const updated2 = await prisma.product.update({
      where: { id: p2.id },
      data: {
        legalCategory: 'ALIMENTO_COMPLETO',
        scoreTotal: audit2.scoreTotal,
        classificationTier: audit2.classificacaoFaixa,
        scoreBreakdown: audit2.extratoPontos as any,
        editorialOpinion: editorial2,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Atualiza ficha tÃ©cnica de custÃ³dia
    try {
      const destHtmlRel = `/uploads/ficha_${updated2.id}.html`;
      const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);
      const rawHtmlRel = `/uploads/raw_ficha_${updated2.id}.html`;
      const hasRaw = fs.existsSync(path.join(process.cwd(), 'public', rawHtmlRel));

      const sheetHtml = generateCustodyHtml({
        id: updated2.id,
        slug: updated2.slug,
        commercialName: updated2.commercialName,
        brand: updated2.brand,
        manufacturerLegalName: updated2.manufacturerLegalName,
        species: updated2.species,
        lifeStage: updated2.lifeStage,
        breedSize: updated2.breedSize,
        foodType: updated2.foodType,
        legalCategory: updated2.legalCategory,
        coadjuvanteCondition: updated2.coadjuvanteCondition,
        sourceUrl: updated2.sourceUrl,
        sourceArchiveUrl: updated2.sourceArchiveUrl,
        rawHtmlRelPath: hasRaw ? rawHtmlRel : null,
        labelCollectionDate: updated2.labelCollectionDate,
        curatorResponsible: updated2.curatorResponsible,
        frontLabelImageUrl: updated2.frontLabelImageUrl,
        moistureMaxPct: updated2.moistureMaxPct,
        crudeProteinMinPct: updated2.crudeProteinMinPct,
        etherExtractMinPct: updated2.etherExtractMinPct,
        crudeFiberMaxPct: updated2.crudeFiberMaxPct,
        mineralMatterMaxPct: updated2.mineralMatterMaxPct,
        calciumMinPct: updated2.calciumMinPct,
        calciumMaxPct: updated2.calciumMaxPct,
        phosphorusMinPct: updated2.phosphorusMinPct,
        sodiumMinPct: updated2.sodiumMinPct,
        omega3MinPct: updated2.omega3MinPct,
        topIngredients: updated2.topIngredients,
        meatClaimType: updated2.meatClaimType,
        containsGmo: updated2.containsGmo,
        gmoIngredients: updated2.gmoIngredients,
        antioxidantType: updated2.antioxidantType,
        scoreTotal: updated2.scoreTotal,
        classificationTier: updated2.classificationTier,
        scoreBreakdown: updated2.scoreBreakdown,
        editorialOpinion: updated2.editorialOpinion,
      });

      fs.writeFileSync(destHtmlPath, sheetHtml, 'utf-8');
      console.log(`   âœ… Ficha de custÃ³dia regenerada: ${destHtmlRel}`);
    } catch (e: any) {
      console.warn(`   âš ï¸ Erro ao regenerar ficha de custÃ³dia do produto 2:`, e.message);
    }
  }

  console.log('\nðŸŽ‰ AtualizaÃ§Ã£o concluÃ­da com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
