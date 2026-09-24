import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
const { PDFParse } = require('pdf-parse');


export function cleanAdimaxIngredients(text: string): string[] {
  // 1. Encontrar o início do bloco de composição
  const compMatch = text.match(/composi[çc][ãa]o\s*b[áa]sica/i) || text.match(/composi[çc][ãa]o/i);
  if (!compMatch || compMatch.index === undefined) return [];

  // 2. Encontrar o início real dos níveis de garantia (onde começam os valores numéricos de garantia)
  const afterComp = text.slice(compMatch.index);
  const garTableMatch = afterComp.match(/(?:^|\n)\s*(?:Umidade|Prote[íi]na\s+Bruta|Prote[íi]na\s+Cruda)[^\n\d]*\d+/i);
  const endOffset = garTableMatch && garTableMatch.index !== undefined ? garTableMatch.index : afterComp.length;
  const rawSection = afterComp.slice(0, endOffset);

  // 3. Remover ruídos de impressão web linha por linha
  const lines = rawSection.split('\n').map((l) => l.trim()).filter(Boolean);

  const filteredLines: string[] = [];
  for (const l of lines) {
    if (
      /^Composição\s+básica\b/i.test(l) ||
      /^Descrição\b/i.test(l) ||
      /^Níveis\s+de\s+garantia\b/i.test(l) ||
      /^Enriquecimento\b/i.test(l) ||
      /^Tabela\s+de\s+consumo\b/i.test(l) ||
      /^Inscreva-se\b/i.test(l) ||
      /^Mais\s*[\uF107]?$/i.test(l) ||
      /^--\s*\d+\s*of\s*\d+\s*--/i.test(l) ||
      /^https?:\/\//i.test(l) ||
      /^\d{2}\/\d{2}\/\d{4}/.test(l) ||
      /^[\s]+$/.test(l)
    ) {
      continue;
    }
    const cleanedLine = l.replace(/[]/g, '').trim();
    if (cleanedLine) {
      filteredLines.push(cleanedLine);
    }
  }

  // 4. Localizar a linha exata onde os ingredientes começam
  // No Adimax / pet food, os ingredientes começam com Carnes, Farinha de vísceras, Água, Atum, etc.
  const firstIngRegex = /^(?:Carnes?\b|Farinha\s+de\s+(?:v[íi]sceras|carne|peixes?)|[AÁ]gua\b|Atum\b|Peito\s+de\s+frango|Quirera\b)/i;

  let ingredientStartLineIdx = -1;
  for (let i = 0; i < filteredLines.length; i++) {
    if (firstIngRegex.test(filteredLines[i])) {
      ingredientStartLineIdx = i;
      break;
    }
  }

  // Se por alguma razão extraordinária não casar, descarta linhas narrativas de marketing conhecidas
  if (ingredientStartLineIdx === -1) {
    for (let i = 0; i < filteredLines.length; i++) {
      const l = filteredLines[i];
      const isMarketing =
        /gatos são uma espécie|após a castração|por estarem em desenvolvimento|fórmula natural|feitos cuidadosamente|alimento úmido de alta qualidade|mudanças fisiológicas|a castração é um ato|alimento coadjuvante|gatos geriátricos|gatos de pelos longos|com um conceito natural/i.test(l);
      if (!isMarketing) {
        ingredientStartLineIdx = i;
        break;
      }
    }
  }

  const ingLines = ingredientStartLineIdx !== -1 ? filteredLines.slice(ingredientStartLineIdx) : filteredLines;
  let fullIngText = ingLines.join(' ');

  // 5. Limpeza de ruídos residuais que possam estar no meio ou no fim do texto
  fullIngText = fullIngText
    .replace(/-- \d+ of \d+ --/g, ' ')
    .replace(/https?:\/\/[^\s]*/gi, ' ')
    .replace(/\d{2}\/\d{2}\/\d{4}[^\n]*/g, ' ')
    .replace(/\bNíveis de garantia\b/gi, ' ')
    .replace(/\bEnriquecimento\b/gi, ' ')
    .replace(/\bTabela de consumo\b/gi, ' ')
    .replace(/\bInscreva-se\b/gi, ' ')
    .replace(/\bMais\s*[\uF107]?/gi, ' ')
    .replace(/[]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove notas de rodapé de transgênicos se houver
  if (fullIngText.includes('*Contém')) fullIngText = fullIngText.split('*Contém')[0];
  if (fullIngText.includes('*Ingredientes')) fullIngText = fullIngText.split('*Ingredientes')[0];

  // 6. Separação por vírgula respeitando parênteses
  const ingredients: string[] = [];
  let cur = '';
  let parenDepth = 0;
  for (let i = 0; i < fullIngText.length; i++) {
    const c = fullIngText[i];
    if (c === '(') parenDepth++;
    else if (c === ')') parenDepth = Math.max(0, parenDepth - 1);

    if (c === ',' && parenDepth === 0) {
      const item = cur.trim().replace(/\.$/, '').trim();
      if (item && item.length > 1) ingredients.push(item);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) {
    const item = cur.trim().replace(/\.$/, '').trim();
    if (item && item.length > 1) ingredients.push(item);
  }

  return ingredients;
}

async function run() {
  console.log('================================================================');
  console.log('🔧 CORREÇÃO DE COMPOSIÇÃO DOS PRODUTOS FÓRMULA NATURAL (ADIMAX)');
  console.log('================================================================\n');

  const products = await prisma.product.findMany({
    where: { brand: { startsWith: 'Fórmula Natural' } },
    orderBy: { slug: 'asc' },
  });

  console.log(`Encontrados ${products.length} produtos da Fórmula Natural para re-extração e saneamento.\n`);

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i + 1}/${products.length}] Processando: ${p.commercialName} (${p.slug})...`);

    if (!p.sourceDocumentUrl) {
      console.warn(`⚠️ Sem PDF cadastrado para ${p.slug}. Pulando.`);
      continue;
    }

    const pdfPath = path.join(process.cwd(), 'public', p.sourceDocumentUrl);
    if (!fs.existsSync(pdfPath)) {
      console.warn(`⚠️ Arquivo PDF não encontrado em ${pdfPath}. Pulando.`);
      continue;
    }

    const buf = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: buf });
    const parsed = await parser.getText();
    const text: string = parsed.text;

    const cleanIngredients = cleanAdimaxIngredients(text);
    if (cleanIngredients.length === 0) {
      console.error(`❌ Falha ao extrair ingredientes para ${p.slug}.`);
      continue;
    }

    console.log(`   Ingrediente #1: "${cleanIngredients[0]}"`);
    console.log(`   Total de ingredientes: ${cleanIngredients.length}`);

    // Re-calcula Análise de Rótulo / Score
    const audit = calcularScoreAnaliseRotulo(
      p.species as any,
      p.lifeStage as any,
      {
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
      },
      {
        topIngredientes: cleanIngredients,
        antioxidanteTipo: p.antioxidantType as any,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE_FRESCA',
      },
      p.foodType as any
    );

    const isCoadjuvante = p.legalCategory === 'ALIMENTO_COADJUVANTE';
    const isComplementar = p.legalCategory === 'ALIMENTO_COMPLEMENTAR';

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
            justificativa:
              'Alimento Específico / Complementar: Produto formulado como agrado, petisco ou hidratação suplementar. Não possui suplementação vitamínico-mineral completa de uso exclusivo, devendo ser oferecido em conjunto com a alimentação diária balanceada.',
          },
        ]
      : audit.extratoPontos;

    console.log(`   Score Anterior: ${p.scoreTotal ?? 'N/A'} (${p.classificationTier}) -> Novo Score: ${finalScoreTotal ?? 'N/A'} (${finalClassificationTier})`);

    // Gera parecer editorial atualizado com os dados corretos
    console.log(`   🤖 Atualizando parecer editorial via Gemini...`);
    const editorialOpinion = await generateEditorialOpinionWithGemini({
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
      containsGmo: p.containsGmo,
      topIngredients: cleanIngredients,
      scoreTotal: finalScoreTotal,
      classificationTier: finalClassificationTier,
      extratoPontos: audit.extratoPontos,
      calcioMinPct: p.calciumMinPct,
      calcioMaxPct: p.calciumMaxPct,
      fosforoMinPct: p.phosphorusMinPct,
      umidadeMaxPct: p.moistureMaxPct,
      extratoEtereoMinPct: p.etherExtractMinPct,
    });

    await prisma.product.update({
      where: { id: p.id },
      data: {
        topIngredients: JSON.stringify(cleanIngredients),
        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: finalScoreBreakdown,
        editorialOpinion,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    updatedCount++;
    console.log(`   ✅ Atualizado com sucesso!\n`);
  }

  // Sincroniza o arquivo de progresso
  const allProds = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      species: true,
      legalCategory: true,
      scoreTotal: true,
      classificationTier: true,
      editorialOpinion: true,
      updatedAt: true,
    },
    orderBy: { id: 'asc' },
  });
  const { syncProgressFile } = require('./revisar-editoriais-gemini');
  syncProgressFile(allProds);

  console.log(`\n🎉 CONCLUÍDO! ${updatedCount} de ${products.length} produtos atualizados com sucesso.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

