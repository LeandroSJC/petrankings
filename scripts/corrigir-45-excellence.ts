import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import * as cheerio from 'cheerio';
import { stripFootnotesFromIngredient, normalizeIngredient } from '../src/lib/utils';
import { calcularScoreAnaliseRotulo, generateTechnicalEditorialOpinion, FaseVida } from '../src/lib/audit-engine';
import { generateCustodyHtml } from '../src/lib/custody-template';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/petrankings_db'
    }
  }
});

// Função auxiliar para download de PDF com retry e timeout
async function downloadPdf(url: string, destPath: string): Promise<string | null> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    const fileBuf = fs.readFileSync(destPath);
    return crypto.createHash('sha256').update(fileBuf).digest('hex');
  }

  return new Promise((resolve) => {
    try {
      const file = fs.createWriteStream(destPath);
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        },
        (res) => {
          if (res.statusCode !== 200) {
            file.close();
            if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
            resolve(null);
            return;
          }

          res.pipe(file);
          file.on('finish', () => {
            file.close(() => {
              const fileBuf = fs.readFileSync(destPath);
              const sha256 = crypto.createHash('sha256').update(fileBuf).digest('hex');
              resolve(sha256);
            });
          });
        }
      );

      req.on('error', () => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

async function main() {
  console.log('🚀 Iniciando restauração e custódia documental dos 45 produtos Dog & Cat Excellence...\n');

  const lines = fs
    .readFileSync('produtos_cadastro/atualizacao.txt', 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const slugs = lines.map((l) => l.split('/produto/').pop() || '').filter(Boolean);

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } }
  });

  console.log(`📦 Encontrados ${products.length} produtos correspondentes no banco de dados.\n`);

  // Diretório de custódia bruta permanente
  const custodyBaseDir = path.join(process.cwd(), 'custodia_documental', 'excellence');
  const manifestsDir = path.join(process.cwd(), 'custodia_documental', 'manifestos');
  fs.mkdirSync(custodyBaseDir, { recursive: true });
  fs.mkdirSync(manifestsDir, { recursive: true });

  let updatedCount = 0;
  let pdfDownloadedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i + 1}/${products.length}] Processando: ${p.commercialName} (${p.slug})`);

    if (!p.sourceDocumentUrl) {
      console.warn(`  ⚠️ Sem sourceDocumentUrl cadastrado! Pulando.`);
      continue;
    }

    const htmlRelPath = p.sourceDocumentUrl.replace(/^\//, '');
    const localHtmlPath = path.join(process.cwd(), 'public', htmlRelPath);

    if (!fs.existsSync(localHtmlPath)) {
      console.warn(`  ⚠️ Arquivo de ficha HTML não existe em disco: ${localHtmlPath}`);
      continue;
    }

    const htmlContent = fs.readFileSync(localHtmlPath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    const boxText = $('.ingredients-box').text().trim();
    if (!boxText || boxText.length < 20) {
      console.warn(`  ⚠️ Caixa de ingredientes vazia no arquivo HTML!`);
      continue;
    }

    // Parse limpo dos ingredientes a partir da caixa oficial
    const rawItems = boxText
      .split(/,\s*(?![^\(]*\))/)
      .map((item) => item.trim())
      .filter(Boolean);

    const cleanIngredients = rawItems
      .map(stripFootnotesFromIngredient)
      .filter((item): item is string => Boolean(item && item.length > 1))
      .map(normalizeIngredient);

    // Validação de segurança anti-corrupção
    const hasCorruptStrings = cleanIngredients.some(
      (ing) =>
        ing.includes('Ordem Decrescente de Peso') ||
        ing.includes('Motor de Avaliação') ||
        ing.includes('Pilar da Avaliação')
    );

    if (hasCorruptStrings) {
      console.error(`  ❌ ERRO CRÍTICO: Ingredientes continuam contendo texto de UI! Abortando este item.`);
      continue;
    }

    // Detecção precisa de OGM e Antioxidantes
    const fullText = boxText.toLowerCase();
    const containsGmo =
      fullText.includes('transgênic') ||
      fullText.includes('transgên') ||
      cleanIngredients.some((ing) => ing.toLowerCase().includes('transgênic') || ing.includes('*'));

    const isSintetico =
      fullText.includes('bha') ||
      fullText.includes('bht') ||
      fullText.includes('propilgalato') ||
      fullText.includes('etoxiquina');
    const isNatural =
      fullText.includes('tocoferol') ||
      fullText.includes('alecrim') ||
      fullText.includes('chá verde');

    const antioxidantType =
      isSintetico && isNatural ? 'MISTO' : isSintetico ? 'SINTETICO' : 'NATURAL';

    // Determinar fase de vida para auditoria
    const isFilhote =
      p.lifeStage === 'CRESCIMENTO_INICIAL' ||
      p.lifeStage === 'CRESCIMENTO_FINAL' ||
      p.lifeStage === 'FILHOTE';
    const auditFase: FaseVida = (isFilhote ? 'CRESCIMENTO_INICIAL' : p.lifeStage) as FaseVida;

    const isWet = p.foodType === 'UMIDO';
    const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(
      p.commercialName + ' ' + p.slug
    );

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
      omega3MinPct: p.omega3MinPct
    };

    const audit = calcularScoreAnaliseRotulo(
      p.species as any,
      auditFase,
      garantias,
      {
        topIngredientes: cleanIngredients,
        antioxidanteTipo: antioxidantType as any,
        containsGmo: containsGmo,
        omega3OuPrebioticosGarantidos: isWet
          ? (p.omega3MinPct ?? 0) >= 0.015
          : (p.omega3MinPct ?? 0) >= 0.2,
        claimCarneTipo: (p.meatClaimType as any) || 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: p.foodType as any,
        isLightOuControlePeso: isLight,
        nomeComercial: p.commercialName
      },
      p.foodType as any
    );

    // Gerar parecer editorial técnico atualizado
    const newOpinion = generateTechnicalEditorialOpinion({
      ...p,
      containsGmo,
      antioxidantType,
      topIngredients: JSON.stringify(cleanIngredients),
      scoreTotal: audit.scoreTotal,
      classificationTier: audit.classificacaoFaixa,
      scoreBreakdown: audit.extratoPontos
    });

    // Baixar PDF oficial para custódia permanente se sourceUrl for PDF
    let pdfSha256: string | null = null;
    let localPdfPath: string | null = null;

    if (p.sourceUrl && p.sourceUrl.toLowerCase().includes('.pdf')) {
      const safePdfName = `${p.slug}.pdf`;
      const targetPdfFile = path.join(custodyBaseDir, safePdfName);

      pdfSha256 = await downloadPdf(p.sourceUrl, targetPdfFile);
      if (pdfSha256) {
        pdfDownloadedCount++;
        localPdfPath = `custodia_documental/excellence/${safePdfName}`;
      }
    }

    // Criar manifesto de custódia
    const custodyManifest = {
      productId: p.id,
      slug: p.slug,
      commercialName: p.commercialName,
      brand: p.brand,
      manufacturer: p.manufacturerLegalName || 'Excellence Pet Care',
      primarySource: {
        type: p.sourceUrl && p.sourceUrl.includes('.pdf') ? 'PDF_OFICIAL' : 'HTML_OFICIAL',
        url: p.sourceUrl,
        localFile: localPdfPath || p.sourceDocumentUrl,
        sha256: pdfSha256 || null,
        retrievedAt: new Date().toISOString()
      },
      guaranteesDeclared: garantias,
      rawIngredientsText: boxText,
      cleanIngredients: cleanIngredients,
      evaluation: {
        scoreTotal: audit.scoreTotal,
        classificationTier: audit.classificacaoFaixa,
        scoreBreakdown: audit.extratoPontos,
        calculatedAt: new Date().toISOString()
      }
    };

    const manifestFilePath = path.join(manifestsDir, `${p.slug}.json`);
    fs.writeFileSync(manifestFilePath, JSON.stringify(custodyManifest, null, 2), 'utf-8');

    // Atualizar registro no PostgreSQL
    await prisma.product.update({
      where: { id: p.id },
      data: {
        topIngredients: JSON.stringify(cleanIngredients),
        containsGmo,
        antioxidantType,
        scoreTotal: audit.scoreTotal,
        classificationTier: audit.classificacaoFaixa,
        scoreBreakdown: audit.extratoPontos as any,
        editorialOpinion: newOpinion,
        calculatedAt: new Date()
      }
    });

    // Re-gerar Ficha Técnica HTML oficial sincronizada
    const updatedHtml = generateCustodyHtml({
      id: p.id,
      slug: p.slug,
      commercialName: p.commercialName,
      brand: p.brand,
      manufacturerLegalName: p.manufacturerLegalName,
      species: p.species,
      lifeStage: p.lifeStage,
      breedSize: p.breedSize,
      foodType: p.foodType,
      legalCategory: p.legalCategory,
      coadjuvanteCondition: p.coadjuvanteCondition,
      sourceUrl: p.sourceUrl,
      sourceArchiveUrl: p.sourceArchiveUrl,
      rawHtmlRelPath: null,
      labelCollectionDate: p.labelCollectionDate,
      curatorResponsible: p.curatorResponsible,
      frontLabelImageUrl: p.frontLabelImageUrl,

      moistureMaxPct: p.moistureMaxPct,
      crudeProteinMinPct: p.crudeProteinMinPct,
      etherExtractMinPct: p.etherExtractMinPct,
      crudeFiberMaxPct: p.crudeFiberMaxPct,
      mineralMatterMaxPct: p.mineralMatterMaxPct,
      calciumMinPct: p.calciumMinPct,
      calciumMaxPct: p.calciumMaxPct,
      phosphorusMinPct: p.phosphorusMinPct,
      sodiumMinPct: p.sodiumMinPct,
      omega3MinPct: p.omega3MinPct,

      topIngredients: cleanIngredients,
      meatClaimType: p.meatClaimType,
      containsGmo,
      gmoIngredients: p.gmoIngredients,
      antioxidantType,

      scoreTotal: audit.scoreTotal,
      classificationTier: audit.classificacaoFaixa,
      scoreBreakdown: audit.extratoPontos,
      editorialOpinion: newOpinion
    });

    fs.writeFileSync(localHtmlPath, updatedHtml, 'utf-8');

    updatedCount++;
    console.log(
      `  ✅ Atualizado! Ingredientes: ${cleanIngredients.length} | Score: ${audit.scoreTotal} (${audit.classificacaoFaixa}) | PDF: ${pdfSha256 ? 'OK' : 'N/A'}`
    );
  }

  console.log(`\n🎉 CONCLUÍDO COM SUCESSO!`);
  console.log(`- Produtos corrigidos e atualizados no banco: ${updatedCount}`);
  console.log(`- PDFs oficiais custodiados em disco: ${pdfDownloadedCount}`);
  console.log(`- Manifestos de custódia gerados: ${updatedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
