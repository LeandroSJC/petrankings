import * as cheerio from 'cheerio';
import { stripWeightFromTitle, normalizeIngredient, stripFootnotesFromIngredient } from '@/lib/utils';

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
  calcioMaxPct: number | null;
  fosforoMinPct: number;
  sodioMinPct: number | null;
  omega3MinPct: number | null;
  energiaMetabolizavelKcalKg: number | null;

  // Ingredientes
  topIngredientsList: string[];
  containsGmo: boolean;
  gmoIngredients: string | null;
  antioxidantType: 'NATURAL' | 'SINTETICO' | 'MISTO';
}

/**
 * Fallback oficial e curado para produtos cujos fabricantes omitiram a composição no HTML
 */
const CURATED_INGREDIENTS_FALLBACKS: Record<string, string> = {
  'prescription-diet-ad-urgent-care-canned':
    'Água, miúdos de aves, fígado suíno, carne mecanicamente separada de frango, farinha de milho, farinha de torresmo, óleo de peixe refinado, carbonato de cálcio, hidrolisado de fígado de frango, tripolifosfato de sódio, cloreto de potássio, fosfato bicálcio, goma guar, vitaminas (vitaminas B12, ácido ascórbico polifosfato (fonte de vitamina C), vitamina D3, vitamina E, ácido fólico (B9), biotina (B7), cloreto de colina, mononitrato de tiamina (B1), niacina (B3), pantotenato de cálcio (B5), cloridrato de piridoxina (B6), riboflavina (B2)), betacaroteno, minerais (sulfato ferroso, óxido de zinco, sulfato de cobre, sulfato de manganês, iodato de cálcio), citrato de potássio, gema de ovo, taurina, DL-Metionina, cisteína, glicina, ácido cítrico, óxido de magnésio, dextrose.',
  'science-diet-adult-perfect-digestion-salmon-oats-rice-dry':
    'Salmão, Arroz Integral, Farelo Proteico de Milho - 60*, Grão de Aveia, Proteínas de Batata, Grão de Milho*, Gordura de Frango, Farinha de Carne e Ossos de Aves, Ovo Em Pó, Hidrolisado de Miúdos de Aves, Casca de Nozes, Ácido Lático, Cloreto de Potássio, Sulfato de Cálcio, Grão de Linhaça, Polpa Desidratada de Beterraba, Polpa Cítrica, L-Lisina, Óleo de Soja Refinado**, Cloreto de Sódio, Cloreto de Colina, Extrato de Arando, Abóbora, Taurina, Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ácido Ascórbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de Cálcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ácido Fólico (B9), Colecalciferol (D3)), Carbonato de Cálcio, DL-Metionina, Minerais (Sulfato Ferroso, Óxido de Zinco, Sulfato de Cobre, Óxido de Manganês, Iodato de Cálcio, Selenito de Sódio), Concentrado de Tocoferóis, Extrato de Chá Verde, Extrato de Alecrim, Extrato de Menta, Hortelã (Mentha spp.), Betacaroteno.',
  'science-diet-adult-sensitive-stomach-skin-small-bites-dry':
    'Carne Mecanicamente Separada de Frango, Farinha de Carnes e Osso de Aves, Ervilha in Natura Moída, Farinha de Cevada, Arroz Integral, Quirera de Arroz, Grão de Sorgo, Ovo Em Pó, Gordura de Frango, Óleo de Soja Refinado**, Polpa Desidratada de Beterraba, Hidrolisado de Miúdos de Aves, Ácido Lático, Grão de Linhaça, Hidrolisado de Fígado de Suínos, Cloreto de Potássio, Cloreto de Sódio, Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ácido Ascórbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de Cálcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ácido Fólico (B9), Colecalciferol (D3)), Cloreto de Colina, Taurina, Concentrado de Tocoferóis, Minerais (Sulfato Ferroso, Óxido de Zinco, Sulfato de Cobre, Óxido de Manganês, Iodato de Cálcio, Selenito de Sódio), Extrato de Chá Verde, Extrato de Alecrim, Extrato de Menta, Hortelã (Mentha spp.), Betacaroteno.',
  'science-diet-adult-perfect-digestion-chicken-rice-oats-dry':
    'Carne Mecanicamente Separada de Frango, Farinha de Cevada, Arroz Integral, Quirera de Arroz, Grão de Aveia, Grão de Milho*, Farelo Proteico de Milho - 60*, Farinha de Carne e Ossos de Aves, Gordura de Frango, Hidrolisado de Miúdos de Aves, Hidrolisado de Fígado de Suínos, Casca de Nozes, Óleo de Soja Refinado**, Ácido Lático, Cloreto de Potássio, Grão de Linhaça, Polpa Desidratada de Beterraba, Polpa Cítrica, Cloreto de Sódio, Cloreto de Colina, Carbonato de Cálcio, Fosfato Bicálcico, Óleo (Refinado, Branqueado e Desodorizado) de Peixes, Extrato de Arando, Abóbora, Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ácido Ascórbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de Cálcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ácido Fólico (B9), Colecalciferol (D3)), Minerais (Sulfato Ferroso, Óxido de Zinco, Sulfato de Cobre, Óxido de Manganês, Iodato de Cálcio, Selenito de Sódio), Taurina, Concentrado de Tocoferóis, Extrato de Chá Verde, Extrato de Alecrim, Extrato de Menta, Hortelã (Mentha spp.), Betacaroteno.',
  'science-diet-adult-sensitive-stomach-skin-small-mini-chicken-dry':
    'Carne Mecanicamente Separada de Frango, Quirera de Arroz, Farinha de Carne e Ossos de Aves, Ervilha in Natura Moída, Farinha de Cevada, Grão de Sorgo, Ovo Em Pó, Gordura de Frango, Óleo de Soja Refinado*, Arroz Integral, Polpa Desidratada de Beterraba, Hidrolisado de Miúdos de Aves, Ácido Lático, Hidrolisado de Fígado de Suínos, Cloreto de Potássio, Grão de Linhaça, Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ácido Ascórbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de Cálcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ácido Fólico (B9), Colecalciferol (D3)), Cloreto de Sódio, Cloreto de Colina, Taurina, Minerais (Sulfato Ferroso, Óxido de Zinco, Sulfato de Cobre, Óxido de Manganês, Iodato de Cálcio, Selenito de Sódio), Concentrado de Tocoferóis, Extrato de Chá Verde, Extrato de Alecrim, Extrato de Menta, Hortelã (Mentha spp.), Betacaroteno.',
  'science-diet-science-plan-adult-7-senior-vitality-chicken-rice-dry':
    'Carne Mecanicamente Separada de Frango, Quirera de Arroz, Ervilha in Natura Moída, Farinha de Cevada, Grão de Aveia, Grão de Milho*, Ovo Em Pó, Gordura de Frango, Hidrolisado de Miúdos de Aves, Farelo Proteico de Milho - 60*, Óleo de Soja Refinado**, Grão de Linhaça, Hidrolisado de Fígado de Suínos, Ácido Lático, L-Lisina, Cloreto de Potássio, Carbonato de Cálcio, Fosfato Bicálcico, Cenoura, Massa de Tomate Desidratada, Polpa Cítrica, Espinafre Desidratado, Óleo (Refinado, Branqueado e Desodorizado) de Peixes, Cloreto de Sódio, Ácido Alfa-Lipóico (ALA), Vitaminas (Acetato de DL-Alfa-Tocoferol (E), Ácido Ascórbico Polifosfato (C), Niacina (B3), Mononitrato de Tiamina (B1), Retinol (A), D-Pantotenato de Cálcio (B5), Riboflavina (B2), Biotina (B7), Cianocobalamina (B12), Cloridrato de Piridoxina (B6), Ácido Fólico (B9), Colecalciferol (D3)), Cloreto de Colina, Taurina, Minerais (Sulfato Ferroso, Óxido de Zinco, Sulfato de Cobre, Óxido de Manganês, Iodato de Cálcio, Selenito de Sódio), Extrato de Chá Verde, Extrato de Alecrim, Extrato de Menta, Hortelã (Mentha spp.), L-Triptofano, Concentrado de Tocoferóis, L-Carnitina, Betacaroteno.',
};

function capitalizeTitle(str: string): string {
  if (!str) return '';

  // 0. Preserva fórmulas canônicas da Hill's Prescription Diet (k/d, c/d, i/d, etc.)
  const hillsCodes = ['k/d', 'c/d', 'i/d', 'u/d', 'r/d', 'w/d', 'z/d', 'j/d', 'a/d', 'l/d', 'y/d', 's/d', 't/d'];
  const placeholderMap = new Map<string, string>();
  let s = str;
  hillsCodes.forEach((code, idx) => {
    const regex = new RegExp(`\\b${code.replace('/', '\\/')}\\b`, 'gi');
    const ph = `__HILLS_CODE_${idx}__`;
    if (regex.test(s)) {
      placeholderMap.set(ph, code.toLowerCase());
      s = s.replace(regex, ph);
    }
  });

  // 1. Normaliza barras "/" substituindo por " e " entre palavras
  s = s.replace(/(\w+)\s*\/\s*(\w+)/g, '$1 e $2').replace(/\s*\/\s*/g, ' e ');

  // 2. Preposições, artigos e conectivos que devem ficar em minúsculo (salvo início de frase)
  const smallWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'com', 'para', 'ao', 'aos', 'por', 'a', 'as', 'o', 'os']);

  // 3. Siglas que devem permanecer em maiúsculo
  const acronyms = new Set(['MOS', 'BHA', 'BHT', 'EPA', 'DHA', 'FOS', 'HACCP', 'GMP', 'BPF', 'FIT', 'DNA']);

  // 4. Marcas registradas com grafia mista consagrada
  const specialCasings: Record<string, string> = {
    premier: 'PremieR',
    golden: 'GoldeN',
    'n&d': 'N&D',
    prohealth: 'ProHealth',
    allcats: 'AllCats',
    qualiday: 'Qualiday',
    qualyday: 'Qualiday',
  };

  let result = s
    .split(/\s+/)
    .map((word, i) => {
      if (!word) return '';

      // Preserva termos como +7 ou 7+
      if (/^\+\d+|\d+\+$/.test(word)) return word;

      // Trata palavras hifenizadas como batata-doce ou sênior-7
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part, pIdx) => {
            if (acronyms.has(part.toUpperCase())) return part.toUpperCase();
            if (specialCasings[part.toLowerCase()]) return specialCasings[part.toLowerCase()];
            if (/^\d+$/.test(part)) return part;
            if (pIdx > 0) return part.toLowerCase();
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }

      const upperWord = word.toUpperCase();
      if (acronyms.has(upperWord)) return upperWord;

      const lowerWord = word.toLowerCase();
      if (specialCasings[lowerWord]) return specialCasings[lowerWord];
      if (i > 0 && smallWords.has(lowerWord)) {
        return lowerWord;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [ph, code] of placeholderMap.entries()) {
    result = result.replaceAll(ph, code).replaceAll(ph.toLowerCase(), code);
  }

  return result;
}

/**
 * Converte strings numéricas de rotulagem nutricional de forma determinística
 * Reconhece separadores de milhar (1.500) vs decimais (1.40 ou 1,40)
 */
export function parseNutritionNumber(str: string): number {
  const s = str.trim();
  if (s.includes(',') && s.includes('.')) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  if (s.includes(',')) {
    return parseFloat(s.replace(',', '.'));
  }
  if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
      return parseFloat(parts[0] + parts[1]);
    }
    return parseFloat(s);
  }
  return parseFloat(s);
}

/**
 * Extrai texto de containers HTML preservando quebras de linha e separadores de células (:),
 * impedindo concatenações indevidas que fundem nutrientes e porcentagens.
 */
export function extractStructuredText($el: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  if (!$el || $el.length === 0) return '';
  
  if ($el.find('table tr').length > 0) {
    const rows: string[] = [];
    $el.find('table tr').each((_, tr) => {
      const cells = $(tr).find('th, td').map((_, c) => $(c).text().trim()).get().filter(Boolean);
      if (cells.length > 0) {
        rows.push(cells.join(' : '));
      }
    });
    if (rows.length > 0) return rows.join('\n');
  }

  const clone = $el.clone();
  clone.find('br').replaceWith('\n');
  clone.find('p, div, tr, li, h1, h2, h3, h4, h5, h6, section, article').each((_, el) => {
    $(el).append('\n');
  });
  clone.find('td, th').each((_, el) => {
    $(el).append(' : ');
  });
  return clone.text().split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

/**
 * Extrai o corpo textual estruturado removendo scripts e preservando separadores em blocos
 */
export function extractStructuredBodyText($: cheerio.CheerioAPI): string {
  const clone = $('body').clone();
  clone.find('script, style, noscript, svg, nav, footer, header').remove();
  clone.find('br').replaceWith('\n');
  clone.find('p, div, tr, li, h1, h2, h3, h4, h5, h6, section, article, table').each((_, el) => {
    $(el).append('\n');
  });
  clone.find('td, th').each((_, el) => {
    $(el).append(' : ');
  });
  return clone.text().split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

/**
 * Extrai Cálcio (Mín. e Máx.) de forma precisa a partir do texto de garantias
 */
export function extractCalciumPrecise(garText: string, foodType: 'SECO' | 'UMIDO' = 'SECO'): { min: number; max: number | null } {
  let calcioMinPct = 0;
  let calcioMaxPct: number | null = null;

  const parseVal = (numStr: string, unitStr?: string, trailingText?: string): number => {
    const val = parseNutritionNumber(numStr);
    if (isNaN(val)) return 0;

    if (trailingText) {
      const pctMatch = trailingText.match(/^\s*(?::|\/|\(|-)?\s*(\d+(?:[\.,]\d+)?)\s*%\s*\)?/);
      if (pctMatch) {
        return parseNutritionNumber(pctMatch[1]);
      }
      if (!unitStr) {
        const uMatch = trailingText.match(/^\s*(?::|\/|\(|-)?\s*(%|g\/kg|mg\/kg|mg|g)\b/i);
        if (uMatch) unitStr = uMatch[1];
      }
    }

    const unit = (unitStr || '').toLowerCase();
    if (unit === '%') return val;
    if (unit.includes('mg') || (!unit && val >= 50)) return Number((val / 10000).toFixed(4));
    if (unit.includes('g/kg') || unit === 'g' || (!unit && val > 5.0 && val < 50)) return Number((val / 10).toFixed(2));
    return val;
  };

  const clauses = garText
    .split(/(?:[\r\n;]+|,(?!\s*\d))/i)
    .map(c => c.trim())
    .filter(Boolean);

  const caClauses = clauses.filter(c =>
    /(?<!\b(?:de|pantotenato|iodato|carbonato|sulfato|aluminossilicato|aluminosilicato|propionato)\s+)\bc[áa]lcio\b/i.test(c)
  );

  const fullCaContext = caClauses.length > 0 ? caClauses.join(' ; ') : (() => {
    const m = garText.match(/(?<!\b(?:de|pantotenato|iodato|carbonato|sulfato|aluminossilicato|aluminosilicato|propionato)\s+)\bc[áa]lcio\b[\s\S]{0,180}?(?=(?:f[óo]sforo|s[óo]dio|umidade|prote[íi]na|extrato|mat[ée]ria|cinzas|[\r\n]|$))/i);
    return m ? m[0] : '';
  })();

  if (fullCaContext) {
    const pcts: number[] = [];
    const pctMatches = fullCaContext.matchAll(/(\d+(?:[\.,]\d+)?)\s*%/g);
    for (const pm of pctMatches) {
      pcts.push(parseNutritionNumber(pm[1]));
    }

    // 2. Check if context has a compound min/max label: e.g. "Cálcio (mín./máx.)" or "Cálcio (mín/máx)" or "Cálcio (mín. - máx.)"
    const isCompoundMinMax = /\bm[íi]n(?:imo|\.?)?\s*[\/\-]\s*m[áa]x(?:imo|\.?)?\b/i.test(fullCaContext);

    if (isCompoundMinMax || (!/\bm[íi]n(?:imo|\.?)?\b/i.test(fullCaContext) && !/\bm[áa]x(?:imo|\.?)?\b/i.test(fullCaContext))) {
      // If there are 2 or more percentages in this line/clause, min is the smaller and max is the larger
      if (pcts.length >= 2) {
        calcioMinPct = Math.min(pcts[0], pcts[1]);
        calcioMaxPct = Math.max(pcts[0], pcts[1]);
        return { min: calcioMinPct, max: calcioMaxPct };
      }

      // Otherwise extract all numbers with possible units
      const numMatches = [...fullCaContext.matchAll(/(\d+(?:[\.,]\d+)?)\s*(?::|\/|\-)?\s*(%|g\/kg|mg\/kg|g)?/gi)];
      if (numMatches.length >= 2) {
        const after0 = fullCaContext.slice(numMatches[0].index! + numMatches[0][0].length, numMatches[0].index! + numMatches[0][0].length + 25);
        const after1 = fullCaContext.slice(numMatches[1].index! + numMatches[1][0].length, numMatches[1].index! + numMatches[1][0].length + 25);
        const v1 = parseVal(numMatches[0][1], numMatches[0][2], after0);
        const v2 = parseVal(numMatches[1][1], numMatches[1][2], after1);
        if (v1 > 0 && v2 > 0) {
          calcioMinPct = Math.min(v1, v2);
          calcioMaxPct = Math.max(v1, v2);
          return { min: calcioMinPct, max: calcioMaxPct };
        }
      }
    }

    // 3. Separate individual min and max labels (must NOT match if it's a compound mín/máx label)
    const minM = fullCaContext.match(/(?:\b(?:m[íi]n(?:imo|\.?)?|m[íi]nimo)\b)(?!\s*[\/\-]\s*m[áa]x)[^\d]*(\d+(?:[\.,]\d+)?)\s*(?::|\/|\-)?\s*(%|g\/kg|mg\/kg|g)?/i);
    const maxM = fullCaContext.match(/(?<!m[íi]n(?:imo|\.?)?\s*[\/\-]\s*)(?:\b(?:m[áa]x(?:imo|\.?)?|m[áa]ximo)\b)[^\d]*(\d+(?:[\.,]\d+)?)\s*(?::|\/|\-)?\s*(%|g\/kg|mg\/kg|g)?/i);

    if (minM) {
      const after = fullCaContext.slice(minM.index! + minM[0].length, minM.index! + minM[0].length + 25);
      calcioMinPct = parseVal(minM[1], minM[2], after);
    }
    if (maxM) {
      const after = fullCaContext.slice(maxM.index! + maxM[0].length, maxM.index! + maxM[0].length + 25);
      calcioMaxPct = parseVal(maxM[1], maxM[2], after);
    }

    if (calcioMinPct > 0 && calcioMaxPct !== null) {
      if (calcioMinPct > calcioMaxPct) {
        const tmp = calcioMinPct;
        calcioMinPct = calcioMaxPct;
        calcioMaxPct = tmp;
      }
      return { min: calcioMinPct, max: calcioMaxPct };
    }

    const rangeM = fullCaContext.match(/(\d+(?:[\.,]\d+)?)\s*(?::|\/|\-)?\s*(%|g\/kg|mg\/kg|g)?\s*(?:-|a|à|\/)\s*(\d+(?:[\.,]\d+)?)\s*(?::|\/|\-)?\s*(%|g\/kg|mg\/kg|g)?/i);
    if (rangeM) {
      const u2 = rangeM[4];
      const u1 = rangeM[2] || u2;
      const v1 = parseVal(rangeM[1], u1);
      const v2 = parseVal(rangeM[3], u2);
      calcioMinPct = Math.min(v1, v2);
      calcioMaxPct = Math.max(v1, v2);
      return { min: calcioMinPct, max: calcioMaxPct };
    }

    if (pcts.length >= 2 && calcioMinPct === 0) {
      calcioMinPct = Math.min(...pcts);
      calcioMaxPct = Math.max(...pcts);
      return { min: calcioMinPct, max: calcioMaxPct };
    }

    if (calcioMinPct === 0 && calcioMaxPct === null) {
      const singleM = fullCaContext.match(/(\d+(?:[\.,]\d+)?)\s*(?::|\/|\-)?\s*(%|g\/kg|mg\/kg|g)?/i);
      if (singleM) {
        const after = fullCaContext.slice(singleM.index! + singleM[0].length, singleM.index! + singleM[0].length + 25);
        const val = parseVal(singleM[1], singleM[2], after);
        if (/\b(?:m[áa]x(?:imo|\.?)?|m[áa]ximo)\b/i.test(fullCaContext)) {
          calcioMaxPct = val;
        } else {
          calcioMinPct = val;
        }
      }
    }
  }

  // Safety fallbacks
  if (!calcioMinPct) {
    const fallbackM = garText.match(/C[áa]lcio[^\n\d]*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);
    if (fallbackM) {
      calcioMinPct = parseVal(fallbackM[1], fallbackM[2]) || (foodType === 'UMIDO' ? 0.2 : 0.8);
    } else {
      calcioMinPct = foodType === 'UMIDO' ? 0.2 : 0.8;
    }
  }

  if (calcioMinPct > 4.0) calcioMinPct = Number((calcioMinPct / 10).toFixed(2));
  if (calcioMaxPct && calcioMaxPct > 5.0) calcioMaxPct = Number((calcioMaxPct / 10).toFixed(2));

  return { min: calcioMinPct, max: calcioMaxPct };
}

/**
 * Extrator universal de metadados, níveis de garantia e composição a partir do HTML oficial
 */
export function parseProductFromHtml(
  html: string,
  fallbackUrl: string = '',
  options?: { preferSecondImage?: boolean }
): ProductHtmlMetadata {
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

  if (imageUrl && (/hills-logo/i.test(imageUrl) || imageUrl.includes('seo-default'))) {
    imageUrl = null;
  }

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

  if (!imageUrl && /biofreshpet\.com\.br/i.test(sourceUrl)) {
    const blobMatch = html.match(/https:\/\/brfsawebsitespet\.blob\.core\.windows\.net\/bio-fresh\/[^\"]+?\.(?:jpg|png|webp|jpeg)[^\"]*?(?:sig=|sig%3D|sv=)[^\"]*/i);
    if (blobMatch) {
      imageUrl = blobMatch[0]
        .replace(/\\u0026/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/[\\]+$/, '')
        .trim();
    }
    if (!imageUrl) {
      const eanMatch =
        html.match(/\"name\":\"C[óo]digo do produto\"[^\}]*?\"content\":\"(\d+)\"/i) ||
        html.match(/seuproduto360\.com\.br\/brf\/(\d+)\//);
      if (eanMatch) {
        imageUrl = `https://seuproduto360.com.br/brf/${eanMatch[1]}/miniatura.jpg`;
      }
    }
  }

  // 1c. Extração Royal Canin
  const isRoyalCanin = /royalcanin\.com/i.test(sourceUrl);
  if (!imageUrl && isRoyalCanin) {
    const rcHeroImg = $('[class*="ProductImages"] img, [class*="DAMImage"] img, [data-testid="product-image"] img')
      .filter((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        return (
          (src.includes('weshare') || src.includes('aprimocdn')) &&
          !src.includes('topnav') &&
          !src.includes('couch') &&
          !src.includes('emblematic') &&
          !src.includes('fa1fdb76') &&
          !src.includes('087a2034')
        );
      })
      .first()
      .attr('src');
    if (rcHeroImg) {
      imageUrl = rcHeroImg;
    } else {
      const anyRcImg = $('img')
        .filter((_, el) => {
          const alt = $(el).attr('alt') || '';
          const src = $(el).attr('src') || $(el).attr('data-src') || '';
          return (
            (src.includes('weshare') || src.includes('aprimocdn')) &&
            alt.length > 5 &&
            !src.includes('topnav') &&
            !src.includes('couch') &&
            !src.includes('emblematic') &&
            !src.includes('fa1fdb76') &&
            !src.includes('087a2034')
          );
        })
        .first()
        .attr('src');
      if (anyRcImg) imageUrl = anyRcImg;
    }
  }

  // 1d. Extração Purina (Pro Plan, ONE, Cat Chow, Friskies, Fancy Feast, Dog Chow)
  if (/purina\.com\.br/i.test(sourceUrl)) {
    if (options?.preferSecondImage) {
      const secondThumb =
        $('.internal-products-thumbnails img').eq(1).attr('src') ||
        $('.internal-products-card-carousel img').eq(2).attr('src') ||
        $('.internal-products-card-carousel img').eq(1).attr('src');
      if (secondThumb) {
        imageUrl = secondThumb.startsWith('http') ? secondThumb : 'https://purina.com.br' + secondThumb;
      }
    }
    if (!imageUrl || imageUrl.includes('seo-default')) {
      const purinaHero =
        $('img[src*="_FRENTE"]').first().attr('src') ||
        $('.internal-products-card-carousel img, .product-zoom img').first().attr('src') ||
        $('.internal-products-thumbnails img').first().attr('src') ||
        $('main img[src*="/sites/default/files/"]').first().attr('src');
      if (purinaHero) {
        imageUrl = purinaHero.startsWith('http') ? purinaHero : 'https://purina.com.br' + purinaHero;
      }
    }
  }

  // 1e. Extração Pedigree (Mars Petcare)
  if (!imageUrl && /pedigree\.com\.br/i.test(sourceUrl)) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const graph = json['@graph'] || [json];
        for (const item of graph) {
          if (item['@type'] === 'Product' && Array.isArray(item.image) && item.image.length > 0) {
            const frenteImg = item.image.find((img: any) => /frente/i.test(img.url || '')) || item.image[0];
            if (frenteImg?.url) {
              imageUrl = frenteImg.url;
              return false;
            }
          }
        }
      } catch {}
    });
    if (!imageUrl) {
      const pedImg = $('img[src*="Frente"], img[src*="frente"], .productDetail img, .product-card-inner img').first().attr('src');
      if (pedImg) imageUrl = pedImg.startsWith('http') ? pedImg : 'https://www.pedigree.com.br' + pedImg;
    }
  }

  // 1f. Extração Pet Food Solution (ProHealth, Qualiday, AllCats, Special Croc)
  const isPetFoodSolution = /petfoodsolution\.com\.br/i.test(sourceUrl);
  if (!imageUrl && isPetFoodSolution) {
    const pfsImg = $('img')
      .filter((_, el) => {
        const s = $(el).attr('src') || '';
        return /full-|testeira|banner-castrados/i.test(s) && !s.includes('mobile');
      })
      .first()
      .attr('src');
    if (pfsImg) {
      imageUrl = pfsImg.startsWith('http') ? pfsImg : 'https://www.petfoodsolution.com.br/br/' + pfsImg.replace(/^\//, '');
    }
  }

  // 1g. Extração Hill's Pet Nutrition (Science Diet / Prescription Diet)
  const isHills = /hillspet\.com\.br/i.test(sourceUrl);
  if (isHills) {
    let hillsPackshot: string | null = null;

    // 1. Imagem sticky oficial do produto (packshot transparente isolado)
    const stickyImg = $('.product-sticky-image').attr('src') || $('img.product-sticky-image').attr('src');
    if (stickyImg && !/hills-logo|logo/i.test(stickyImg)) {
      hillsPackshot = stickyImg;
    }

    // 2. Imagens com "packshot" no atributo alt
    if (!hillsPackshot) {
      const packshots: string[] = [];
      $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        if (/packshot/i.test(alt) && !/hills-logo|logo|icon/i.test(alt) && !/hills-logo/i.test(src)) {
          if (!packshots.includes(src)) packshots.push(src);
        }
      });
      if (packshots.length > 0) {
        hillsPackshot = (options?.preferSecondImage && packshots.length > 1) ? packshots[1] : packshots[0];
      }
    }

    // 3. Imagens do carrossel principal (swiper desktop)
    if (!hillsPackshot) {
      const swiperImg = $('.swiper-image-desktop').first().attr('src');
      if (swiperImg && !/hills-logo|logo/i.test(swiperImg)) {
        hillsPackshot = swiperImg;
      }
    }

    // 4. Qualquer imagem PXM DAM que não seja logo/ícone
    if (!hillsPackshot) {
      $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        if ((src.includes('pxmshare') || src.includes('pim/hills')) && !/hills-logo|logo|icon/i.test(alt) && !/hills-logo/i.test(src)) {
          if (!hillsPackshot) hillsPackshot = src;
        }
      });
    }

    if (hillsPackshot) {
      imageUrl = hillsPackshot;
    }
  }

  // Normalização de URL relativa para absoluta se necessário
  if (imageUrl && !imageUrl.startsWith('http') && sourceUrl.startsWith('http')) {
    try {
      const urlObj = new URL(sourceUrl);
      imageUrl = `${urlObj.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    } catch {}
  }

  // 1b. Extração Wix Warmup Data (Quatree Pet / Granvita)
  const isQuatree = /quatreepet\.com\.br/i.test(sourceUrl);
  let quatreeLine = 'Quatree';
  if (/supreme/i.test(sourceUrl) && /sache/i.test(sourceUrl)) quatreeLine = 'Quatree Supreme Úmido';
  else if (/sache/i.test(sourceUrl)) quatreeLine = 'Quatree Supreme Úmido';
  else if (/supreme/i.test(sourceUrl)) quatreeLine = 'Quatree Supreme';
  else if (/life/i.test(sourceUrl)) quatreeLine = 'Quatree Life';
  else if (/select/i.test(sourceUrl)) quatreeLine = 'Quatree Select';
  else if (/gourmet/i.test(sourceUrl)) quatreeLine = 'Quatree Gourmet';
  else if (/nugget|snack/i.test(sourceUrl)) quatreeLine = 'Quatree Snacks';
  else if (/miaow/i.test(sourceUrl)) quatreeLine = 'Quatree Miaow';

  let quatreeCompText = '';
  let quatreeGarText = '';
  let quatreeTitleProduct = '';
  let quatreeFlavor = '';
  let quatreeWixImg = '';
  let quatreeAnimalType = '';

  const safeDecode = (str: string): string => {
    try { return decodeURIComponent(str); } catch { return str; }
  };

  if (isQuatree) {
    const warmup = $('#wix-warmup-data').text();
    const targetSlug = safeDecode(sourceUrl.split('/').pop() || '').toLowerCase();
    if (warmup) {
      try {
        const data = JSON.parse(warmup);
        const collections = data.appsWarmupData?.dataBinding?.dataStore?.recordsByCollectionId;
        for (const [colName, records] of Object.entries(collections || {})) {
          for (const [recId, rec] of Object.entries(records as any)) {
            const r = rec as any;
            const matchSlug = Object.values(r).some((v: any) => {
              if (typeof v !== 'string') return false;
              const decodedV = safeDecode(v).toLowerCase();
              return decodedV.includes(`/${targetSlug}`) || decodedV.endsWith(targetSlug);
            });
            if (matchSlug) {
              quatreeTitleProduct = r.tituloProduto || r.ttuloProduto || r.nomeProduto || r.title || r.nome || '';
              // Ignora quando o title do registro for apenas o código técnico ou slug
              if (quatreeTitleProduct.toLowerCase() === targetSlug || /^q[a-z0-9\+]+$/i.test(quatreeTitleProduct)) {
                quatreeTitleProduct = '';
              }
              quatreeFlavor = r.sabor || '';
              quatreeCompText = r.composicaoBasica || r.composioBsica || r.composio || r.composicao || '';
              quatreeGarText = r.niveisDeGarantia || r.nveisDeGarantia || r.niveisGarantia || '';
              quatreeWixImg = r.packFrente || r.packfrente || r.packf || '';
              if (Array.isArray(r.coOuGato)) quatreeAnimalType = r.coOuGato.join(' ');
              else if (typeof r.pet === 'string') quatreeAnimalType = r.pet;
              else if (Array.isArray(r.tipo)) quatreeAnimalType = r.tipo.join(' ');
              else if (typeof r.tipo === 'string') quatreeAnimalType = r.tipo;
              break;
            }
          }
          if (quatreeCompText && quatreeGarText) break;
        }
      } catch (e) {}
    }

    if (!quatreeCompText) {
      const m = html.match(/\"(?:composicaoBasica|composioBsica|composio|composicao)\":\s*\"([^\"]+)\"/i);
      if (m) {
        try { quatreeCompText = JSON.parse('"' + m[1] + '"'); } catch { quatreeCompText = m[1]; }
      }
    }
    if (!quatreeGarText) {
      const m = html.match(/\"(?:niveisDeGarantia|nveisDeGarantia|niveisGarantia)\":\s*\"([^\"]+)\"/i);
      if (m) {
        try { quatreeGarText = JSON.parse('"' + m[1] + '"'); } catch { quatreeGarText = m[1]; }
      }
    }

    // Fallback para páginas como nova-quatree-carne (DOM estático)
    if (!quatreeCompText || !quatreeGarText) {
      let currentSection = '';
      const bodyElements: string[] = [];
      $('p, span, h2, h3, h4').each((_, el) => {
        const t = $(el).clone().children().remove().end().text().trim();
        if (t) bodyElements.push(t);
      });
      for (const line of bodyElements) {
        if (/COMPOSI[ÇC][ÃA]O\s*B[ÁA]SICA/i.test(line)) {
          currentSection = 'COMP';
          continue;
        } else if (/N[ÍI]VEIS\s*DE\s*GARANTIA/i.test(line)) {
          currentSection = 'GAR';
          continue;
        } else if (/ENRIQUECIMENTO|GUIA\s*ALIMENTAR|TABELA/i.test(line)) {
          currentSection = '';
        }

        if (currentSection === 'COMP' && !quatreeCompText && line.length > 50) {
          quatreeCompText = line;
        } else if (currentSection === 'GAR' && line.length > 3) {
          quatreeGarText += (quatreeGarText ? '\n' : '') + line;
        }
      }
    }

    // Resolução da Imagem Oficial Quatree
    if (quatreeWixImg) {
      const m = quatreeWixImg.match(/wix:image:\/\/v1\/([^\/#?]+)/);
      if (m) imageUrl = `https://static.wixstatic.com/media/${m[1]}`;
    }
    if (!imageUrl || imageUrl.includes('default') || imageUrl.includes('11062b')) {
      $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        if (/PACK|PACKSHOTS|QGourmet|MIAOW/i.test(src) && !/verso|REC|TRANSI/i.test(src)) {
          imageUrl = src;
          return false;
        }
      });
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
  } else if (/biofreshpet\.com\.br/i.test(sourceUrl)) {
    let h1 = $('h1').first().text().replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim();
    if (!h1.toLowerCase().startsWith('biofresh')) {
      h1 = `Biofresh ${h1}`;
    }
    const pushRegex = /self\.__next_f\.push\(\[1,\s*\"([\s\S]*?)\"\]\)/g;
    let chunk;
    let flightText = '';
    while ((chunk = pushRegex.exec(html)) !== null) {
      try {
        flightText += JSON.parse('"' + chunk[1] + '"');
      } catch {
        flightText += chunk[1];
      }
    }
    const subMatch = flightText.match(/\"name\":\"Subt[íi]tulo\"[^\}]*?\"content\":\"([^\"]+)\"/i);
    let sub = subMatch ? subMatch[1].trim() : '';
    if (!sub) {
      const badge = $('[class*="bg-custom-pink"], [class*="bg-custom-green"]').first().text().trim();
      if (badge && badge !== 'Lançamento') sub = badge;
    }
    if (sub && !h1.toLowerCase().includes(sub.toLowerCase())) {
      rawName = `${h1} ${sub}`;
    } else {
      rawName = h1;
    }
  } else if (isQuatree) {
    let namePart = quatreeTitleProduct;
    if (!namePart) {
      if (/nugget/i.test(sourceUrl)) {
        namePart = `Nuggets Bola de Pelo`;
      } else if (/miaow/i.test(sourceUrl)) {
        namePart = `Petisco Cremoso para Gatos`;
      } else {
        const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        namePart = ogTitle
          .replace(/Nova Quatree Carne\s*\|\s*/i, 'Carne ')
          .replace(/Quatree Pet\s*\|\s*/i, '')
          .replace(/QUATREE GOURMET\s*\|\s*/i, '')
          .replace(/QUATREE SUPREME\s*\|\s*/i, '')
          .replace(/QUATREE SELECT\s*\|\s*/i, '')
          .replace(/QUATREE LIFE\s*\|\s*/i, '')
          .replace(/MIAOW\s*\|\s*Quatree Pet/i, 'Petisco Cremoso para Gatos')
          .replace(/NUGGETS/i, 'Nuggets Bola de Pelo')
          .replace(/\s*\|\s*/g, ' - ')
          .replace(/([A-ZÀ-ÿ])MIX\b/gi, '$1 MIX')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    // Se o sabor estiver colado no final do nome (ex: GATOS ADULTOSPEIXE)
    if (quatreeFlavor) {
      const flavRegex = new RegExp(`(${quatreeFlavor})$`, 'i');
      if (flavRegex.test(namePart)) {
        namePart = namePart.replace(flavRegex, ' $1');
      }
    }

    if (!namePart.toLowerCase().includes('quatree')) {
      rawName = `${quatreeLine} ${namePart}`;
    } else {
      rawName = namePart;
    }
    if (quatreeFlavor && !rawName.toLowerCase().includes(quatreeFlavor.toLowerCase()) && !/mix|carne|frango|peixe|salm[ãa]o/i.test(rawName)) {
      rawName = `${rawName} ${quatreeFlavor}`;
    }
    rawName = rawName.replace(/Quatree Miaow Miaow/gi, 'Quatree Miaow');
    rawName = rawName.replace(/,([a-zA-ZÀ-ÿ])/g, ', $1');
  } else if (isRoyalCanin) {
    let rcName = $('h1').first().text().trim();
    if (!rcName) {
      rcName = $('meta[property="og:title"]').attr('content') || $('title').text().replace(/\|\s*Royal Canin.*$/i, '').trim();
    }
    if (rcName && !rcName.toLowerCase().includes('royal canin')) {
      rcName = 'Royal Canin ' + rcName;
    }
    rawName = rcName;
  } else if (/purina\.com\.br/i.test(sourceUrl)) {
    let pName = $('h1').first().text().replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim();
    if (!pName) {
      pName = $('title').text().replace(/\|\s*Purina.*$/i, '').trim() || $('meta[property="og:title"]').attr('content') || '';
    }
    rawName = pName;
  } else if (isPetFoodSolution) {
    if (/croc-gatos-castrados/i.test(sourceUrl)) {
      rawName = 'Special Croc Gatos Castrados';
    } else {
      let t = $('title').text().replace(/\|\s*Pet\s*Food\s*Solution.*$/i, '').trim();
      t = t.replace(/\s*-\s*/g, ' ');
      t = t.replace(/\bQualyday\b/gi, 'Qualiday');
      t = t.replace(/\bFilhote\b/gi, 'Filhotes');
      t = t.replace(/\bCastrado\b/gi, 'Castrados');
      t = t.replace(/\bAdulto\b/gi, 'Adultos');
      if (/qualiday\s*prolife/i.test(t)) {
        if (!/gatos\s*adultos/i.test(t)) {
          t = t.replace(/qualiday\s*prolife/i, 'Qualiday Prolife Gatos Adultos Sabor');
        }
        if (!/pouch|úmido/i.test(t)) {
          t = `${t} Pouch`;
        }
      }
      rawName = t;
    }
  } else if (isHills) {
    let hName = $('h1').first().text().replace(/\s+/g, ' ').trim();
    if (!hName) {
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      const m1 = metaDesc.match(/cães\s+(Hill[’']?s\s+[^é\.\,]+?)(?:\s+é\s+um\s+alimento|\.|\,|$)/i);
      if (m1) {
        hName = m1[1].trim();
      } else {
        const m2 = metaDesc.match(/(Hill[’']?s\s+[^é\.\,]+?)(?:\s+é\s+uma\s+ração|\s+é\s+um\s+alimento|\.|\,|$)/i);
        if (m2) {
          hName = m2[1].trim();
        }
      }
    }
    if (!hName) {
      const slug = sourceUrl.split('/').pop() || '';
      if (slug.includes('wd-glucose-management')) {
        hName = "Hill's Prescription Diet w/d Glucose Management Cães";
      } else {
        hName = slug.replace(/-dry|-canned|-can|-stew/gi, '').replace(/\b(?:sd|pd)-/g, '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      }
    }

    const isPrescription = /prescription-diet|\/pd-/i.test(sourceUrl);
    const brandName = isPrescription ? "Hill's Prescription Diet" : "Hill's Science Diet";
    const isCanned = /-canned|-can\b|-stew/i.test(sourceUrl) || (!/-dry/i.test(sourceUrl) && /Alimento em Lata|Alimento Úmido/i.test(hName));

    let nameSuffix = hName
      .replace(/^Hill[’']?s\s+(?:Prescription|Science)\s+Diet\s+/i, '')
      .replace(/^Lata\s+/i, '')
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let finalName = `${brandName} ${nameSuffix}`;
    if (isCanned && !/lata|úmido|guisado|stew/i.test(finalName)) {
      finalName += ' Lata';
    }
    rawName = finalName
      .replace(/para Cães e Gatos/i, 'Cães e Gatos')
      .replace(/para Cães Adultos/i, 'Cães Adultos')
      .replace(/para Cães Idosos/i, 'Cães Idosos')
      .replace(/para Cães Filhotes/i, 'Cães Filhotes')
      .replace(/para Cães/i, 'Cães')
      .replace(/Cães\s+Cães/i, 'Cães')
      .replace(/\s+/g, ' ')
      .trim();
  } else {
    rawName =
      $('h1.product_title, h1.elementor-heading-title').first().text().trim() ||
      $('h1.title').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      '';
  }

  let commercialName = stripWeightFromTitle(
    capitalizeTitle(rawName.replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim())
  );

  let slug = '';
  if (sourceUrl && !/farmina\.com/i.test(sourceUrl)) {
    if (/purina\.com\.br/i.test(sourceUrl)) {
      const purinaParts = sourceUrl.replace(/\/produto\/?$/i, '').split('/').filter(Boolean);
      const relevant = purinaParts.slice(2).filter((p) => p !== 'produtos' && p !== 'produto').join('-');
      if (relevant && relevant.length > 3) {
        slug = relevant.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
    } else {
      const m =
        sourceUrl.match(/\/(?:produto|products\/[^\/]+)\/([^/]+)\/?$/i) ||
        sourceUrl.match(/\/([^/]+)\/?$/);
      if (m && m[1] && m[1] !== 'produto' && m[1] !== 'products' && m[1] !== 'index' && m[1].length > 3) {
        slug = m[1].replace(/\.php$/i, '').replace(/\.html?$/i, '');
      }
    }
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
  } else if (/purina\.com\.br/i.test(sourceUrl) || /\bpurina\b|\bpro\s*plan\b|\bdog\s*chow\b|\bcat\s*chow\b|\bfriskies\b|\bfancy\s*feast\b|\bone\b/i.test(commercialName)) {
    manufacturerLegalName = 'Nestlé Brasil Ltda';
    if (/veterinary-diet|veterinary-diets|veterin[áa]ria|vet\s*diet|clinical/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina Pro Plan Veterinary Diets';
    } else if (/liveclear/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina Pro Plan LiveClear';
    } else if (/purina-one|purina\s*one/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina ONE';
    } else if (/pro\s*plan|proplan/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina Pro Plan';
    } else if (/dog\s*chow|dogchow/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina Dog Chow';
    } else if (/cat\s*chow|catchow/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina Cat Chow';
    } else if (/friskies/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina Friskies';
    } else if (/fancy\s*feast/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Purina Fancy Feast';
    } else {
      brand = 'Purina';
    }
  } else if (/royal\s*canin/i.test(commercialName) || isRoyalCanin) {
    manufacturerLegalName = 'Royal Canin do Brasil Indústria e Comércio Ltda';
    if (/vet-products|veterin[áa]ria|vet\s*diet|coadjuvante/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Royal Canin Veterinary Diet';
    } else if (/sach[êe]|úmido|umido|gravy|jelly|pouch|lata/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Royal Canin Úmido';
    } else {
      brand = 'Royal Canin';
    }
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
    } else if (/white/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D White';
    } else if (/brown/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D Brown';
    } else if (/vet\s*life/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina Vet Life';
    } else if (/cibau/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina Cibau';
    } else if (/matisse/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina Matisse';
    } else if (/ecopet/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina Ecopet Natural';
    } else if (/n&d|n-d|natural\s*&\s*delicious/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Farmina N&D';
    } else {
      brand = 'Farmina';
    }
    manufacturerLegalName = 'Farmina Pet Foods Brasil Ltda';
  } else if (/biofresh/i.test(commercialName) || /biofreshpet\.com\.br/i.test(sourceUrl)) {
    brand = 'Biofresh';
    manufacturerLegalName = 'BRF Pet S.A.';
  } else if (isQuatree || /quatree/i.test(commercialName)) {
    manufacturerLegalName = 'Granvita Alimentos Ltda';
    if (/sache|produtos-saches/i.test(sourceUrl) || /supreme.*(?:úmido|umido|sache)/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Quatree Supreme Úmido';
    } else if (/nugget|snack/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Quatree Snacks';
    } else if (/miaow/i.test(sourceUrl + ' ' + commercialName)) {
      brand = 'Quatree Miaow';
    } else if (/supreme/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Quatree Supreme';
    } else if (/life/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Quatree Life';
    } else if (/select/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Quatree Select';
    } else if (/gourmet/i.test(commercialName + ' ' + sourceUrl)) {
      brand = 'Quatree Gourmet';
    } else {
      brand = 'Quatree';
    }
  } else if (isPetFoodSolution || /prohealth|allcats|qualiday|qualyday|special\s*croc/i.test(commercialName)) {
    manufacturerLegalName = 'Pet Food Solution Indústria e Comércio de Alimentos Ltda';
    if (/prohealth/i.test(commercialName) || /prohealth/i.test(sourceUrl)) {
      brand = 'ProHealth';
    } else if (/qualiday\s*prolife|prolife/i.test(commercialName) || /qualidayprolife|prolife/i.test(sourceUrl)) {
      brand = 'Qualiday Prolife';
    } else if (/qual[iy]day/i.test(commercialName) || /qual[iy]day/i.test(sourceUrl)) {
      brand = 'Qualiday';
    } else if (/allcats|allgats/i.test(commercialName) || /allcats|allgats/i.test(sourceUrl)) {
      brand = 'AllCats';
    } else if (/croc/i.test(commercialName) || /croc/i.test(sourceUrl)) {
      brand = 'Special Croc';
    } else {
      brand = 'Pet Food Solution';
    }
  } else if (isHills || /hillspet\.com\.br/i.test(sourceUrl)) {
    const isPrescription = /prescription-diet|\/pd-/i.test(sourceUrl + ' ' + commercialName);
    brand = isPrescription ? "Hill's Prescription Diet" : "Hill's Science Diet";
    manufacturerLegalName = "Hill's Pet Nutrition / Colgate-Palmolive";
  }

  // Se não foi identificado pelo nome nem URL, mas o breadcrumb indicar PremieR
  if (
    !commercialName.startsWith('PremieR') &&
    !commercialName.startsWith('GoldeN') &&
    !commercialName.startsWith('Golden') &&
    !commercialName.startsWith('Vitta') &&
    !commercialName.startsWith("Hill's") &&
    !/f[óo]rmula\s*natural|adimax|origens|magnus|qualidy|whiskas|pedigree|royal|purina|biofresh|guabi|special|bionatural|farmina|n&d|cibau|matisse|ecopet|quatree|prohealth|allcats|qualiday|qualyday|croc|hill/i.test(commercialName) &&
    !/specialcat|specialdog|adimax\.com\.br|farmina\.com|quatreepet\.com\.br|royalcanin\.com|purina\.com\.br|petfoodsolution\.com\.br|hillspet\.com\.br/i.test(sourceUrl)
  ) {
    commercialName = 'PremieR ' + commercialName;
  }
  commercialName = commercialName.replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim();

  // 4. Espécie, Fase de Vida, Porte, Formato
  const isDual = /c[ãa]es\s*e\s*gatos/i.test(commercialName) || /c[ãa]es\s*e\s*gatos/i.test(sourceUrl);
  const isGato = /gato|gatos|felin|catchow|cat-chow|fancy-feast|friskies|miaow|nugget|\/cats\//i.test(commercialName + ' ' + sourceUrl + ' ' + quatreeAnimalType);
  const isCao = !isGato && (/c[ãa]o|c[ãa]es|cachorro|dogchow|dog-chow|\/dogs\//i.test(commercialName) || /c[ãa]o|c[ãa]es|cachorro|dogchow|dog-chow|\/dogs\//i.test(sourceUrl) || (!isRoyalCanin && /canin/i.test(commercialName + ' ' + sourceUrl)));

  let species: 'GATO' | 'CAO' | 'CAO_E_GATO' = 'CAO';
  if (isDual) species = 'CAO_E_GATO';
  else if (isGato) species = 'GATO';
  else if (isCao) species = 'CAO';

  let lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR' = 'ADULTO';
  if (/filhote|junior|j[úu]nior|puppy|kitten|crescimento/i.test(commercialName + ' ' + sourceUrl)) lifeStage = 'CRESCIMENTO_INICIAL';
  else if (/7 a 11 anos|acima de 12 anos|senior|sênior|7\s*\+|10\s*\+/i.test(commercialName) || /10\+|senior-7/i.test(sourceUrl)) lifeStage = 'SENIOR';

  let breedSize: 'TODOS' | 'MINI_PEQUENO' | 'MEDIO_GRANDE' = 'TODOS';
  if (/porte\s*pequeno|pequeno\s*porte|mini|ra[çc]as?\s*pequenas?|small\s*bites/i.test(commercialName + ' ' + sourceUrl)) {
    breedSize = 'MINI_PEQUENO';
  } else if (/porte\s*grande|grande\s*porte|m[ée]dio|medium|maxi|giant|ra[çc]as?\s*(?:m[ée]dias|grandes|gigantes)/i.test(commercialName + ' ' + sourceUrl)) {
    breedSize = 'MEDIO_GRANDE';
  }

  let foodType: 'SECO' | 'UMIDO' =
    /úmido|umido|gourmet|sach[êe]|pat[êe]|lata|creminho|linha-umida/i.test(commercialName + ' ' + sourceUrl) ? 'UMIDO' : 'SECO';
  if (isQuatree && /miaow/i.test(commercialName + ' ' + sourceUrl)) {
    foodType = 'UMIDO';
  } else if (isQuatree && !/sache|úmido|umido/i.test(commercialName + ' ' + sourceUrl)) {
    foodType = 'SECO';
  }

  // 4.1 Categoria Legal e Condição Coadjuvante
  let legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR' = 'ALIMENTO_COMPLETO';
  let coadjuvanteCondition: string | null = null;

  if (/nutri[çc][ãa]o cl[íi]nica|vet\s*care|vet\s*life|veterinary-diet|prescription-diet|\/pd-|coadjuvante/i.test(commercialName + ' ' + sourceUrl)) {
    legalCategory = 'ALIMENTO_COADJUVANTE';
    const t = (commercialName + ' ' + sourceUrl).toLowerCase();
    if (/renal|\bre\b|\bk-?d\b|kidney/i.test(t)) coadjuvanteCondition = 'RENAL';
    else if (/urin[áa]ri|struvite|ossalati|\bst\b|\bc-?d\b|\bu-?d\b/i.test(t)) coadjuvanteCondition = 'URINARIO';
    else if (/recupera|convalescence|\ba-?d\b|urgent/i.test(t)) coadjuvanteCondition = 'RECUPERACAO';
    else if (/obesidade|obesity|overweight|perda de peso|controle de peso|\bod\b|\br-?d\b|\bw-?d\b|metabolic|glucose/i.test(t)) coadjuvanteCondition = 'OBESIDADE';
    else if (/diabet/i.test(t)) coadjuvanteCondition = 'DIABETES';
    else if (/gastro|gastrointestinal|\bgi\b|\bi-?d\b|biome/i.test(t)) coadjuvanteCondition = 'GASTROINTESTINAL';
    else if (/hipoalerg|hypoallergenic|hydroli|ultrahypo|pele sens[íi]vel|fish & potato|pork & potato|\bz-?d\b|\bd-?d\b|derm/i.test(t)) coadjuvanteCondition = 'HIPOALERGENICO';
    else if (/hep[áa]t|hepatic|\bl-?d\b/i.test(t)) coadjuvanteCondition = 'HEPATICO';
    else if (/card[ií]ac/i.test(t)) coadjuvanteCondition = 'CARDIACO';
    else if (/articular|joint|\bjt\b|\bj-?d\b/i.test(t)) coadjuvanteCondition = 'ARTICULAR';
    else if (/onc|on-care/i.test(t)) coadjuvanteCondition = 'OUTRO';
    else coadjuvanteCondition = 'OUTRO';
  } else if (
    /(?:cookie|biscoito|biscoitos|snack|petisco|petiscos|party\s*mix|party-mix|bifinho|bifinhos|creminho|dental|mastig[áa]vel|\bosso\b|\bossos\b|casco|orelha|traqueia|chifre|(?<!small[_\s-]|mini[_\s-]|medium[_\s-]|maxi[_\s-]|large[_\s-])\bbites\b|nugget|miaow|dentastix|biscrok|filezitos|marrobone)/i.test(commercialName + ' ' + sourceUrl) ||
    /n&d-natural/i.test(sourceUrl) ||
    /premier.*gourmet/i.test(commercialName) ||
    (/gourmet/i.test(commercialName) && !/golden.*gourmet.*gato|quatree|purina|proplan|fancy\s*feast/i.test(commercialName + ' ' + sourceUrl))
  ) {
    legalCategory = 'ALIMENTO_COMPLEMENTAR';
  }

  // 5. Extração de Composição e Garantias a partir do DOM
  let compText = isQuatree ? quatreeCompText : '';
  let garText = isQuatree ? quatreeGarText : '';

  // 5a-0. Extração de Next.js Flight Payload (Biofresh / BRF Pet)
  if (/biofreshpet\.com\.br/i.test(sourceUrl) || html.includes('categoria-composicao-basica')) {
    const pushRegex = /self\.__next_f\.push\(\[1,\s*\"([\s\S]*?)\"\]\)/g;
    let chunk;
    let flightText = '';
    while ((chunk = pushRegex.exec(html)) !== null) {
      try {
        flightText += JSON.parse('"' + chunk[1] + '"');
      } catch {
        flightText += chunk[1];
      }
    }

    if (!compText) {
      const compDefMatch = flightText.match(/\"name\":\"Composi[çc][ãa]o B[áa]sica\"[^\}]*?\"content\":\"\$([a-zA-Z0-9]+)\"/i);
      if (compDefMatch) {
        const compId = compDefMatch[1];
        const compContentMatch = flightText.match(new RegExp(`(?:^|\\n)${compId}:(?:T[0-9a-f]+,)?([\\s\\S]*?)(?:\\n[0-9a-f]+:|$)`));
        if (compContentMatch) {
          compText = compContentMatch[1].trim();
        }
      }
      if (!compText) {
        const compRaw = flightText.match(/categoria-composicao-basica[\s\S]*?(Seleção de carnes frescas|Farinha de vísceras[^\"]+)/i);
        if (compRaw) compText = compRaw[1].trim();
      }
    }

    if (!garText) {
      const garDefMatch = flightText.match(/\"name\":\"N[íi]veis de garantia\"[^\}]*?\"content\":\"\$([a-zA-Z0-9]+)\"/i);
      if (garDefMatch) {
        const garId = garDefMatch[1];
        const garContentMatch = flightText.match(new RegExp(`(?:^|\\n)${garId}:(?:T[0-9a-f]+,)?([\\s\\S]*?)(?:\\n[0-9a-f]+:|$)`));
        if (garContentMatch) {
          garText = garContentMatch[1].trim();
        }
      }
      if (!garText) {
        const garRaw = flightText.match(/(?:<div>\s*<h2>Umidade[\s\S]*?Energia Metaboliz[áa]vel[\s\S]*?<\/div>)/i);
        if (garRaw) garText = garRaw[0].trim();
      }
    }
  }

  // 5a-0b. Extração Royal Canin Brasil
  if (isRoyalCanin) {
    $('[class*="ProductNutritionalInfo_nutritional-item-wrapper"]').each((_, el) => {
      const subtitle = $(el).find('[class*="nutritional-item-subtitle"]').text().trim().toUpperCase();
      const content = $(el).find('[data-testid="product-nutrition-content"]').text().trim();
      if ((subtitle.includes('COMPOSIÇÃO') || subtitle.includes('INGREDIENTES')) && !compText) {
        compText = content;
      } else if ((subtitle.includes('GARANTIDA') || subtitle.includes('ANÁLISE')) && !garText) {
        garText = content;
      } else if (subtitle.includes('ENERGIA')) {
        if (garText) garText += ' ' + content;
        else garText = content;
      }
    });
  }

  // 5a-0c. Accordions da Purina Pro Plan (.accordion-item)
  if (/purina\.com\.br/i.test(sourceUrl)) {
    $('.accordion-item').each((_, el) => {
      const headerText = $(el).find('.accordion-header, button').text().trim().toLowerCase();
      const bodyEl = $(el).find('.accordion-body, .accordion-collapse');
      const bodyText = extractStructuredText(bodyEl, $);
      if ((headerText.includes('composição') || headerText.includes('ingredientes')) && !compText) {
        const ingIdx = bodyText.indexOf('Lista de Ingredientes');
        if (ingIdx !== -1) {
          compText = bodyText.substring(ingIdx + 'Lista de Ingredientes'.length).trim();
        } else {
          compText = bodyText;
        }
      } else if ((headerText.includes('garantia') || headerText.includes('nutricional')) && !garText) {
        garText = bodyText;
      }
    });
  }

  // 5a-0d. Extração Hill's Pet Nutrition (Accordions AEM e Tabela de Matéria Seca)
  if (isHills) {
    $('.cmp-accordion__button').each((_, btn) => {
      const title = $(btn).find('.cmp-accordion__title').text().trim() || $(btn).text().trim();
      if (/ingrediente/i.test(title)) {
        const panel = $(btn).closest('.cmp-accordion__item').find('.cmp-accordion__panel');
        const txt = panel.text().replace(/\s+/g, ' ').trim();
        if (txt && !compText) compText = txt;
      }
    });

    if (!compText) {
      $('.text-segments, .textTool').each((_, el) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        if (/Quirera|Farinha de|Grão de|Carne de|Frango/i.test(t) && t.length > 50 && t.length < 2500) {
          if (!compText && t.includes(',')) compText = t;
        }
      });
    }

    $('table').each((_, tbl) => {
      const text = $(tbl).text();
      if (/Matéria Seca|Nutriente/i.test(text)) {
        const rows: string[] = [];
        $(tbl).find('tr').each((__, tr) => {
          const cells = $(tr).find('td,th').map((___, td) => $(td).text().trim().replace(/\s+/g, ' ')).get();
          if (cells.length >= 2) {
            rows.push(cells.join(' : '));
          }
        });
        if (rows.length > 0 && !garText) {
          garText = rows.join('\n');
        }
      }
    });
  }

  // 5a. JetTabs / Accordions (Adimax / Elementor)
  $('.jet-toggle, .elementor-accordion-item').each((i, el) => {
    const title = $(el).find('.jet-toggle__label-text, .elementor-tab-title').text().trim();
    const contentEl = $(el).find('.jet-toggle__content, .elementor-tab-content');
    const content = extractStructuredText(contentEl, $);
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
          const paragraphs = body.find('p').map((_, el) => $(el).text().trim()).get().filter(Boolean);
          if (paragraphs.length > 0) {
            compText = paragraphs.join(' ');
          } else {
            const p = body.text().trim();
            if (p) compText = p;
          }
        }
        if (!garText) {
          const tableText = extractStructuredText(body, $);
          if (tableText) garText = tableText;
        }
      }
      if (/garantia/i.test(title) && !garText) {
        garText = extractStructuredText(body, $);
      }
    });
  }

  // 5c. Elementor Off-Canvas / Abas Modernas (PremieRpet)
  if (!compText) {
    const elComp = $('[class*="e-off-canvas"][aria-label*="Composi"], div[aria-label*="Composi"]');
    if (elComp.length > 0) compText = extractStructuredText(elComp, $);
  }
  if (!garText) {
    const elGar = $('[class*="e-off-canvas"][aria-label*="Garantia"], div[aria-label*="Garantia"]');
    if (elGar.length > 0) garText = extractStructuredText(elGar, $);
  }

  // 5d. Abas WooCommerce (PremieR Pet, etc.)
  if (!compText) {
    const elComp = $('#tab-composicao, #tab-composicao_basica, .woocommerce-Tabs-panel--composicao, div[id*="composic"]');
    if (elComp.length > 0) compText = extractStructuredText(elComp, $);
  }
  if (!garText) {
    const elGar = $('#tab-niveis_garantia, #tab-garantias, .woocommerce-Tabs-panel--niveis_garantia, div[id*="garanti"]');
    if (elGar.length > 0) garText = extractStructuredText(elGar, $);
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

  // 5d-2. Pedigree / Mars Petcare
  if (!compText && /pedigree\.com\.br/i.test(sourceUrl)) {
    const pedComp = $('li.ingredients .text p, .ingredients .text, .pdp_accordion_detail_block200-ingredients .text').first().text().trim();
    if (pedComp) compText = pedComp;
  }
  if (!garText && /pedigree\.com\.br/i.test(sourceUrl)) {
    const pedGarRows: string[] = [];
    $('li.nutritional-info table tr, .nutritional-info table tr').each((_, tr) => {
      const row = $(tr).find('th, td').map((_, cell) => $(cell).text().trim()).get().join(' : ');
      if (row && row.length > 2 && !row.startsWith('Porte') && !row.startsWith('Quantidade')) {
        pedGarRows.push(row);
      }
    });
    if (pedGarRows.length > 0) {
      garText = pedGarRows.join('\n');
    } else {
      const pedGar = $('li.nutritional-info table, li.nutritional-info .text, .nutritional-info table').first().text().trim();
      if (pedGar) garText = pedGar;
    }
  }

  // 5e. Special Cat / Special Dog / Special Croc (Manfrim)
  if (!compText) {
    const specialComp = $('#descricao-composicao').text().trim();
    if (specialComp) {
      compText = specialComp;
    } else {
      $('p, div, h2, h3, h4').each((_, el) => {
        const t = $(el).text().trim();
        if (/^Composi[çc][ãa]o\s+(?:qualitativa|b[áa]sica)[:\s]*$/i.test(t)) {
          const nextP = $(el).nextAll('p, div').first().text().trim();
          if (nextP && !compText) compText = nextP;
        }
      });
    }
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

  // 5f-2. Pet Food Solution (Composição básica/qualitativa e Níveis de garantia)
  if (isPetFoodSolution) {
    if (!compText) {
      const body = $('body').text();
      const m = body.match(/Composi[çc][ãa]o\s+(?:b[áa]sica|qualitativa)[^:]*:\s*([\s\S]{30,3500}?)(?:Enriquecimento|N[íi]veis|Modo|$)/i);
      if (m) compText = m[1].trim();
    }
    if (!garText) {
      const body = $('body').text();
      const m = body.match(/N[íi]veis\s+de\s+garantia[\s\S]{30,3000}?(?:Modo\s+de\s+Uso|Guia|Enriquecimento|$)/i);
      if (m) garText = m[0].trim();
    }
  }

  // 5g. Fallback de tabelas HTML
  if (!garText) {
    const tableRows: string[] = [];
    $('table tr').each((_, tr) => {
      const row = $(tr).find('th, td').map((_, cell) => $(cell).text().trim()).get().join(' : ');
      if (row && row.length > 2 && !row.startsWith('Porte') && !row.startsWith('Quantidade')) {
        tableRows.push(row);
      }
    });
    if (tableRows.length > 0) {
      garText = tableRows.join('\n');
    } else {
      const tableText = $('table').first().text().trim();
      if (tableText) garText = tableText;
    }
  }

  // 5g. Fallback de texto corrido
  const bodyText = extractStructuredBodyText($);
  if (!compText) {
    const m =
      bodyText.match(/composi[çc][ãa]o\s*(?:b[áa]sica|qualitativa)?[^\n]*\n([\s\S]{50,4000}?)(?:N[íi]veis\s+de\s+garantia|An[áa]lise\s+garantida|Enriquecimento|$)/i) ||
      bodyText.match(/Ingredientes\s*[:\n]\s*([\s\S]{50,4000}?)(?:An[áa]lise\s+garantida|N[íi]veis\s+de\s+garantia|Guia\s+alimentar|$)/i);
    if (m) compText = m[1].trim();
  }

  // Fallback curado para páginas onde o fabricante omitiu a composição no HTML
  if ((!compText || compText.length < 15) && sourceUrl) {
    for (const [key, val] of Object.entries(CURATED_INGREDIENTS_FALLBACKS)) {
      if (sourceUrl.includes(key)) {
        compText = val;
        break;
      }
    }
  }

  if (!garText) {
    const m = bodyText.match(/(?:N[íi]veis\s+de\s+garantia|An[áa]lise\s+garantida)[\s\S]{50,4000}?(?:Enriquecimento|Tabela\s+de\s+consumo|Guia\s+alimentar|$)/i);
    if (m) garText = m ? m[0] : bodyText;
  }

  // 6. Níveis de Garantia
  // Remove tags HTML de garText e compText preservando quebras de linha em garText
  garText = garText.replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ');
  compText = compText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const parseValFromText = (text: string, pattern: RegExp): number | null => {
    const m = text.match(pattern);
    if (!m) return null;
    const rawVal = m[1];
    const val = parseNutritionNumber(rawVal);
    let capturedUnit = m[2];
    const matchEnd = (m.index ?? 0) + m[0].length;
    const afterSnippet = text.slice(matchEnd, matchEnd + 25);

    if (!capturedUnit) {
      const unitMatch = afterSnippet.match(/^\s*(?::\s*)?(%|g\/kg|mg\/kg|\bg\b)/i);
      if (unitMatch) {
        capturedUnit = unitMatch[1];
      }
    }

    const unit = (capturedUnit || '%').toLowerCase();

    // Se a unidade capturada não for % e houver percentual explícito logo após (ex: "90 g/kg (9%)" ou "20 g/kg : 2,00%")
    if (unit !== '%') {
      const parenPctMatch = afterSnippet.match(/^\s*(?::|\()?\s*(\d+(?:[\.,]\d+)?)\s*%\s*\)?/);
      if (parenPctMatch) {
        return parseNutritionNumber(parenPctMatch[1]);
      }
    }

    if (unit.includes('mg') || (!capturedUnit && val >= 50)) return Number((val / 10000).toFixed(4));
    if (unit.includes('g/kg') || unit === 'g' || (!capturedUnit && val > 5.0 && val < 50)) return Number((val / 10).toFixed(2));
    return val;
  };

  const parseGuarantee = (pattern: RegExp): number => {
    const m = garText.match(pattern);
    if (!m) return 0;
    return parseValFromText(garText.slice(m.index ?? 0), pattern) || 0;
  };

  const umidadeMaxPct = isHills
    ? 0
    : parseGuarantee(/Umidade[^\d]*?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
      (foodType === 'UMIDO' ? 86.0 : 10.0);
  if (umidadeMaxPct > 50) foodType = 'UMIDO';

  const proteinaBrutaMinPct =
    parseGuarantee(/Prote[íi]na(?:\s+(?:Bruta|Cruda))?t?[^\d]*?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const extratoEtereoMinPct =
    parseGuarantee(/(?:Extrato\s+Et[ée]reot?|Gordura\s*(?:Bruta|Total)?)[^\d]*?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const materiaMineralMaxPct =
    parseGuarantee(/(?:Mat[ée]ria\s+Mineralt?|Cinzas?)[^\d]*?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 2.5 : 8.0);

  const materiaFibrosaMaxPct =
    parseGuarantee(/(?:Mat[ée]ria|Fibra)\s*(?:Fibrosa|Bruta)[^\d]*?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 1.5 : 3.5);

  // Extração determinística de Cálcio Mín. e Máx.
  const { min: calcioMinPct, max: calcioMaxPct } = extractCalciumPrecise(garText, foodType);

  const fosforoMinPct =
    parseGuarantee(/F[óo]sforo[^\d]*?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.15 : 0.7);

  let sodioMinPct: number | null = null;
  const sodioLineMatch = garText.match(/(?:^|[\n\r]|;)\s*([^\n\r;]*\b(?<!de\s+)s[óo]dio\b[^\n\r;]*)/i);
  if (sodioLineMatch && !/sel[êe]nio\s+de\s+s[óo]dio|cloreto\s+de\s+s[óo]dio|iodato/i.test(sodioLineMatch[1])) {
    const sLine = sodioLineMatch[1];
    sodioMinPct = parseValFromText(sLine, /(?:(?:m[íi]n\.?|m[íi]nimo)[^\d]*)?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);
  }
  if (sodioMinPct === null) {
    const sMatch = garText.match(/(?:^|[\n\r])\s*S[óo]dio(?!\s*de)\b[^\d]{0,45}(?:(?:m[íi]n\.?|m[íi]nimo)[^\d]{0,20})?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);
    if (sMatch) {
      sodioMinPct = parseValFromText(sMatch[0], /(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);
    }
  }
  if (sodioMinPct !== null && (sodioMinPct > 3.0 || sodioMinPct <= 0)) {
    sodioMinPct = null;
  }

  const omega3MinPct =
    parseGuarantee(/[ÔO]mega\s*3[^\d]*?(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) || null;


  // Energia Metabolizável
  let energiaMetabolizavelKcalKg: number | null = null;
  const emMatch =
    garText.match(/(\d{3,4}(?:[\.,]\d+)?|\d{1,2}(?:[\.,]\d{3}))\s*kcal\/kg/i) ||
    bodyText.match(/(\d{3,4}(?:[\.,]\d+)?|\d{1,2}(?:[\.,]\d{3}))\s*kcal\/kg/i) ||
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
    .replace(/^Composição\s*(?:básica|qualitativa)?[:\s]*/i, '')
    .replace(/-- \d+ of \d+ --/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  cleanComp = cleanComp.split(/Eventuais\s+substitut(?:os|ivos)[:\s]/i)[0];
  cleanComp = cleanComp.split(/Cont[ée]m,?\s+(?:na\s+composi[çc][ãa]o,?\s+)?alimento\s+geneticamente\s+modificado[:\s]/i)[0];
  cleanComp = cleanComp.split(/Esp[ée]cies\s+(?:doadoras|modificadoras)(?:\s+d[eo]\s+genes?)?[:\s]/i)[0];
  cleanComp = cleanComp.split(/\*Cont[ée]m/i)[0];
  cleanComp = cleanComp.split(/\*Ingredientes/i)[0];

  // Remove qualquer payload/código residual do Next.js Flight no final do texto
  cleanComp = cleanComp.replace(/\.?[0-9a-f]+:\{[\s\S]*$/i, '.');
  cleanComp = cleanComp.replace(/\{"name"[\s\S]*$/i, '');
  cleanComp = cleanComp.replace(/\"id\":[\s\S]*$/i, '');

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
      let item = cur.trim();
      item = item.replace(/\.?[0-9a-f]+:\{[\s\S]*$/i, '');
      item = item.replace(/\{"name"[\s\S]*$/i, '');
      item = item.replace(/\"id\":[\s\S]*$/i, '');
      item = item.replace(/\.$/, '').trim();
      if (item && item.length > 1) {
        const cleaned = stripFootnotesFromIngredient(item);
        if (cleaned) topIngredientsList.push(normalizeIngredient(cleaned));
      }
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) {
    let item = cur.trim();
    item = item.replace(/\.?[0-9a-f]+:\{[\s\S]*$/i, '');
    item = item.replace(/\{"name"[\s\S]*$/i, '');
    item = item.replace(/\"id\":[\s\S]*$/i, '');
    item = item.replace(/\.$/, '').trim();
    if (item && item.length > 1) {
      const cleaned = stripFootnotesFromIngredient(item);
      if (cleaned) topIngredientsList.push(normalizeIngredient(cleaned));
    }
  }

  // 8. Transgênicos e Antioxidantes
  const fullContextText = compText + ' ' + bodyText;

  const hasExplicitDoadoras = /Esp[ée]cies\s+(?:doadoras|modificadoras)/i.test(fullContextText);
  const hasExplicitGmo = /\*Cont[ée]m.*transg|transg[êe]nico|alimento\s+geneticamente\s+modificado/i.test(compText);
  const hasAsteriskGmo =
    /(?:milho|soja|algod[ãa]o|canola|trigo)(?:[^\n,;]*?)\*+/i.test(compText) ||
    (/\*+/.test(compText) && /(?:milho|soja|gl[úu]ten\s+de\s+milho|farelo\s+proteico\s+de\s+milho)/i.test(compText));
  const hasNumberGmo =
    /(?:milho|soja|algod[ãa]o|canola|trigo)\w*[0-9¹²³⁴⁵⁶⁷⁸⁹]/i.test(compText) ||
    /(?:milho|soja|algod[ãa]o|canola|trigo)\s*[0-9¹²³⁴⁵⁶⁷⁸⁹]/i.test(compText);

  const isFreeOfGmo =
    !hasExplicitDoadoras &&
    !hasNumberGmo &&
    /n[ãa]o\s+transg[êe]nico|sem\s+transg[êe]nico|livre\s+de\s+(?:ingredientes\s+)?geneticamente\s+modificados?|100%\s+livre\s+de\s+transg[êe]nicos?/i.test(
      compText + ' ' + bodyText.slice(0, 1500)
    );

  const isHillsGmo =
    isHills &&
    !isFreeOfGmo &&
    /(?:milho|soja|farelo\s+proteico\s+de\s+milho|gl[úu]ten\s+de\s+milho|farelo\s+de\s+soja|[óo]leo\s+de\s+soja)/i.test(compText);

  const containsGmo = (hasExplicitDoadoras || hasExplicitGmo || hasAsteriskGmo || hasNumberGmo || isHillsGmo) && !isFreeOfGmo;

  let gmoIngredients: string | null = null;
  if (containsGmo) {
    const speciesSourceText = /Esp[ée]cies\s+(?:doadoras|modificadoras)/i.test(compText) ? compText : fullContextText;
    const doadorasMatch =
      speciesSourceText.match(/Esp[ée]cies\s+(?:doadoras|modificadoras)(?:\s+d[eo]\s+genes?)?[:\s]*([\s\S]+?)(?=(?:\n\s*\n|\n[A-Z][a-z]+:|\nN[íi]veis|Modo|Guia|Composi[çc][ãa]o|$))/i) ||
      speciesSourceText.match(/Esp[ée]cies\s+(?:doadoras|modificadoras)[:\s]*([^.<]+)/i);

    const gmoMatch =
      compText.match(/(?:alimento\s+geneticamente\s+modificado|\*Cont[ée]m)\s*[:\s]*([^.]+)/i);

    // Identifica quais grãos são transgênicos
    const hasAnyGrainFootnote =
      /(?:milho|soja|algod[ãa]o|canola|trigo)(?:[^\n,;]*?)\*+|(?:milho|soja|algod[ãa]o|canola|trigo)\w*[0-9¹²³⁴⁵⁶⁷⁸⁹]|(?:milho|soja|algod[ãa]o|canola|trigo)\s*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\*+/i.test(compText);

    const detectedGrains: string[] = [];
    if (
      /milho|farelo\s+proteico\s+de\s+milho|gl[úu]ten\s+de\s+milho/i.test(compText) &&
      (!hasAnyGrainFootnote || isHills ||
        /milho(?:[^\n,;]*?)\*+|milho\w*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\bmilho\s*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\*+/i.test(compText))
    ) {
      detectedGrains.push('Milho');
    }
    if (
      /soja/i.test(compText) &&
      (!hasAnyGrainFootnote || isHills ||
        /soja(?:[^\n,;]*?)\*+|soja\w*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\bsoja\s*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\*+/i.test(compText))
    ) {
      detectedGrains.push('Soja');
    }
    if (/trigo/i.test(compText) && (!hasAnyGrainFootnote || /trigo\s*\*+|trigo\w*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\btrigo\s*[0-9¹²³⁴⁵⁶⁷⁸⁹]/i.test(compText))) {
      detectedGrains.push('Trigo');
    }
    if (/algod[ãa]o/i.test(compText) && (!hasAnyGrainFootnote || /algod[ãa]o\s*\*+|algod[ãa]o\w*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\balgod[ãa]o\s*[0-9¹²³⁴⁵⁶⁷⁸⁹]/i.test(compText))) {
      detectedGrains.push('Algodão');
    }
    if (/canola/i.test(compText) && (!hasAnyGrainFootnote || /canola\s*\*+|canola\w*[0-9¹²³⁴⁵⁶⁷⁸⁹]|\bcanola\s*[0-9¹²³⁴⁵⁶⁷⁸⁹]/i.test(compText))) {
      detectedGrains.push('Canola');
    }

    const grainsLabel = detectedGrains.length > 0 ? detectedGrains.join(' e ') : 'Derivados de grãos';

    if (doadorasMatch) {
      let cleanDoadoras = doadorasMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/^[,\s]*/, '')
        .replace(/([¹²³⁴⁵⁶⁷⁸⁹0-9]+)\s*,\s*([¹²³⁴⁵⁶⁷⁸⁹0-9]+)/g, '')
        .replace(/[*†‡¹²³⁴⁵⁶⁷⁸⁹0-9]+/g, '')
        .replace(/\s*,\s*/g, ', ')
        .replace(/(?:,\s*)+/g, ', ')
        .replace(/^,\s*|,\s*$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const termoEspecies = /modificadoras/i.test(doadorasMatch[0]) ? 'espécies modificadoras de genes' : 'espécies doadoras de gene';
      gmoIngredients = `${grainsLabel} transgênicos (${termoEspecies}: ${cleanDoadoras})`;
    } else if (gmoMatch) {
      gmoIngredients = gmoMatch[1]
        .replace(/^[,\s]*(?:na\s+composi[çc][ãa]o,?\s*)?(?:alimento\s+geneticamente\s+modificado\s*[:\s]*)?/i, '')
        .trim();
    } else if (detectedGrains.length > 0) {
      gmoIngredients = `${detectedGrains.join(' e ')} geneticamente modificados`;
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
