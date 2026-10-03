import { calcularNutrientesMS, calcularEnergiaMetabolizavel } from '@/lib/audit-engine';
import { getFaixaVisual, formatarTermo } from '@/lib/formatters';
import { normalizeIngredientsList } from '@/lib/utils';

export interface ComparedProduct {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  manufacturerLegalName: string;
  legalCategory: string;
  species: string;
  lifeStage: string;
  breedSize: string;
  foodType: string;
  coadjuvanteCondition?: string | null;
  frontLabelImageUrl?: string | null;
  sourceUrl: string;
  scoreTotal: number | null;
  classificationTier: string;

  // Níveis de garantia declarados (Matéria Natural - MN)
  moistureMaxPct: number;
  crudeProteinMinPct: number;
  etherExtractMinPct: number;
  crudeFiberMaxPct: number;
  mineralMatterMaxPct: number;
  calciumMinPct: number;
  calciumMaxPct?: number | null;
  phosphorusMinPct: number;
  sodiumMinPct?: number | null;
  omega3MinPct?: number | null;

  // Níveis calculados em Matéria Seca (MS)
  ms: {
    fatorMS: number;
    proteinaBrutaPct: number;
    extratoEtereoPct: number;
    materiaFibrosaPct: number;
    materiaMineralPct: number;
    calcioMinPct: number;
    calcioMaxPct?: number | null;
    fosforoMinPct: number;
    sodioMinPct?: number | null;
    omega3MinPct?: number | null;
  };
  relacaoCaP: number;
  energiaMetabolizavel: {
    ennPct: number;
    ebKcalKg: number;
    cdePct: number;
    edKcalKg: number;
    emKcalKg: number;
  };

  // Rotulagem e Composição
  meatClaimType: string;
  containsGmo: boolean;
  gmoIngredients?: string | null;
  antioxidantType: string;
  topIngredientsList: string[];
  editorialOpinion?: string | null;

  // Formatações visuais
  tierLabel: string;
  tierBgColor: string;
  tierBorderColor: string;
  tierTextColor: string;
  affiliateLinksCount: number;
}

export interface ComparisonSynthesis {
  hasDifferentSpecies: boolean;
  hasDifferentLifeStages: boolean;
  hasDifferentFoodTypes: boolean;
  highestProteinSlug?: string;
  proteinDifferencePct?: number;
  lowestAshSlug?: string;
  ashDifferencePct?: number;
  naturalAntioxidantsSlugs: string[];
  gmoFreeSlugs: string[];
  highestEnergySlug?: string;
  summaryBullets: string[];
}

export interface ComparisonPreset {
  id: string;
  title: string;
  tag: string;
  species: 'CAO' | 'GATO';
  p1: string;
  p2: string;
  description: string;
}

export const POPULAR_COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    id: 'premier-vs-golden',
    title: 'PremieR Formula vs GoldeN Formula',
    tag: 'Cães Adultos • Duelo Mais Buscado',
    species: 'CAO',
    p1: 'premier-formula-racas-medias-caes-adultos-sabor-frango',
    p2: 'golden-formula-caes-adultos-frango-arroz',
    description: 'Confronto entre Super Premium e Premium Especial da mesma fabricante Grandfood.',
  },
  {
    id: 'biofresh-vs-premier',
    title: 'Biofresh vs PremieR Formula',
    tag: 'Cães Adultos • Carnes Frescas vs Tradicional',
    species: 'CAO',
    p1: 'cao-adulto-castrado-medio-sabor-mix-de-carnes',
    p2: 'premier-formula-racas-medias-caes-adultos-sabor-frango',
    description: 'Comparativo de formulação com frutas e grãos ancestrais sem transgênicos vs fórmula de referência.',
  },
  {
    id: 'purina-one-vs-golden',
    title: 'Purina ONE vs GoldeN Special',
    tag: 'Gatos Castrados • Foco em Trato Urinário',
    species: 'GATO',
    p1: 'purina-one-gatos-adulto-castrados-frango-e-carne-bovina',
    p2: 'golden-special-gatos-adultos-sabor-frango-e-carne',
    description: 'Confronto de teores de cinzas minerais e proteína digestível para felinos.',
  },
];

/** Formata um registro do Prisma para a estrutura analítica do comparador */
export function formatProductForComparison(product: any): ComparedProduct {
  const isCoadjuvante = product.legalCategory === 'ALIMENTO_COADJUVANTE';
  const isComplementar = product.legalCategory === 'ALIMENTO_COMPLEMENTAR';
  const tier = getFaixaVisual(product.classificationTier, isCoadjuvante, isComplementar);

  // Conversão compulsória para Matéria Seca (MS)
  const msBase = calcularNutrientesMS({
    umidadeMaxPct: product.moistureMaxPct,
    proteinaBrutaMinPct: product.crudeProteinMinPct,
    extratoEtereoMinPct: product.etherExtractMinPct,
    materiaFibrosaMaxPct: product.crudeFiberMaxPct,
    materiaMineralMaxPct: product.mineralMatterMaxPct,
    calcioMinPct: product.calciumMinPct,
    calcioMaxPct: product.calciumMaxPct,
    fosforoMinPct: product.phosphorusMinPct,
    sodioMinPct: product.sodiumMinPct,
    omega3MinPct: product.omega3MinPct,
  });

  const umidade = Math.min(Math.max(product.moistureMaxPct || 10, 0), 95);
  const fatorMS = (100 - umidade) / 100;
  const divisor = fatorMS > 0 ? fatorMS : 1;

  const ms = {
    ...msBase,
    materiaFibrosaPct: Number((product.crudeFiberMaxPct / divisor).toFixed(2)),
    materiaMineralPct: Number((product.mineralMatterMaxPct / divisor).toFixed(2)),
  };

  const relacaoCaP = Number(
    (product.calciumMinPct / (product.phosphorusMinPct || 0.01)).toFixed(2)
  );

  // Estimativa de Energia Metabolizável (NRC 2006 / ABINPET 11ª Edição)
  const energia = calcularEnergiaMetabolizavel(
    product.species as any,
    product.moistureMaxPct,
    product.crudeProteinMinPct,
    product.etherExtractMinPct,
    product.crudeFiberMaxPct,
    product.mineralMatterMaxPct
  );

  // Parse e normalização da lista de ingredientes
  let parsedIngredients: string[] = [];
  try {
    parsedIngredients = Array.isArray(product.topIngredients)
      ? product.topIngredients
      : JSON.parse(product.topIngredients);
  } catch {
    parsedIngredients = product.topIngredients
      ? product.topIngredients.split(',').map((s: string) => s.trim())
      : [];
  }
  const topIngredientsList = normalizeIngredientsList(parsedIngredients);

  return {
    id: product.id,
    slug: product.slug,
    commercialName: product.commercialName,
    brand: product.brand,
    manufacturerLegalName: product.manufacturerLegalName || '',
    legalCategory: product.legalCategory,
    species: product.species,
    lifeStage: product.lifeStage,
    breedSize: product.breedSize,
    foodType: product.foodType,
    coadjuvanteCondition: product.coadjuvanteCondition,
    frontLabelImageUrl: product.frontLabelImageUrl,
    sourceUrl: product.sourceUrl,
    scoreTotal: product.scoreTotal,
    classificationTier: product.classificationTier,

    moistureMaxPct: product.moistureMaxPct,
    crudeProteinMinPct: product.crudeProteinMinPct,
    etherExtractMinPct: product.etherExtractMinPct,
    crudeFiberMaxPct: product.crudeFiberMaxPct,
    mineralMatterMaxPct: product.mineralMatterMaxPct,
    calciumMinPct: product.calciumMinPct,
    calciumMaxPct: product.calciumMaxPct,
    phosphorusMinPct: product.phosphorusMinPct,
    sodiumMinPct: product.sodiumMinPct,
    omega3MinPct: product.omega3MinPct,

    ms,
    relacaoCaP,
    energiaMetabolizavel: energia,

    meatClaimType: product.meatClaimType || 'NENHUM',
    containsGmo: Boolean(product.containsGmo),
    gmoIngredients: product.gmoIngredients,
    antioxidantType: product.antioxidantType || 'NATURAL',
    topIngredientsList,
    editorialOpinion: product.editorialOpinion,

    tierLabel: tier.label,
    tierBgColor: tier.bgColor,
    tierBorderColor: tier.borderColor,
    tierTextColor: tier.color,
    affiliateLinksCount: product.affiliateLinks ? product.affiliateLinks.length : 0,
  };
}

/** Gera a síntese comparativa e veredito analítico entre os produtos selecionados */
export function generateComparisonSynthesis(products: ComparedProduct[]): ComparisonSynthesis {
  if (products.length < 2) {
    return {
      hasDifferentSpecies: false,
      hasDifferentLifeStages: false,
      hasDifferentFoodTypes: false,
      naturalAntioxidantsSlugs: products.filter(p => p.antioxidantType === 'NATURAL').map(p => p.slug),
      gmoFreeSlugs: products.filter(p => !p.containsGmo).map(p => p.slug),
      summaryBullets: [],
    };
  }

  const speciesSet = new Set(products.map(p => p.species));
  const lifeStageSet = new Set(products.map(p => p.lifeStage));
  const foodTypeSet = new Set(products.map(p => p.foodType));

  const hasDifferentSpecies = speciesSet.size > 1;
  const hasDifferentLifeStages = lifeStageSet.size > 1;
  const hasDifferentFoodTypes = foodTypeSet.size > 1;

  // Maior proteína na Matéria Seca (MS)
  const sortedByProtein = [...products].sort((a, b) => b.ms.proteinaBrutaPct - a.ms.proteinaBrutaPct);
  const highestProtein = sortedByProtein[0];
  const secondProtein = sortedByProtein[1];
  const proteinDifferencePct = Number((highestProtein.ms.proteinaBrutaPct - secondProtein.ms.proteinaBrutaPct).toFixed(1));

  // Menor teor mineral (cinzas na MS)
  const sortedByAsh = [...products].sort((a, b) => a.ms.materiaMineralPct - b.ms.materiaMineralPct);
  const lowestAsh = sortedByAsh[0];
  const secondAsh = sortedByAsh[1];
  const ashDifferencePct = Number((secondAsh.ms.materiaMineralPct - lowestAsh.ms.materiaMineralPct).toFixed(1));

  // Conservantes naturais
  const naturalAntioxidantsSlugs = products.filter(p => p.antioxidantType === 'NATURAL').map(p => p.slug);

  // Livres de OGM
  const gmoFreeSlugs = products.filter(p => !p.containsGmo).map(p => p.slug);

  // Maior densidade energética
  const sortedByEnergy = [...products].sort(
    (a, b) => b.energiaMetabolizavel.emKcalKg - a.energiaMetabolizavel.emKcalKg
  );
  const highestEnergy = sortedByEnergy[0];

  const summaryBullets: string[] = [];

  // Ponto 1: Densidade Proteica
  if (proteinDifferencePct > 0.5) {
    summaryBullets.push(
      `Densidade Proteica: ${highestProtein.commercialName} entrega +${proteinDifferencePct}% a mais de proteína na Matéria Seca (${highestProtein.ms.proteinaBrutaPct.toFixed(1)}% MS vs ${secondProtein.ms.proteinaBrutaPct.toFixed(1)}% MS em ${secondProtein.commercialName}).`
    );
  } else {
    summaryBullets.push(
      `Densidade Proteica: Teores proteicos equivalentes na Matéria Seca (${highestProtein.ms.proteinaBrutaPct.toFixed(1)}% MS vs ${secondProtein.ms.proteinaBrutaPct.toFixed(1)}% MS).`
    );
  }

  // Ponto 2: Pureza Mineral (Cinzas)
  if (ashDifferencePct >= 0.5) {
    summaryBullets.push(
      `Concentração de Minerais: ${lowestAsh.commercialName} apresenta menor teor de cinzas (${lowestAsh.ms.materiaMineralPct.toFixed(1)}% MS contra ${secondAsh.ms.materiaMineralPct.toFixed(1)}% MS), indicando cortes com menor teor de ossos/cartilagens.`
    );
  }

  // Ponto 3: Aditivos e Conservantes
  if (naturalAntioxidantsSlugs.length > 0 && naturalAntioxidantsSlugs.length < products.length) {
    const naturalNames = products.filter(p => naturalAntioxidantsSlugs.includes(p.slug)).map(p => p.commercialName).join(', ');
    const synthNames = products.filter(p => !naturalAntioxidantsSlugs.includes(p.slug)).map(p => p.commercialName).join(', ');
    summaryBullets.push(
      `Conservação do Alimento: ${naturalNames} adota 100% antioxidantes naturais (tocoferóis e alecrim), enquanto ${synthNames} utiliza conservantes sintéticos (BHT/BHA).`
    );
  } else if (naturalAntioxidantsSlugs.length === products.length) {
    summaryBullets.push(`Conservação: Todos os alimentos comparados utilizam conservação com antioxidantes 100% naturais.`);
  }

  // Ponto 4: Transgênicos (OGM)
  if (gmoFreeSlugs.length > 0 && gmoFreeSlugs.length < products.length) {
    const gmoFreeNames = products.filter(p => gmoFreeSlugs.includes(p.slug)).map(p => p.commercialName).join(', ');
    summaryBullets.push(
      `Presença de Transgênicos: ${gmoFreeNames} é 100% livre de grãos transgênicos, enquanto os demais contêm milho ou soja com símbolo "T".`
    );
  }

  // Ponto 5: Densidade Energética
  if (highestEnergy.energiaMetabolizavel.emKcalKg > 0) {
    summaryBullets.push(
      `Densidade Calórica: ${highestEnergy.commercialName} possui a maior concentração de Energia Metabolizável (~${highestEnergy.energiaMetabolizavel.emKcalKg} kcal/kg), exigindo menor porção diária em gramas.`
    );
  }

  return {
    hasDifferentSpecies,
    hasDifferentLifeStages,
    hasDifferentFoodTypes,
    highestProteinSlug: highestProtein.slug,
    proteinDifferencePct,
    lowestAshSlug: lowestAsh.slug,
    ashDifferencePct,
    naturalAntioxidantsSlugs,
    gmoFreeSlugs,
    highestEnergySlug: highestEnergy.slug,
    summaryBullets,
  };
}
