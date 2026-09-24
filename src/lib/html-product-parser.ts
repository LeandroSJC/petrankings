import * as cheerio from 'cheerio';
import { stripWeightFromTitle } from '@/lib/utils';

export interface ProductHtmlMetadata {
  commercialName: string;
  slug: string;
  brand: string;
  manufacturerLegalName: string;
  species: 'GATO' | 'CAO' | 'CAO_E_GATO';
  lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR';
  foodType: 'SECO' | 'UMIDO';
  breedSize: 'TODOS' | 'MINI_PEQUENO' | 'MEDIO_GRANDE';
  legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR';
  coadjuvanteCondition: string | null;
  sourceUrl: string;
  imageUrl: string | null;

  // Garantias
  umidadeMaxPct: number;
  proteinaBrutaMinPct: number;
  extratoEtereoMinPct: number;
  materiaMineralMaxPct: number;
  materiaFibrosaMaxPct: number;
  calcioMinPct: number;
  calcioMaxPct: number;
  fosforoMinPct: number;
  sodioMinPct: number;
  omega3MinPct: number;
  energiaMetabolizavelKcalKg: number | null;

  // Ingredientes
  topIngredientsList: string[];
  containsGmo: boolean;
  gmoIngredients: string | null;
  antioxidantType: 'NATURAL' | 'SINTETICO' | 'MISTO';
}

/**
 * Extrator universal de metadados, níveis de garantia e composição a partir do HTML oficial
 */
export function parseProductFromHtml(html: string, fallbackUrl: string = ''): ProductHtmlMetadata {
  const $ = cheerio.load(html);

  // 1. URL e Imagem Oficial
  const sourceUrl =
    $('meta[property="og:url"]').attr('content') ||
    $('link[rel="canonical"]').attr('href') ||
    fallbackUrl ||
    '';

  const imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('img.wp-post-image, .woocommerce-product-gallery__image img').first().attr('src') ||
    null;

  // 2. Nome Comercial e Slug
  let commercialName =
    $('h1.product_title, h1.elementor-heading-title, h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    '';
  commercialName = stripWeightFromTitle(
    commercialName.replace(/\s+/g, ' ').replace(/®/g, '').trim()
  );

  let slug = '';
  if (sourceUrl) {
    const m = sourceUrl.match(/\/(?:produto|products\/[^\/]+)\/([^/]+)\/?/i);
    if (m) slug = m[1];
  }
  if (!slug && commercialName) {
    slug = commercialName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // 3. Marca e Fabricante
  let brand = 'PremieR';
  let manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';

  if (/f[óo]rmula\s*natural|adimax/i.test(commercialName) || /adimax\.com\.br/i.test(sourceUrl)) {
    if (/vet\s*care/i.test(commercialName)) {
      brand = 'Fórmula Natural Vet Care';
    } else if (/fresh\s*meat/i.test(commercialName)) {
      brand = 'Fórmula Natural Fresh Meat';
    } else if (/receitas\s*caseiras/i.test(commercialName)) {
      brand = 'Fórmula Natural Receitas Caseiras';
    } else if (/life/i.test(commercialName)) {
      brand = 'Fórmula Natural Life';
    } else if (/gourmet/i.test(commercialName)) {
      brand = 'Fórmula Natural Gourmet';
    } else {
      brand = 'Fórmula Natural';
    }
    manufacturerLegalName = 'Adimax Indústria e Comércio de Alimentos Ltda';
  } else if (/whiskas/i.test(commercialName) || /whiskas\.com\.br/i.test(sourceUrl)) {
    brand = 'Whiskas';
    manufacturerLegalName = 'Mars Brasil Alimentos Ltda';
  } else if (/pedigree/i.test(commercialName) || /pedigree\.com\.br/i.test(sourceUrl)) {
    brand = 'Pedigree';
    manufacturerLegalName = 'Mars Brasil Alimentos Ltda';
  } else if (/royal\s*canin/i.test(commercialName) || /royalcanin\.com/i.test(sourceUrl)) {
    brand = 'Royal Canin';
    manufacturerLegalName = 'Royal Canin do Brasil Indústria e Comércio Ltda';
  } else if (/golden/i.test(commercialName)) {
    brand = 'GoldeN';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  } else if (/vitta\s*natural/i.test(commercialName)) {
    brand = 'Vitta Natural';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  } else if (/nutri[çc][ãa]o cl[íi]nica/i.test(commercialName)) {
    brand = 'PremieR Nutrição Clínica';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  } else if (/nattu/i.test(commercialName)) {
    brand = 'PremieR Nattu';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  }

  // Se não foi identificado pelo nome nem URL, mas o breadcrumb indicar PremieR
  if (
    !commercialName.startsWith('PremieR') &&
    !commercialName.startsWith('GoldeN') &&
    !commercialName.startsWith('Golden') &&
    !commercialName.startsWith('Vitta') &&
    !/f[óo]rmula\s*natural|adimax|whiskas|pedigree|royal|purina|biofresh|guabi/i.test(commercialName)
  ) {
    commercialName = 'PremieR ' + commercialName;
  }

  // 4. Espécie, Fase de Vida, Porte, Formato
  const isDual = /c[ãa]es\s*e\s*gatos/i.test(commercialName) || /c[ãa]es\s*e\s*gatos/i.test(sourceUrl);
  const isGato = /gato|gatos|felin/i.test(commercialName) || /gato|gatos|felin/i.test(sourceUrl);
  const isCao = /c[ãa]o|c[ãa]es|cachorro|canin/i.test(commercialName) || /c[ãa]o|c[ãa]es|cachorro|canin/i.test(sourceUrl);

  let species: 'GATO' | 'CAO' | 'CAO_E_GATO' = 'CAO';
  if (isDual) species = 'CAO_E_GATO';
  else if (isGato) species = 'GATO';
  else if (isCao) species = 'CAO';

  let lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR' = 'ADULTO';
  if (/filhote|crescimento/i.test(commercialName)) lifeStage = 'CRESCIMENTO_INICIAL';
  else if (/7 a 11 anos|acima de 12 anos|senior|sênior/i.test(commercialName)) lifeStage = 'SENIOR';

  let breedSize: 'TODOS' | 'MINI_PEQUENO' | 'MEDIO_GRANDE' = 'TODOS';
  if (/porte pequeno|mini/i.test(commercialName)) breedSize = 'MINI_PEQUENO';
  else if (/porte grande|m[ée]dio/i.test(commercialName)) breedSize = 'MEDIO_GRANDE';

  let foodType: 'SECO' | 'UMIDO' =
    /úmido|umido|gourmet|sach[êe]|pat[êe]|lata/i.test(commercialName) ? 'UMIDO' : 'SECO';

  // 4.1 Categoria Legal e Condição Coadjuvante
  let legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR' = 'ALIMENTO_COMPLETO';
  let coadjuvanteCondition: string | null = null;

  if (/nutri[çc][ãa]o cl[íi]nica|vet\s*care|coadjuvante/i.test(commercialName)) {
    legalCategory = 'ALIMENTO_COADJUVANTE';
    const t = commercialName.toLowerCase();
    if (/renal/i.test(t)) coadjuvanteCondition = 'RENAL';
    else if (/urin[áa]ri/i.test(t)) coadjuvanteCondition = 'URINARIO';
    else if (/recupera/i.test(t)) coadjuvanteCondition = 'RECUPERACAO';
    else if (/obesidade|perda de peso|controle de peso/i.test(t)) coadjuvanteCondition = 'OBESIDADE';
    else if (/diabet/i.test(t)) coadjuvanteCondition = 'DIABETES';
    else if (/gastro|gastrointestinal/i.test(t)) coadjuvanteCondition = 'GASTROINTESTINAL';
    else if (/hipoalerg|pele sens[íi]vel/i.test(t)) coadjuvanteCondition = 'HIPOALERGENICO';
    else if (/hep[áa]t/i.test(t)) coadjuvanteCondition = 'HEPATICO';
    else coadjuvanteCondition = 'OUTRO';
  } else if (/cookie|biscoito|snack|petisco|bites|gourmet/i.test(commercialName)) {
    legalCategory = 'ALIMENTO_COMPLEMENTAR';
  }

  // 5. Extração de Composição e Garantias a partir do DOM
  let compText = '';
  let garText = '';

  // 5a. JetTabs / Accordions (Adimax / Elementor)
  $('.jet-toggle, .elementor-accordion-item').each((i, el) => {
    const title = $(el).find('.jet-toggle__label-text, .elementor-tab-title').text().trim();
    const content = $(el).find('.jet-toggle__content, .elementor-tab-content').text().trim();
    if (/composi[çc][ãa]o/i.test(title)) compText = content;
    if (/garantia/i.test(title)) garText = content;
  });

  // 5b. Abas WooCommerce (PremieR Pet, etc.)
  if (!compText) {
    compText = $(
      '#tab-composicao, #tab-composicao_basica, .woocommerce-Tabs-panel--composicao, div[id*="composic"]'
    ).text().trim();
  }
  if (!garText) {
    garText = $(
      '#tab-niveis_garantia, #tab-garantias, .woocommerce-Tabs-panel--niveis_garantia, div[id*="garanti"]'
    ).text().trim();
  }

  // 5c. Whiskas / Mars Petcare (Drupal)
  if (!compText) {
    $('.description-heading').each((_, el) => {
      if (/ingrediente/i.test($(el).text())) {
        const nextContent = $(el).next('.pdp_cooking_base_class__content-wysiwig, div').text().trim();
        if (nextContent && !compText) compText = nextContent;
      }
    });
  }
  if (!garText) {
    const nutritionTableText = $('.nutrition-table').text().trim();
    if (nutritionTableText) garText = nutritionTableText;
  }

  // 5d. Fallback de texto corrido
  const bodyText = $('body').text();
  if (!compText) {
    const m =
      bodyText.match(/composi[çc][ãa]o\s*b[áa]sica[^\n]*\n([\s\S]{50,1500}?)(?:N[íi]veis\s+de\s+garantia|An[áa]lise\s+garantida|Enriquecimento|$)/i) ||
      bodyText.match(/Ingredientes\s*[:\n]\s*([\s\S]{50,1500}?)(?:An[áa]lise\s+garantida|N[íi]veis\s+de\s+garantia|Guia\s+alimentar|$)/i);
    if (m) compText = m[1].trim();
  }
  if (!garText) {
    const m = bodyText.match(/(?:N[íi]veis\s+de\s+garantia|An[áa]lise\s+garantida)[\s\S]{50,2000}?(?:Enriquecimento|Tabela\s+de\s+consumo|Guia\s+alimentar|$)/i);
    if (m) garText = m ? m[0] : bodyText;
  }

  // 6. Níveis de Garantia
  const parseGuarantee = (pattern: RegExp): number => {
    const m = garText.match(pattern);
    if (!m) return 0;
    const rawVal = m[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawVal);
    const unit = (m[2] || '%').toLowerCase();
    if (unit.includes('mg')) return Number((val / 10000).toFixed(4));
    if (unit.includes('g/kg') || unit === 'g') return Number((val / 10).toFixed(2));
    return val;
  };

  const umidadeMaxPct =
    parseGuarantee(/Umidade[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 86.0 : 10.0);
  if (umidadeMaxPct > 50) foodType = 'UMIDO';

  const proteinaBrutaMinPct =
    parseGuarantee(/Prote[íi]na\s+(?:Bruta|Cruda)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const extratoEtereoMinPct =
    parseGuarantee(/Extrato Et[ée]reo[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const materiaMineralMaxPct =
    parseGuarantee(/Mat[ée]ria Mineral[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 2.5 : 8.0);

  const materiaFibrosaMaxPct =
    parseGuarantee(/(?:Mat[ée]ria|Fibra)\s*(?:Fibrosa|Bruta)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 1.5 : 3.5);

  const calcioMinPct =
    parseGuarantee(/C[áa]lcio[^\(]*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.2 : 0.8);

  const calcioMaxPct =
    parseGuarantee(/C[áa]lcio[^\(]*\(m[áa]x\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.45 : 1.5);

  const fosforoMinPct =
    parseGuarantee(/F[óo]sforo[^\(]*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.15 : 0.7);

  const sodioMinPct =
    parseGuarantee(/S[óo]dio[^\(]*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.1 : 0.25);

  const omega3MinPct =
    parseGuarantee(/[ÔO]mega\s*3.*?\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    0.2;

  // Energia Metabolizável
  let energiaMetabolizavelKcalKg: number | null = null;
  const emMatch = garText.match(/(\d{4})\s*kcal\/kg/i) || bodyText.match(/(\d{4})\s*kcal\/kg/i);
  if (emMatch) energiaMetabolizavelKcalKg = parseInt(emMatch[1], 10);

  // 7. Ingredientes
  let cleanComp = compText
    .replace(/^Composição\s*(?:básica)?[:\s]*/i, '')
    .replace(/-- \d+ of \d+ --/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanComp.includes('*Contém')) cleanComp = cleanComp.split('*Contém')[0];
  if (cleanComp.includes('*Ingredientes')) cleanComp = cleanComp.split('*Ingredientes')[0];

  const topIngredientsList: string[] = [];
  let cur = '';
  let parenDepth = 0;
  for (let i = 0; i < cleanComp.length; i++) {
    const c = cleanComp[i];
    if (c === '(') parenDepth++;
    else if (c === ')') parenDepth = Math.max(0, parenDepth - 1);

    if (c === ',' && parenDepth === 0) {
      const item = cur.trim().replace(/\.$/, '').trim();
      if (item && item.length > 1) topIngredientsList.push(item);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) {
    const item = cur.trim().replace(/\.$/, '').trim();
    if (item && item.length > 1) topIngredientsList.push(item);
  }

  // 8. Transgênicos e Antioxidantes
  const containsGmo =
    /\*Cont[ée]m.*transg|Esp[ée]cies\s+doadoras|transg[êe]nico/i.test(compText) &&
    !/n[ãa]o\s+transg[êe]nico|sem\s+transg[êe]nico/i.test(compText + ' ' + bodyText.slice(0, 800));

  let gmoIngredients: string | null = null;
  if (containsGmo) {
    const gmoMatch = compText.match(/\*Contém\s+([^.]+)/i);
    if (gmoMatch) gmoIngredients = gmoMatch[1].trim();
  }

  const hasBhaBht = /\bBHA\b|\bBHT\b|\bB\.H\.T\.\b/i.test(compText);
  const antioxidantType: 'NATURAL' | 'SINTETICO' = hasBhaBht ? 'SINTETICO' : 'NATURAL';


  return {
    commercialName,
    slug,
    brand,
    manufacturerLegalName,
    species,
    lifeStage,
    breedSize,
    foodType,
    legalCategory,
    coadjuvanteCondition,
    sourceUrl,
    imageUrl,
    umidadeMaxPct,
    proteinaBrutaMinPct,
    extratoEtereoMinPct,
    materiaMineralMaxPct,
    materiaFibrosaMaxPct,
    calcioMinPct,
    calcioMaxPct,
    fosforoMinPct,
    sodioMinPct,
    omega3MinPct,
    energiaMetabolizavelKcalKg,
    topIngredientsList,
    containsGmo,
    gmoIngredients,
    antioxidantType,
  };
}
