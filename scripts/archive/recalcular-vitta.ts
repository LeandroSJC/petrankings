import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import {
  calcularScoreAnaliseRotulo,
  generateTechnicalEditorialOpinion,
  FaseVida,
  TipoAlimento,
} from '../src/lib/audit-engine';

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

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`\n🐾 [PetRankings] Correção de Transgênicos e Recálculo da Linha VittA Natural`);
  console.log(`   Modo: ${isDryRun ? 'DRY-RUN (Simulação)' : 'APLICAR NO BANCO POSTGRESQL'}\n`);

  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('📡 [Túnel SSH] Porta 5433 já está ativa.');
  } else {
    console.log('🔒 [Túnel SSH] Abrindo túnel temporário com a Oracle Cloud na porta 5433...');
    const keyPath = 'D:/Projetos/ssh-key-2026-10-03.key';
    tunnelProcess = spawn(
      'ssh',
      ['-i', keyPath, '-L', '5433:127.0.0.1:5432', '-N', 'ubuntu@168.138.144.63'],
      { stdio: 'ignore', windowsHide: true }
    );

    let ready = false;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      if (await isPortOpen(5433)) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      console.error('❌ Falha ao estabelecer conexão via túnel SSH.');
      if (tunnelProcess) tunnelProcess.kill();
      process.exit(1);
    }
    console.log('✓ [Túnel SSH] Conexão segura estabelecida com sucesso!');
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const { parseProductFromHtml } = await import('../src/lib/html-product-parser');
    const prisma = new PrismaClient();

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { brand: { contains: 'Vitta', mode: 'insensitive' } },
          { commercialName: { contains: 'Vitta', mode: 'insensitive' } },
        ],
      },
      orderBy: { commercialName: 'asc' },
    });

    console.log(`📋 Encontrados ${products.length} produtos da linha VittA Natural no banco de dados.\n`);

    let updatedCount = 0;

    for (const product of products) {
      let htmlPath = product.sourceDocumentUrl
        ? path.join(process.cwd(), 'public', product.sourceDocumentUrl)
        : path.join(process.cwd(), 'public', 'uploads', `ficha_${product.id}.html`);

      if (!fs.existsSync(htmlPath)) {
        htmlPath = path.join(process.cwd(), 'public', 'uploads', `ficha_${product.id}.html`);
      }

      if (!fs.existsSync(htmlPath)) {
        console.warn(`⚠️ [PULADO] Arquivo HTML oficial não encontrado: ${product.commercialName} (${htmlPath})`);
        continue;
      }

      const html = fs.readFileSync(htmlPath, 'utf8');
      const parsed = parseProductFromHtml(html, product.sourceUrl);

      const oldGmo = product.containsGmo;
      const oldGmoIng = product.gmoIngredients;
      const newGmo = parsed.containsGmo;
      const newGmoIng = parsed.gmoIngredients;

      // Recalcula score e editorial opinion
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
        containsGmo: newGmo,
        topIngredients: parsed.topIngredientsList,
        scoreTotal: audit.scoreTotal,
        classificationTier: audit.classificacaoFaixa,
        extratoPontos: audit.extratoPontos,
        calcioMinPct: parsed.calcioMinPct,
        calcioMaxPct: parsed.calcioMaxPct,
        fosforoMinPct: parsed.fosforoMinPct,
        umidadeMaxPct: parsed.umidadeMaxPct,
      });

      console.log(`📦 [${product.id}] ${product.commercialName}`);
      console.log(`   Transgênicos: ${oldGmo ? 'SIM' : 'NÃO'} ➔ ${newGmo ? 'SIM' : 'NÃO'}`);
      console.log(`   Ingredientes OGM: ${newGmoIng || 'Nenhum'}`);
      console.log(`   Score: ${product.scoreTotal} ➔ ${audit.scoreTotal} (${audit.classificacaoFaixa})`);

      if (!isDryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            containsGmo: newGmo,
            gmoIngredients: newGmoIng,
            calciumMinPct: parsed.calcioMinPct,
            calciumMaxPct: parsed.calcioMaxPct,
            phosphorusMinPct: parsed.fosforoMinPct,
            scoreTotal: audit.scoreTotal,
            classificationTier: audit.classificacaoFaixa,
            scoreBreakdown: audit.extratoPontos as any,
            editorialOpinion: editorialOpinion,
            calculatedAt: new Date(),
          },
        });
      }

      updatedCount++;
    }

    console.log(`\n======================================================`);
    console.log(`🎉 Resumo da Operação VittA Natural:`);
    console.log(`   - Produtos processados: ${updatedCount}`);
    console.log(`   - Modo: ${isDryRun ? 'DRY-RUN (Simulação)' : 'GRAVADO COM SUCESSO NO BANCO DE DADOS'}`);
    console.log(`======================================================\n`);

    await prisma.$disconnect();
  } catch (err: any) {
    console.error('❌ Erro durante a atualização:', err);
  } finally {
    if (tunnelProcess) {
      console.log('🔌 [Túnel SSH] Fechando conexão segura temporária.');
      tunnelProcess.kill();
    }
  }
}

main().catch(console.error);
