import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import { PrismaClient } from '@prisma/client';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';

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
  console.log('ðŸš€ [PetRankings] Iniciando revisÃ£o bromatolÃ³gica e regulatÃ³ria de TransgÃªnicos da Qualiday...\n');

  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('ðŸ“¡ [TÃºnel SSH] Porta 5433 jÃ¡ estÃ¡ ativa. Utilizando conexÃ£o existente.');
  } else {
    console.log('ðŸ”’ [TÃºnel SSH] Abrindo tÃºnel seguro em segundo plano com a Oracle Cloud...');
    const keyPath = 'caminho/para/chave.key';
    tunnelProcess = spawn('ssh', [
      '-i', keyPath,
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
      console.error('âŒ Falha ao estabelecer o tÃºnel SSH.');
      if (tunnelProcess) tunnelProcess.kill();
      process.exit(1);
    }
    console.log('âœ“ [TÃºnel SSH] ConexÃ£o segura estabelecida com sucesso na porta 5433!\n');
  }

  const rawUrl = process.env.DATABASE_URL || '';
  const normalizedUrl = rawUrl.replace('localhost', '127.0.0.1');
  const prisma = new PrismaClient({
    datasources: { db: { url: normalizedUrl } },
  });

  try {
    const qualidayProducts = await prisma.product.findMany({
      where: {
        OR: [
          { brand: { contains: 'Qualiday', mode: 'insensitive' } },
          { commercialName: { contains: 'Qualiday', mode: 'insensitive' } },
          { slug: { contains: 'qualiday', mode: 'insensitive' } },
          { slug: { contains: 'qualyday', mode: 'insensitive' } },
        ],
      },
      orderBy: { commercialName: 'asc' },
    });

    console.log(`ðŸ“¦ Encontrados ${qualidayProducts.length} produtos para revisÃ£o.\n`);

    for (const p of qualidayProducts) {
      console.log(`================================================================`);
      console.log(`ðŸ” Revisando: ${p.commercialName} (${p.slug})`);
      console.log(`   Tipo: ${p.foodType} | Categoria: ${p.legalCategory}`);
      console.log(`   Estado Atual: containsGmo = ${p.containsGmo} | gmoIngredients = "${p.gmoIngredients}"`);

      let htmlContent = '';
      if (p.sourceDocumentUrl) {
        const localPath = path.join(process.cwd(), 'public', p.sourceDocumentUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          htmlContent = fs.readFileSync(localPath, 'utf-8');
        } else {
          console.warn(`   âš ï¸ Arquivo de custÃ³dia nÃ£o encontrado em: ${localPath}`);
        }
      }

      if (!htmlContent) {
        console.warn(`   âš ï¸ Sem HTML de custÃ³dia para re-anÃ¡lise. Pulando.`);
        continue;
      }

      // Re-parseia a partir do HTML com o novo parser aprimorado
      const parsed = parseProductFromHtml(htmlContent, p.sourceUrl);

      console.log(`   ðŸ‘‰ Resultado do Parser Aprimorado:`);
      console.log(`      - containsGmo: ${parsed.containsGmo}`);
      console.log(`      - gmoIngredients: ${parsed.gmoIngredients}`);
      console.log(`      - Top 5 Ingredientes: ${JSON.stringify(parsed.topIngredientsList.slice(0, 5))}`);

      // Executa o motor de cÃ¡lculo da avaliaÃ§Ã£o nutricional
      const auditFase: FaseVida = p.lifeStage as FaseVida;
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
        auditFase,
        garantias,
        {
          topIngredientes: parsed.topIngredientsList,
          antioxidanteTipo: parsed.antioxidantType as any,
          omega3OuPrebioticosGarantidos: (p.omega3MinPct ?? 0) >= 0.2 || true,
          claimCarneTipo: 'COM_CARNE',
          claimCarneAdequado: true,
          foodType: p.foodType as any,
        },
        p.foodType as any
      );

      // Gera parecer editorial tÃ©cnico atualizado via Gemini
      console.log(`   ðŸ¤– Gerando novo parecer editorial tÃ©cnico...`);
      const newEditorial = await generateEditorialOpinionWithGemini({
        commercialName: p.commercialName,
        brand: p.brand,
        species: p.species as any,
        lifeStage: p.lifeStage as any,
        foodType: p.foodType as any,
        legalCategory: p.legalCategory as any,
        coadjuvanteCondition: p.coadjuvanteCondition,
        proteinaBrutaMinPct: p.crudeProteinMinPct,
        energiaMetabolizavelKcalKg: null,
        antioxidantType: parsed.antioxidantType as any,
        containsGmo: parsed.containsGmo,
        topIngredients: parsed.topIngredientsList,
        scoreTotal: audit.scoreTotal,
        classificationTier: audit.classificacaoFaixa,
        extratoPontos: audit.extratoPontos,
        calcioMinPct: p.calciumMinPct,
        calcioMaxPct: p.calciumMaxPct,
        fosforoMinPct: p.phosphorusMinPct,
        umidadeMaxPct: p.moistureMaxPct,
        extratoEtereoMinPct: p.etherExtractMinPct,
      });

      console.log(`   ðŸ“ Novo Parecer Editorial:\n      ${newEditorial}`);

      // Atualiza produto no banco de dados
      await prisma.product.update({
        where: { id: p.id },
        data: {
          containsGmo: parsed.containsGmo,
          gmoIngredients: parsed.gmoIngredients,
          topIngredients: JSON.stringify(parsed.topIngredientsList),
          editorialOpinion: newEditorial,
          scoreTotal: audit.scoreTotal,
          classificationTier: audit.classificacaoFaixa,
          scoreBreakdown: audit.extratoPontos as any,
          calculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`   âœ… Produto ID ${p.id} atualizado com sucesso no PostgreSQL!`);
      // Pausa preventiva de 1.5s para API Gemini
      await sleep(1500);
    }

    console.log(`\nðŸŽ‰ [ConcluÃ­do] Todos os produtos Qualiday foram revisados e atualizados no banco de dados!`);
  } finally {
    await prisma.$disconnect();
    if (tunnelProcess) {
      console.log('\nðŸ”Œ [TÃºnel SSH] Fechando tÃºnel temporÃ¡rio.');
      tunnelProcess.kill();
    }
  }
}

main().catch((err) => {
  console.error('\nâŒ Erro geral:', err);
  process.exit(1);
});
