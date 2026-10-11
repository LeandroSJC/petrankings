import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import { PrismaClient } from '@prisma/client';
import { stripFootnotesFromIngredient, normalizeIngredient } from '../src/lib/utils';
import {
  calcularScoreAnaliseRotulo,
  generateEditorialOpinionWithGemini,
  generateTechnicalEditorialOpinion,
} from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';
import { generateCustodyHtml } from '../src/lib/custody-template';

function parseIngredients(text: string): string[] {
  let clean = text
    .replace(/^INGREDIENTES[:\s]*/i, '')
    .replace(/\.?\s*Energia\s+Metaboliz[aÃ¡]vel[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const list: string[] = [];
  let cur = '';
  let parenDepth = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '(' || c === '[' || c === '{') parenDepth++;
    else if (c === ')' || c === ']' || c === '}') parenDepth = Math.max(0, parenDepth - 1);

    if (c === ',' && parenDepth === 0) {
      let item = cur.trim().replace(/\.$/, '').trim();
      if (item && item.length > 1) {
        const cleaned = stripFootnotesFromIngredient(item);
        if (cleaned) list.push(normalizeIngredient(cleaned));
      }
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) {
    let item = cur.trim().replace(/\.$/, '').trim();
    if (item && item.length > 1) {
      const cleaned = stripFootnotesFromIngredient(item);
      if (cleaned) list.push(normalizeIngredient(cleaned));
    }
  }
  return list;
}

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const p5Raw = `Carne Mecanicamente Separada de Frango, Farinha de Carnes e Osso de Aves, Ervilha in Natura MoÃ­da, Farinha de Cevada, Arroz Integral, Quirera de Arroz, GrÃ£o de Sorgo, Ovo Em PÃ³, Gordura de Frango, Ã“leo de Soja Refinado**, Polpa Desidratada de Beterraba, Hidrolisado de MiÃºdos de Aves, Ãcido LÃ¡tico, GrÃ£o de LinhaÃ§a, Hidrolisado de FÃ­gado de SuÃ­nos, Cloreto de PotÃ¡ssio, Cloreto de SÃ³dio, Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ãcido AscÃ³rbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de CÃ¡lcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ãcido FÃ³lico (B9), Colecalciferol (D3)), Cloreto de Colina, Taurina, Concentrado de TocoferÃ³is, Minerais (Sulfato Ferroso, Ã“xido de Zinco, Sulfato de Cobre, Ã“xido de ManganÃªs, Iodato de CÃ¡lcio, Selenito de SÃ³dio), Extrato de ChÃ¡ Verde, Extrato de Alecrim, Extrato de Menta, HortelÃ£ (Mentha spp.), Betacaroteno. Energia MetabolizÃ¡vel (EM): 3756 kcal/kg`;

const p6Raw = `Carne Mecanicamente Separada de Frango, Farinha de Cevada, Arroz Integral, Quirera de Arroz, GrÃ£o de Aveia, GrÃ£o de Milho*, Farelo Proteico de Milho - 60*, Farinha de Carne e Ossos de Aves, Gordura de Frango, Hidrolisado de MiÃºdos de Aves, Hidrolisado de FÃ­gado de SuÃ­nos, Casca de Nozes, Ã“leo de Soja Refinado**, Ãcido LÃ¡tico, Cloreto de PotÃ¡ssio, GrÃ£o de LinhaÃ§a, Polpa Desidratada de Beterraba, Polpa CÃ­trica, Cloreto de SÃ³dio, Cloreto de Colina, Carbonato de CÃ¡lcio, Fosfato BicÃ¡lcico, Ã“leo (Refinado, Branqueado e Desodorizado) de Peixes, Extrato de Arando, AbÃ³bora, Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ãcido AscÃ³rbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de CÃ¡lcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ãcido FÃ³lico (B9), Colecalciferol (D3)), Minerais (Sulfato Ferroso, Ã“xido de Zinco, Sulfato de Cobre, Ã“xido de ManganÃªs, Iodato de CÃ¡lcio, Selenito de SÃ³dio), Taurina, Concentrado de TocoferÃ³is, Extrato de ChÃ¡ Verde, Extrato de Alecrim, Extrato de Menta, HortelÃ£ (Mentha spp.), Betacaroteno.`;

const p7Raw = `Carne Mecanicamente Separada de Frango, Quirera de Arroz, Farinha de Carne e Ossos de Aves, Ervilha in Natura MoÃ­da, Farinha de Cevada, GrÃ£o de Sorgo, Ovo Em PÃ³, Gordura de Frango, Ã“leo de Soja Refinado*, Arroz Integral, Polpa Desidratada de Beterraba, Hidrolisado de MiÃºdos de Aves, Ãcido LÃ¡tico, Hidrolisado de FÃ­gado de SuÃ­nos, Cloreto de PotÃ¡ssio, GrÃ£o de LinhaÃ§a, Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ãcido AscÃ³rbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de CÃ¡lcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ãcido FÃ³lico (B9), Colecalciferol (D3)), Cloreto de SÃ³dio, Cloreto de Colina, Taurina, Minerais (Sulfato Ferroso, Ã“xido de Zinco, Sulfato de Cobre, Ã“xido de ManganÃªs, Iodato de CÃ¡lcio, Selenito de SÃ³dio), Concentrado de TocoferÃ³is, Extrato de ChÃ¡ Verde, Extrato de Alecrim, Extrato de Menta, HortelÃ£ (Mentha spp.), Betacaroteno.`;

const p8Raw = `Carne Mecanicamente Separada de Frango, Quirera de Arroz, Ervilha in Natura MoÃ­da, Farinha de Cevada, GrÃ£o de Aveia, GrÃ£o de Milho*, Ovo Em PÃ³, Gordura de Frango, Hidrolisado de MiÃºdos de Aves, Farelo Proteico de Milho - 60*, Ã“leo de Soja Refinado**, GrÃ£o de LinhaÃ§a, Hidrolisado de FÃ­gado de SuÃ­nos, Ãcido LÃ¡tico, L-Lisina, Cloreto de PotÃ¡ssio, Carbonato de CÃ¡lcio, Fosfato BicÃ¡lcico, Cenoura, Massa de Tomate Desidratada, Polpa CÃ­trica, Espinafre Desidratado, Ã“leo (Refinado, Branqueado e Desodorizado) de Peixes, Cloreto de SÃ³dio, Ãcido Alfa-LipÃ³ico (ALA), Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ãcido AscÃ³rbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de CÃ¡lcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ãcido FÃ³lico (B9), Colecalciferol (D3)), Cloreto de Colina, Taurina, Minerais (Sulfato Ferroso, Ã“xido de Zinco, Sulfato de Cobre, Ã“xido de ManganÃªs, Iodato de CÃ¡lcio, Selenito de SÃ³dio), Extrato de ChÃ¡ Verde, Extrato de Alecrim, Extrato de Menta, HortelÃ£ (Mentha spp.), L-Triptofano, Concentrado de TocoferÃ³is, L-Carnitina, Betacaroteno.`;

async function main() {
  console.log('ðŸš€ [PetRankings] Iniciando revisÃ£o e atualizaÃ§Ã£o tÃ©cnica dos produtos Science Diet...\n');

  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('ðŸ“¡ [TÃºnel SSH] Porta 5433 jÃ¡ ativa.');
  } else {
    console.log('ðŸ”’ [TÃºnel SSH] Estabelecendo tÃºnel com o PostgreSQL na Oracle Cloud...');
    tunnelProcess = spawn('ssh', [
      '-i', 'caminho/para/chave.key',
      '-L', '5433:127.0.0.1:5432',
      '-N',
      'ubuntu@petrankings-vps',
    ], { stdio: 'ignore', windowsHide: true });

    let ready = false;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      if (await isPortOpen(5433)) {
        ready = true;
        break;
      }
    }
    if (!ready) {
      console.error('âŒ Falha ao abrir tÃºnel SSH.');
      if (tunnelProcess) tunnelProcess.kill();
      process.exit(1);
    }
    console.log('âœ“ [TÃºnel SSH] Conectado com sucesso na porta 5433!\n');
  }

  const rawUrl = process.env.DATABASE_URL || '';
  const normalizedUrl = rawUrl.replace('localhost', '127.0.0.1');
  const prisma = new PrismaClient({
    datasources: { db: { url: normalizedUrl } },
  });

  try {
    // -------------------------------------------------------------------------
    // 1. REMOÃ‡ÃƒO DEFINITIVA DO PRODUTO DUPLICADO
    // -------------------------------------------------------------------------
    const duplicateSlug = 'sdsd-pro-puppy-small-bites-dry';
    const duplicate = await prisma.product.findUnique({
      where: { slug: duplicateSlug },
    });

    if (duplicate) {
      console.log(`ðŸ—‘ï¸ Removendo produto duplicado: ${duplicate.commercialName} (ID: ${duplicate.id}, Slug: ${duplicate.slug})...`);
      // Exclui links de afiliados se existirem
      await prisma.affiliateLink.deleteMany({
        where: { productId: duplicate.id },
      });
      // Exclui o produto
      await prisma.product.delete({
        where: { id: duplicate.id },
      });
      console.log(`âœ“ Produto excluÃ­do do banco com sucesso.`);

      // Remove arquivos de custÃ³dia do duplicado
      const fichasToRemove = [
        path.join(process.cwd(), 'public', 'uploads', `ficha_${duplicate.id}.html`),
        path.join(process.cwd(), 'public', 'uploads', `raw_ficha_${duplicate.id}.html`),
      ];
      for (const f of fichasToRemove) {
        if (fs.existsSync(f)) {
          fs.unlinkSync(f);
          console.log(`   ðŸ—‘ï¸ Ficha de custÃ³dia removida: ${f}`);
        }
      }
    } else {
      console.log(`â„¹ï¸ Produto duplicado ${duplicateSlug} jÃ¡ nÃ£o existe no banco.`);
    }

    console.log('\n================================================================');
    console.log('ðŸ”„ ATUALIZANDO INFORMAÃ‡Ã•ES DE TRANSGÃŠNICOS E INGREDIENTES');
    console.log('================================================================\n');

    // ConfiguraÃ§Ã£o dos 6 produtos a serem atualizados
    const updatesConfig = [
      {
        slug: 'sd-canine-adult-perfect-weight-small-toy-dry-sd-pro-canine-stb-health-guard-neutered',
        gmoIngredients: 'Milho geneticamente modificados',
        ingredientsText: null, // JÃ¡ possui os 31 ingredientes corretos no banco
      },
      {
        slug: 'science-diet-science-diet-pro-puppy-small-bites-dry',
        gmoIngredients: 'Milho e Soja geneticamente modificados',
        ingredientsText: null, // JÃ¡ possui os 35 ingredientes corretos no banco
      },
      {
        slug: 'science-diet-adult-sensitive-stomach-skin-small-bites-dry',
        gmoIngredients: 'Soja geneticamente modificados',
        ingredientsText: p5Raw,
      },
      {
        slug: 'science-diet-adult-perfect-digestion-chicken-rice-oats-dry',
        gmoIngredients: 'Milho e Soja geneticamente modificados',
        ingredientsText: p6Raw,
      },
      {
        slug: 'science-diet-adult-sensitive-stomach-skin-small-mini-chicken-dry',
        gmoIngredients: 'Soja geneticamente modificados',
        ingredientsText: p7Raw,
      },
      {
        slug: 'science-diet-science-plan-adult-7-senior-vitality-chicken-rice-dry',
        gmoIngredients: 'Milho e Soja geneticamente modificados',
        ingredientsText: p8Raw,
      },
    ];

    for (const item of updatesConfig) {
      const p = await prisma.product.findUnique({
        where: { slug: item.slug },
      });

      if (!p) {
        console.warn(`âš ï¸ Produto nÃ£o encontrado no banco: ${item.slug}`);
        continue;
      }

      console.log(`------------------------------------------------------------`);
      console.log(`ðŸ“¦ Processando: ${p.commercialName}`);
      console.log(`   ID: ${p.id} | Slug: ${p.slug}`);

      let finalIngredients: string[] = [];
      if (item.ingredientsText) {
        finalIngredients = parseIngredients(item.ingredientsText);
      } else {
        try {
          finalIngredients = JSON.parse(p.topIngredients);
        } catch {
          finalIngredients = [];
        }
      }

      console.log(`   Ingredientes Cadastrados: ${finalIngredients.length} itens`);
      console.log(`   Top 3: ${finalIngredients.slice(0, 3).join(' | ')}`);

      const garantias = {
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
      };

      const audit = calcularScoreAnaliseRotulo(
        p.species as any,
        p.lifeStage as FaseVida,
        garantias,
        {
          topIngredientes: finalIngredients,
          antioxidanteTipo: p.antioxidantType as any,
          omega3OuPrebioticosGarantidos: (p.omega3MinPct ?? 0) >= 0.2 || true,
          claimCarneTipo: 'COM_CARNE',
          claimCarneAdequado: true,
          foodType: p.foodType as any,
        },
        p.foodType as any
      );

      console.log(`   Score Anterior: ${p.scoreTotal} (${p.classificationTier}) âž” Novo Score: ${audit.scoreTotal} (${audit.classificacaoFaixa})`);
      console.log(`   TransgÃªnicos: SIM (containsGmo = true, gmoIngredients = "${item.gmoIngredients}")`);

      console.log(`   ðŸ¤– Gerando Parecer Editorial TÃ©cnico...`);
      let editorial = await generateEditorialOpinionWithGemini({
        commercialName: p.commercialName,
        brand: p.brand,
        species: p.species as any,
        lifeStage: p.lifeStage as any,
        foodType: p.foodType as any,
        legalCategory: p.legalCategory as any,
        coadjuvanteCondition: p.coadjuvanteCondition,
        proteinaBrutaMinPct: p.crudeProteinMinPct,
        energiaMetabolizavelKcalKg: null,
        antioxidantType: p.antioxidantType as any,
        containsGmo: true,
        topIngredients: finalIngredients,
        scoreTotal: audit.scoreTotal,
        classificationTier: audit.classificacaoFaixa,
        extratoPontos: audit.extratoPontos,
        calcioMinPct: p.calciumMinPct,
        calcioMaxPct: p.calciumMaxPct,
        fosforoMinPct: p.phosphorusMinPct,
        umidadeMaxPct: p.moistureMaxPct,
        extratoEtereoMinPct: p.etherExtractMinPct,
      });

      if (!editorial) {
        editorial = generateTechnicalEditorialOpinion({
          commercialName: p.commercialName,
          brand: p.brand,
          species: p.species as any,
          lifeStage: p.lifeStage as any,
          foodType: p.foodType as any,
          legalCategory: p.legalCategory as any,
          coadjuvanteCondition: p.coadjuvanteCondition,
          proteinaBrutaMinPct: p.crudeProteinMinPct,
          energiaMetabolizavelKcalKg: null,
          antioxidantType: p.antioxidantType as any,
          containsGmo: true,
          topIngredients: finalIngredients,
          scoreTotal: audit.scoreTotal,
          classificationTier: audit.classificacaoFaixa,
          extratoPontos: audit.extratoPontos,
          calcioMinPct: p.calciumMinPct,
          calcioMaxPct: p.calciumMaxPct,
          fosforoMinPct: p.phosphorusMinPct,
          umidadeMaxPct: p.moistureMaxPct,
          extratoEtereoMinPct: p.etherExtractMinPct,
        });
      }

      console.log(`   ðŸ“ Parecer:\n      "${editorial}"`);

      // Atualiza produto no banco de dados
      const updated = await prisma.product.update({
        where: { id: p.id },
        data: {
          containsGmo: true,
          gmoIngredients: item.gmoIngredients,
          topIngredients: JSON.stringify(finalIngredients),
          scoreTotal: audit.scoreTotal,
          classificationTier: audit.classificacaoFaixa,
          scoreBreakdown: audit.extratoPontos as any,
          editorialOpinion: editorial,
          calculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Regenera ficha tÃ©cnica padronizada de custÃ³dia
      const destHtmlRel = `/uploads/ficha_${updated.id}.html`;
      const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);
      const rawHtmlRel = `/uploads/raw_ficha_${updated.id}.html`;
      const hasRaw = fs.existsSync(path.join(process.cwd(), 'public', rawHtmlRel));

      const sheetHtml = generateCustodyHtml({
        id: updated.id,
        slug: updated.slug,
        commercialName: updated.commercialName,
        brand: updated.brand,
        manufacturerLegalName: updated.manufacturerLegalName,
        species: updated.species,
        lifeStage: updated.lifeStage,
        breedSize: updated.breedSize,
        foodType: updated.foodType,
        legalCategory: updated.legalCategory,
        coadjuvanteCondition: updated.coadjuvanteCondition,
        sourceUrl: updated.sourceUrl,
        sourceArchiveUrl: updated.sourceArchiveUrl,
        rawHtmlRelPath: hasRaw ? rawHtmlRel : null,
        labelCollectionDate: updated.labelCollectionDate,
        curatorResponsible: updated.curatorResponsible,
        frontLabelImageUrl: updated.frontLabelImageUrl,

        moistureMaxPct: updated.moistureMaxPct,
        crudeProteinMinPct: updated.crudeProteinMinPct,
        etherExtractMinPct: updated.etherExtractMinPct,
        crudeFiberMaxPct: updated.crudeFiberMaxPct,
        mineralMatterMaxPct: updated.mineralMatterMaxPct,
        calciumMinPct: updated.calciumMinPct,
        calciumMaxPct: updated.calciumMaxPct,
        phosphorusMinPct: updated.phosphorusMinPct,
        sodiumMinPct: updated.sodiumMinPct,
        omega3MinPct: updated.omega3MinPct,

        topIngredients: updated.topIngredients,
        meatClaimType: updated.meatClaimType,
        containsGmo: updated.containsGmo,
        gmoIngredients: updated.gmoIngredients,
        antioxidantType: updated.antioxidantType,

        scoreTotal: updated.scoreTotal,
        classificationTier: updated.classificationTier,
        scoreBreakdown: updated.scoreBreakdown,
        editorialOpinion: updated.editorialOpinion,
      });

      fs.writeFileSync(destHtmlPath, sheetHtml, 'utf-8');
      console.log(`   âœ“ Ficha de custÃ³dia atualizada: public${destHtmlRel}`);

      // Pausa preventiva de 1.5s
      await sleep(1500);
    }

    console.log(`\nðŸŽ‰ [ConcluÃ­do] Todos os produtos Science Diet foram revisados e atualizados com sucesso!`);
  } finally {
    await prisma.$disconnect();
    if (tunnelProcess) {
      console.log('ðŸ”Œ [TÃºnel SSH] Fechando conexÃ£o.');
      tunnelProcess.kill();
    }
  }
}

main().catch((err) => {
  console.error('\nâŒ Erro:', err);
  process.exit(1);
});
