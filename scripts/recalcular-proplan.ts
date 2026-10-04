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
  console.log(`\n🐾 [PetRankings] Recálculo Específico da Linha Purina Pro Plan`);
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

    // Filtra ESTRITAMENTE produtos da linha Purina Pro Plan
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { brand: { contains: 'Pro Plan', mode: 'insensitive' } },
          { commercialName: { contains: 'Pro Plan', mode: 'insensitive' } },
        ],
      },
      orderBy: { commercialName: 'asc' },
    });

    console.log(`📋 Encontrados ${products.length} produtos da linha Purina Pro Plan no banco de dados.\n`);

    let updatedCount = 0;
    let unchangedCount = 0;

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

      const oldCaMin = product.calciumMinPct;
      const oldCaMax = product.calciumMaxPct;
      const oldPMin = product.phosphorusMinPct;

      const newCaMin = parsed.calcioMinPct;
      const newCaMax = parsed.calcioMaxPct;
      const newPMin = parsed.fosforoMinPct;

      const hasChanged = oldCaMin !== newCaMin || oldCaMax !== newCaMax || oldPMin !== newPMin;

      // Recalcula auditoria bromatológica determinística
      const auditFase: FaseVida = parsed.lifeStage;
      const foodType: TipoAlimento = parsed.foodType;

      const garantias = {
        umidadeMaxPct: parsed.umidadeMaxPct,
        proteinaBrutaMinPct: parsed.proteinaBrutaMinPct,
        extratoEtereoMinPct: parsed.extratoEtereoMinPct,
        materiaFibrosaMaxPct: parsed.materiaFibrosaMaxPct,
        materiaMineralMaxPct: parsed.materiaMineralMaxPct,
        calcioMinPct: newCaMin,
        calcioMaxPct: newCaMax,
        fosforoMinPct: newPMin,
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
        calcioMinPct: newCaMin,
        calcioMaxPct: newCaMax,
        fosforoMinPct: newPMin,
        umidadeMaxPct: parsed.umidadeMaxPct,
      });

      console.log(`📦 [${product.id}] ${parsed.commercialName}`);
      console.log(`   Cálcio: ${oldCaMin}% - ${oldCaMax}% ➔ ${newCaMin}% - ${newCaMax}% ${oldCaMin !== newCaMin || oldCaMax !== newCaMax ? '⚡ ATUALIZADO' : '✓ OK'}`);
      console.log(`   Fósforo: ${oldPMin}% ➔ ${newPMin}% ${oldPMin !== newPMin ? '⚡ ATUALIZADO' : '✓ OK'}`);
      console.log(`   Score: ${product.scoreTotal ?? 'N/A'} ➔ ${finalScoreTotal ?? 'N/A'} (${finalClassificationTier})`);

      if (!isDryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            calciumMinPct: newCaMin,
            calciumMaxPct: newCaMax,
            phosphorusMinPct: newPMin,
            scoreTotal: finalScoreTotal,
            classificationTier: finalClassificationTier,
            scoreBreakdown: finalScoreBreakdown as any,
            editorialOpinion: editorialOpinion,
            calculatedAt: new Date(),
          },
        });
      }

      if (hasChanged) updatedCount++;
      else unchangedCount++;
    }

    console.log(`\n======================================================`);
    console.log(`🎉 Resumo da Operação Purina Pro Plan:`);
    console.log(`   - Produtos revisados: ${products.length}`);
    console.log(`   - Com alterações de nutrientes: ${updatedCount}`);
    console.log(`   - Sem alteração: ${unchangedCount}`);
    console.log(`   - Status: ${isDryRun ? 'DRY-RUN (Simulação)' : 'GRAVADO COM SUCESSO NO BANCO DE DADOS'}`);
    console.log(`======================================================\n`);

    await prisma.$disconnect();
  } catch (err: any) {
    console.error('❌ Erro durante o recálculo:', err);
  } finally {
    if (tunnelProcess) {
      console.log('🔌 [Túnel SSH] Fechando conexão segura temporária.');
      tunnelProcess.kill();
    }
  }
}

main().catch(console.error);
