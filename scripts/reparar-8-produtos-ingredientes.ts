import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';
import { Prisma } from '@prisma/client';

function extractCleanIngredientsFromCustody(html: string, isVittamax: boolean): string[] {
  const $ = cheerio.load(html);

  if (isVittamax) {
    let text = '';
    $('p, div, span').each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, ' ');
      if (t.includes('Composição Básica do Produto') && t.length > 50 && t.length < 2500) {
        if (!text || t.length < text.length) text = t;
      }
    });
    const cleaned = text.replace(/^.*?Composição Básica do Produto\s*/i, '');
    return cleaned
      .split(/,(?!\d)/)
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter(Boolean);
  }

  // Para Equilíbrio
  let compText = '';
  $('*').each((_, el) => {
    const fullText = $(el).text().trim().replace(/\s+/g, ' ');
    if (
      (fullText.startsWith('Composição Básica') || fullText.startsWith('Composição básica') || fullText.startsWith('COMPOSIÇÃO BÁSICA')) &&
      fullText.length > 50 &&
      fullText.length < 3000 &&
      !fullText.includes('<script') &&
      !fullText.includes('Umidade (máx.)') &&
      !fullText.includes('Proteína Bruta (mín.)')
    ) {
      if (!compText || fullText.length < compText.length) {
        compText = fullText;
      }
    }
  });

  const rawCleaned = compText.replace(/^.*?Composição [Bb]ásica\s*/i, '');
  const withoutFootnotes = rawCleaned
    .replace(/\*+\s*(?:Agrobacterium|Bacillus|Streptomyces|Zea|Arabidopsis).*$/i, '')
    .trim();

  return withoutFootnotes
    .split(/,(?!\d)/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean);
}

const COADJUVANTE_CONDITIONS: Record<string, { cond: string; label: string; desc: string }> = {
  'veterinary-gatos-obesity-diabetic': {
    cond: 'OBESIDADE',
    label: 'Obesidade e Diabetes Felina',
    desc: 'manejo de perda e controle de peso corporal e regulação glicêmica em gatos diabéticos',
  },
  'veterinary-gatos-urinary': {
    cond: 'URINARIO',
    label: 'Cuidado Urinário Felino',
    desc: 'dissolução e prevenção de urólitos de estruvita e controle do pH urinário em gatos',
  },
  'veterinary-obesity-diabetic': {
    cond: 'OBESIDADE',
    label: 'Obesidade e Diabetes Canina',
    desc: 'perda de peso saudável e suporte ao metabolismo glicêmico em cães adultos',
  },
  'veterinary-hypoallergenic': {
    cond: 'HIPOALERGENICO',
    label: 'Hipoalergênico Canino',
    desc: 'manejo de hipersensibilidade alimentar e alergias dermatológicas em cães com proteína hidrolisada',
  },
  'veterinary-urinary': {
    cond: 'URINARIO',
    label: 'Cuidado Urinário Canino',
    desc: 'dissolução e prevenção de recidivas de cálculos de estruvita e saúde do trato urinário canino',
  },
  'veterinary-renal': {
    cond: 'RENAL',
    label: 'Suporte Renal Canino',
    desc: 'suporte à função renal em casos de doença renal crônica (DRC) e encefalopatia hepática em cães',
  },
};

async function main() {
  console.log('================================================================');
  console.log('🚀 REPARO DOS 8 PRODUTOS: INGREDIENTES E CLASSIFICAÇÃO COADJUVANTE');
  console.log('================================================================\n');

  await ensureTunnelOpen();

  const slugs = [
    'vittamax-biscoito-banana-aveia-e-mel',
    'veterinary-gatos-obesity-diabetic',
    'veterinary-gatos-urinary',
    'veterinary-obesity-diabetic',
    'veterinary-hypoallergenic',
    'adult-sensitive-skin-stomach',
    'veterinary-urinary',
    'veterinary-renal',
  ];

  for (const slug of slugs) {
    const prod = await prisma.product.findUnique({
      where: { slug },
    });

    if (!prod) {
      console.error(`❌ Produto não encontrado: ${slug}`);
      continue;
    }

    console.log(`----------------------------------------------------------------`);
    console.log(`📦 Processando: "${prod.commercialName}" (${prod.slug})`);

    // 1. Extração dos ingredientes corretos da custódia
    let cleanIngredients: string[] = [];
    if (prod.sourceDocumentUrl) {
      const diskPath = path.join(process.cwd(), 'public', prod.sourceDocumentUrl.replace(/^\//, ''));
      if (fs.existsSync(diskPath)) {
        const html = fs.readFileSync(diskPath, 'utf8');
        cleanIngredients = extractCleanIngredientsFromCustody(html, slug.startsWith('vittamax'));
      }
    }

    console.log(`   🥕 Ingredientes extraídos (${cleanIngredients.length}):`, cleanIngredients.slice(0, 5).join(', ') + '...');

    // 2. Se for alimento coadjuvante
    if (COADJUVANTE_CONDITIONS[slug]) {
      const { cond, label, desc } = COADJUVANTE_CONDITIONS[slug];
      const especie = prod.species === 'GATO' ? 'gatos' : 'cães';

      const opinion = `Alimento coadjuvante (dieta veterinária clínica prescritiva) formulado especificamente para ${desc}. Por se tratar de um alimento com perfil nutricional terapeuticamente modificado, seu uso é exclusivo sob prescrição e acompanhamento contínuo do médico-veterinário, não devendo ser administrado a animais sadios sem diagnóstico prévio.`;

      await prisma.product.update({
        where: { id: prod.id },
        data: {
          legalCategory: 'ALIMENTO_COADJUVANTE',
          coadjuvanteCondition: cond,
          scoreTotal: null,
          classificationTier: 'COADJUVANTE',
          scoreBreakdown: Prisma.DbNull,
          topIngredients: JSON.stringify(cleanIngredients),
          editorialOpinion: opinion,
          updatedAt: new Date(),
        },
      });

      console.log(`   🩺 Classificado como ALIMENTO_COADJUVANTE (${cond}) com sucesso!`);
    } else if (slug === 'adult-sensitive-skin-stomach') {
      // Alimento completo: recalcula score com os ingredientes reais
      const resultado = calcularScoreAnaliseRotulo(
        prod.species as any,
        prod.lifeStage as any,
        {
          proteinaBrutaMinPct: prod.crudeProteinMinPct,
          extratoEtereoMinPct: prod.etherExtractMinPct,
          umidadeMaxPct: prod.moistureMaxPct,
          calcioMinPct: prod.calciumMinPct,
          calcioMaxPct: prod.calciumMaxPct,
          fosforoMinPct: prod.phosphorusMinPct,
          materiaFibrosaMaxPct: prod.crudeFiberMaxPct,
          materiaMineralMaxPct: prod.mineralMatterMaxPct,
          sodioMinPct: prod.sodiumMinPct,
          omega3MinPct: prod.omega3MinPct,
        },
        {
          topIngredientes: cleanIngredients,
          antioxidanteTipo: (prod.antioxidantType as any) || 'NATURAL',
          omega3OuPrebioticosGarantidos: (prod.omega3MinPct ?? 0) > 0,
          claimCarneTipo: 'NENHUM',
          foodType: 'SECO',
          containsGmo: prod.containsGmo ?? false,
          nomeComercial: prod.commercialName,
        },
        'SECO'
      );

      console.log(`   📊 Novo score recalculado com ingredientes reais: ${resultado.scoreTotal} pts (${resultado.classificacaoFaixa})`);

      await prisma.product.update({
        where: { id: prod.id },
        data: {
          legalCategory: 'ALIMENTO_COMPLETO',
          topIngredients: JSON.stringify(cleanIngredients),
          scoreTotal: resultado.scoreTotal,
          classificationTier: resultado.classificacaoFaixa,
          scoreBreakdown: resultado.extratoPontos as any,
          updatedAt: new Date(),
        },
      });
      console.log(`   💾 Atualizado ALIMENTO_COMPLETO com novo score!`);
    } else if (slug.startsWith('vittamax')) {
      // VittaMax Biscoito: já é ALIMENTO_COMPLEMENTAR, apenas atualiza topIngredients
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          topIngredients: JSON.stringify(cleanIngredients),
          updatedAt: new Date(),
        },
      });
      console.log(`   🍪 Ingredientes de VittaMax Biscoito limpos e salvos!`);
    }
  }

  console.log('\n================================================================');
  console.log('🏁 REPARO DOS 8 PRODUTOS CONCLUÍDO!');
  console.log('================================================================\n');

  await prisma.$disconnect();
  closeTunnel();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  closeTunnel();
});
