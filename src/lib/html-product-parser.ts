import * as cheerio from 'cheerio';
import { stripWeightFromTitle, normalizeIngredient } from '@/lib/utils';

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

function capitalizeTitle(str: string): string {
  if (!str) return '';
  const letters = str.match(/[a-zA-ZÀ-ÿ]/g) || [];
  const upperLetters = str.match(/[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]/g) || [];
  const isMostlyUpper = letters.length > 0 && upperLetters.length / letters.length >= 0.6;

  if (!isMostlyUpper) return str;

  const smallWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'com', 'para', 'ao', 'aos', 'por']);
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (i > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
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

  let imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('img.wp-post-image, .woocommerce-product-gallery__image img').first().attr('src') ||
    null;

  if (!imageUrl || imageUrl.includes('seo-default') || /specialcat\.com\.br|specialdog\.com\.br|farmina\.com/i.test(sourceUrl)) {
    if (/farmina\.com/i.test(sourceUrl)) {
      const farminaImg = $('img[src*="/fotoprodotti/"]')
        .filter((_, el) => {
          const src = $(el).attr('src') || '';
          return !src.includes('/icone/') && !src.includes('banner') && !src.includes('89x89');
        })
        .first()
        .attr('src');
      if (farminaImg) {
        imageUrl = farminaImg.startsWith('http') ? farminaImg : 'https://www.farmina.com' + farminaImg;
      }
    } else {
      const specialImg = $('img[src*="/assets/uploads/produtos/"]')
        .filter((_, el) => {
          const src = $(el).attr('src') || '';
          return !src.includes('/beneficios/') && !src.includes('/recomendacoes/');
        })
        .first()
        .attr('src');
      if (specialImg) imageUrl = specialImg;
    }
  }

  // 2. Nome Comercial e Slug
  let rawName = '';
  if (/specialcat\.com\.br|specialdog\.com\.br/i.test(sourceUrl)) {
    rawName =
      $('h1.font18, h1.fontsite-bold2').last().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      '';
  } else if (/premierpet\.com\.br/i.test(sourceUrl)) {
    // PremierPet: og:title is often duplicated/generic across variations, priority to specific h1/breadcrumb
    rawName =
      $('h1.title').first().text().trim() ||
      $('.breadcrumb_last').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      '';
  } else if (/farmina\.com/i.test(sourceUrl)) {
    const titleTag = $('title').text().trim();
    const parts = titleTag.split(/\s*-\s*/);
    if (parts.length >= 3) {
      const linePart = parts[2].trim();
      const prodPart = parts.slice(3).join(' ').trim();
      if (prodPart.toLowerCase().startsWith(linePart.toLowerCase())) {
        rawName = prodPart;
      } else if (prodPart) {
        rawName = `${linePart} ${prodPart}`;
      } else {
        rawName = linePart;
      }
    } else {
      rawName = $('h1').first().text().replace(/Informa[çc][õo]es\s+Nutricionais/i, '').trim();
    }
  } else {
    rawName =
      $('h1.product_title, h1.elementor-heading-title').first().text().trim() ||
      $('h1.title').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      '';
  }

  let commercialName = stripWeightFromTitle(
    capitalizeTitle(rawName.replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim())
  );

  let slug = '';
  if (sourceUrl && !/farmina\.com/i.test(sourceUrl)) {
    const m =
      sourceUrl.match(/\/(?:produto|products\/[^\/]+)\/([^/]+)\/?/i) ||
      sourceUrl.match(/\/([^/]+)\/?$/);
    if (m) slug = m[1];
  }
  if (!slug && commercialName) {
    slug = commercialName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'e')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // 3. Marca e Fabricante
  let brand = 'PremieR';
  let manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';

  if (/f[óo]rmula\s*natural|adimax|origens|magnus|qualidy/i.test(commercialName) || /adimax\.com\.br/i.test(sourceUrl)) {
    if (/origens/i.test(commercialName) || /origens/i.test(sourceUrl)) {
      brand = 'Origens';
    } else if (/magnus/i.test(commercialName) || /magnus/i.test(sourceUrl)) {
      brand = 'Magnus';
    } else if (/qualidy/i.test(commercialName) || /qualidy/i.test(sourceUrl)) {
      brand = 'Qualidy';
    } else if (/vet\s*care/i.test(commercialName)) {
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
  } else if (/specialcat\.com\.br|specialdog\.com\.br/i.test(sourceUrl) || /special\s*cat|special\s*dog|bionatural/i.test(commercialName)) {
    const isDog = /special\s*dog|produtos-caes|c[ãa]o|c[ãa]es/i.test(commercialName + ' ' + sourceUrl);
    if (/bionatural/i.test(commercialName) || /bionatural/i.test(sourceUrl)) {
      if (/sensitive/i.test(commercialName) || /sensitive/i.test(sourceUrl)) {
        brand = 'Bionatural Sensitive';
      } else {
        brand = 'Bionatural Prime';
      }
    } else if (/ultralife/i.test(commercialName) || /ultralife/i.test(sourceUrl)) {
      brand = isDog ? 'Special Dog Ultralife' : 'Special Cat Ultralife';
    } else if (/gold\s*life/i.test(commercialName) || /gold-life/i.test(sourceUrl)) {
      brand = 'Special Dog Gold Life';
    } else if (/\bplus\b/i.test(commercialName) || /-plus-/i.test(sourceUrl)) {
      brand = 'Special Dog Plus';
    } else if (/\bpro\b/i.test(commercialName) || /-pro-/i.test(sourceUrl)) {
      brand = 'Special Dog Pro';
    } else if (isDog) {
      brand = 'Special Dog';
    } else {
      brand = 'Special Cat';
    }
    manufacturerLegalName = 'Manfrim Industrial e Comercial Ltda';
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
  } else if (/farmina/i.test(commercialName) || /farmina\.com/i.test(sourceUrl)) {
    if (/tropical/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Tropical Selection';
    } else if (/ocean/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Ocean';
    } else if (/pumpkin/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Pumpkin';
    } else if (/prime/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Prime';
    } else if (/ancestral/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Ancestral Grain';
    } else if (/quinoa/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Quinoa';
    } else if (/spirulina/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Spirulina';
    } else if (/vet\s*life/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina Vet Life';
    } else if (/cibau/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina Cibau';
    } else if (/matisse/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina Matisse';
    } else if (/n&d|n-d|natural\s*&\s*delicious/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D';
    } else {
      brand = 'Farmina';
    }
    manufacturerLegalName = 'Farmina Pet Foods Brasil Ltda';
  }

  // Se não foi identificado pelo nome nem URL, mas o breadcrumb indicar PremieR
  if (
    !commercialName.startsWith('PremieR') &&
    !commercialName.startsWith('GoldeN') &&
    !commercialName.startsWith('Golden') &&
    !commercialName.startsWith('Vitta') &&
    !/f[óo]rmula\s*natural|adimax|origens|magnus|qualidy|whiskas|pedigree|royal|purina|biofresh|guabi|special|bionatural|farmina|n&d/i.test(commercialName) &&
    !/specialcat|specialdog|adimax\.com\.br|farmina\.com/i.test(sourceUrl)
  ) {
    commercialName = 'PremieR ' + commercialName;
  }
  commercialName = commercialName.replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim();

  // 4. Espécie, Fase de Vida, Porte, Formato
  const isDual = /c[ãa]es\s*e\s*gatos/i.test(commercialName) || /c[ãa]es\s*e\s*gatos/i.test(sourceUrl);
  const isGato = /gato|gatos|felin/i.test(commercialName) || /gato|gatos|felin/i.test(sourceUrl);
  const isCao = /c[ãa]o|c[ãa]es|cachorro|canin/i.test(commercialName) || /c[ãa]o|c[ãa]es|cachorro|canin/i.test(sourceUrl);

  let species: 'GATO' | 'CAO' | 'CAO_E_GATO' = 'CAO';
  if (isDual) species = 'CAO_E_GATO';
  else if (isGato) species = 'GATO';
  else if (isCao) species = 'CAO';

  let lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR' = 'ADULTO';
  if (/filhote|junior|j[úu]nior|crescimento/i.test(commercialName)) lifeStage = 'CRESCIMENTO_INICIAL';
  else if (/7 a 11 anos|acima de 12 anos|senior|sênior|7\s*\+|10\s*\+/i.test(commercialName) || /10\+|senior-7/i.test(sourceUrl)) lifeStage = 'SENIOR';

  let breedSize: 'TODOS' | 'MINI_PEQUENO' | 'MEDIO_GRANDE' = 'TODOS';
  if (/porte\s*pequeno|pequeno\s*porte|mini|ra[çc]as?\s*pequenas?/i.test(commercialName + ' ' + sourceUrl)) {
    breedSize = 'MINI_PEQUENO';
  } else if (/porte\s*grande|grande\s*porte|m[ée]dio|ra[çc]as?\s*(?:m[ée]dias|grandes|gigantes)/i.test(commercialName + ' ' + sourceUrl)) {
    breedSize = 'MEDIO_GRANDE';
  }

  let foodType: 'SECO' | 'UMIDO' =
    /úmido|umido|gourmet|sach[êe]|pat[êe]|lata|creminho/i.test(commercialName + ' ' + sourceUrl) ? 'UMIDO' : 'SECO';

  // 4.1 Categoria Legal e Condição Coadjuvante
  let legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR' = 'ALIMENTO_COMPLETO';
  let coadjuvanteCondition: string | null = null;

  if (/nutri[çc][ãa]o cl[íi]nica|vet\s*care|vet\s*life|coadjuvante/i.test(commercialName + ' ' + sourceUrl)) {
    legalCategory = 'ALIMENTO_COADJUVANTE';
    const t = (commercialName + ' ' + sourceUrl).toLowerCase();
    if (/renal/i.test(t)) coadjuvanteCondition = 'RENAL';
    else if (/urin[áa]ri|struvite/i.test(t)) coadjuvanteCondition = 'URINARIO';
    else if (/recupera|convalescence/i.test(t)) coadjuvanteCondition = 'RECUPERACAO';
    else if (/obesidade|obesity|perda de peso|controle de peso/i.test(t)) coadjuvanteCondition = 'OBESIDADE';
    else if (/diabet/i.test(t)) coadjuvanteCondition = 'DIABETES';
    else if (/gastro|gastrointestinal/i.test(t)) coadjuvanteCondition = 'GASTROINTESTINAL';
    else if (/hipoalerg|hypoallergenic|pele sens[íi]vel/i.test(t)) coadjuvanteCondition = 'HIPOALERGENICO';
    else if (/hep[áa]t|hepatic/i.test(t)) coadjuvanteCondition = 'HEPATICO';
    else coadjuvanteCondition = 'OUTRO';
  } else if (
    /cookie|biscoito|snack|petisco|bites|bifinho|bifinhos|creminho|dental|mastig[áa]vel|osso|casco|orelha|traqueia|chifre/i.test(commercialName + ' ' + sourceUrl) ||
    /n&d-natural/i.test(sourceUrl) ||
    /premier.*gourmet/i.test(commercialName) ||
    (/gourmet/i.test(commercialName) && !/golden.*gourmet.*gato/i.test(commercialName + ' ' + sourceUrl))
  ) {
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

  // 5b. Accordions da PremieRpet (.mob-accordion)
  if (!compText || !garText) {
    $('.mob-accordion__header').each((_, el) => {
      const title = $(el).text().trim();
      const body = $(el).next('.mob-accordion__body');
      if (/composi[çc][ãa]o/i.test(title)) {
        if (!compText) {
          const p = body.find('p').first().text().trim();
          if (p) compText = p;
        }
        if (!garText) {
          const tableText = body.find('table').text().trim();
          if (tableText) garText = tableText;
        }
      }
      if (/garantia/i.test(title) && !garText) {
        garText = body.text().trim();
      }
    });
  }

  // 5c. Elementor Off-Canvas / Abas Modernas (PremieRpet)
  if (!compText) {
    const elComp = $('[class*="e-off-canvas"][aria-label*="Composi"], div[aria-label*="Composi"]').text().trim();
    if (elComp) compText = elComp;
  }
  if (!garText) {
    const elGar = $('[class*="e-off-canvas"][aria-label*="Garantia"], div[aria-label*="Garantia"]').text().trim();
    if (elGar) garText = elGar;
  }

  // 5d. Abas WooCommerce (PremieR Pet, etc.)
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

  // 5d. Whiskas / Mars Petcare (Drupal)
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

  // 5e. Special Cat / Special Dog (Manfrim)
  if (!compText) {
    const specialComp = $('#descricao-composicao').text().trim();
    if (specialComp) compText = specialComp;
  }
  if (!garText) {
    const specialGar = $('#descricao-garantia').text().trim();
    if (specialGar) garText = specialGar;
  }

  // 5f. Farmina Pet Foods (.titoletto, p.comp)
  if (!compText || !garText) {
    $('span.titoletto').each((_, el) => {
      const title = $(el).text().trim();
      const content = $(el).nextAll('p.comp, p').first().text().trim();
      if (/composi/i.test(title) && !compText) compText = content;
      if (/garanti/i.test(title) && !garText) garText = content;
    });
  }

  // 5g. Fallback de tabelas HTML
  if (!garText) {
    const tableText = $('table').first().text().trim();
    if (tableText) garText = tableText;
  }

  // 5g. Fallback de texto corrido
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
    parseGuarantee(/Prote[íi]na\s+(?:Bruta|Cruda)t?[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const extratoEtereoMinPct =
    parseGuarantee(/Extrato\s+Et[ée]reot?[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const materiaMineralMaxPct =
    parseGuarantee(/Mat[ée]ria\s+Mineralt?[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 2.5 : 8.0);

  const materiaFibrosaMaxPct =
    parseGuarantee(/(?:Mat[ée]ria|Fibra)\s*(?:Fibrosa|Bruta)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 1.5 : 3.5);

  const calcioMinPct =
    parseGuarantee(/C[áa]lcio[\s\S]*?\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.2 : 0.8);

  const calcioMaxPct =
    parseGuarantee(/C[áa]lcio[\s\S]*?\(m[áa]x\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.45 : 1.5);

  const fosforoMinPct =
    parseGuarantee(/F[óo]sforo[\s\S]*?\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.15 : 0.7);

  const sodioMinPct =
    parseGuarantee(/S[óo]dio[\s\S]*?\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.1 : 0.25);

  const omega3MinPct =
    parseGuarantee(/[ÔO]mega\s*3[\s\S]*?\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    0.2;

  // Energia Metabolizável
  let energiaMetabolizavelKcalKg: number | null = null;
  const emMatch =
    garText.match(/(\d{1,2}(?:[\.,]\d{3})|\d{4})\s*kcal\/kg/i) ||
    bodyText.match(/(\d{1,2}(?:[\.,]\d{3})|\d{4})\s*kcal\/kg/i) ||
    bodyText.match(/EM\s+Kcal\/Kg\s+(\d+(?:[\.,]\d+)?)/i);
  if (emMatch) {
    const raw = emMatch[1].trim();
    if (raw.includes(',')) {
      energiaMetabolizavelKcalKg = Math.round(parseFloat(raw.replace(',', '.')));
    } else if (raw.includes('.')) {
      const parts = raw.split('.');
      if (parts[1] && parts[1].length === 3) {
        energiaMetabolizavelKcalKg = parseInt(raw.replace('.', ''), 10);
      } else {
        energiaMetabolizavelKcalKg = Math.round(parseFloat(raw));
      }
    } else {
      energiaMetabolizavelKcalKg = parseInt(raw, 10);
    }
  }

  // 7. Ingredientes
  let cleanComp = compText
    .replace(/^Composição\s*(?:básica)?[:\s]*/i, '')
    .replace(/-- \d+ of \d+ --/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  cleanComp = cleanComp.split(/Eventuais\s+substitutivos[:\s]/i)[0];
  cleanComp = cleanComp.split(/Cont[ée]m,?\s+(?:na\s+composi[çc][ãa]o,?\s+)?alimento\s+geneticamente\s+modificado[:\s]/i)[0];
  cleanComp = cleanComp.split(/Esp[ée]cies\s+doadoras\s+de\s+gene[:\s]/i)[0];
  cleanComp = cleanComp.split(/\*Cont[ée]m/i)[0];
  cleanComp = cleanComp.split(/\*Ingredientes/i)[0];

  const topIngredientsList: string[] = [];
  let cur = '';
  let parenDepth = 0;
  for (let i = 0; i < cleanComp.length; i++) {
    const c = cleanComp[i];
    if (c === '(' || c === '[' || c === '{') parenDepth++;
    else if (c === ')' || c === ']' || c === '}') parenDepth = Math.max(0, parenDepth - 1);

    if (c === ',' && parenDepth === 0) {
      const prevIsDigit = i > 0 && /\d/.test(cleanComp[i - 1]);
      const nextIsDigit = i < cleanComp.length - 1 && /\d/.test(cleanComp[i + 1]);
      if (prevIsDigit && nextIsDigit) {
        cur += c;
        continue;
      }
      const item = cur.trim().replace(/\.$/, '').trim();
      if (item && item.length > 1) topIngredientsList.push(normalizeIngredient(item));
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) {
    const item = cur.trim().replace(/\.$/, '').trim();
    if (item && item.length > 1) topIngredientsList.push(normalizeIngredient(item));
  }

  // 8. Transgênicos e Antioxidantes
  const containsGmo =
    /\*Cont[ée]m.*transg|Esp[ée]cies\s+doadoras|transg[êe]nico|alimento\s+geneticamente\s+modificado/i.test(compText) &&
    !/n[ãa]o\s+transg[êe]nico|sem\s+transg[êe]nico|livre\s+de\s+(?:ingredientes\s+)?geneticamente\s+modificados?/i.test(compText + ' ' + bodyText.slice(0, 1500));

  let gmoIngredients: string | null = null;
  if (containsGmo) {
    const gmoMatch =
      compText.match(/(?:alimento\s+geneticamente\s+modificado|\*Cont[ée]m)\s*[:\s]*([^.]+)/i) ||
      compText.match(/Esp[ée]cies\s+doadoras\s+de\s+gene[:\s]*([^.]+)/i);
    if (gmoMatch) {
      gmoIngredients = gmoMatch[1]
        .replace(/^[,\s]*(?:na\s+composi[çc][ãa]o,?\s*)?(?:alimento\s+geneticamente\s+modificado\s*[:\s]*)?/i, '')
        .trim();
    }
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
