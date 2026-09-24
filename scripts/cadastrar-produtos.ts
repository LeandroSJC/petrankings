import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';
const { PDFParse } = require('pdf-parse');

interface ProductMetadata {
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

  // Garantias Oficiais
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

  // Ingredientes & Rotulagem
  topIngredientsList: string[];
  containsGmo: boolean;
  gmoIngredients: string | null;
  antioxidantType: 'NATURAL' | 'SINTETICO' | 'MISTO';
}

/**
 * Extrator automático e determinístico de dados de rotulagem a partir do PDF oficial do fabricante
 */
async function parseProductFromPdf(baseName: string, pdfBuf: Buffer): Promise<ProductMetadata> {
  const parser = new PDFParse({ data: pdfBuf });
  const parsed = await parser.getText();
  const text: string = parsed.text;

  // 1. URL Oficial no rodapé
  const urlMatch =
    text.match(/https:\/\/(?:www\.)?adimax\.com\.br\/produto\/[^\s\t\n\/]+\/?/i) ||
    text.match(/https:\/\/(?:www\.)?(?:premierpet\.com\.br\/produto\/|whiskas\.com\.br\/products\/[^\s\t\n\/]+\/)[^\s\t\n]+/i) ||
    text.match(/https:\/\/[^\s\t\n]+/i);
  let sourceUrl = urlMatch ? urlMatch[0].trim() : '';
  if (!sourceUrl) {
    if (/wild/i.test(baseName)) {
      sourceUrl = 'https://premierpet.com.br/produto/nattu-wild-gatos-adultos-castrados-abobora-e-espinafre/';
    }
  }

  // 2. Slug
  let slug = '';
  if (/recupera/i.test(baseName) && /c[ãa]es\s*e\s*gatos/i.test(baseName)) {
    slug = 'formula-natural-vet-care-recuperacao-caes-e-gatos';
  } else if (sourceUrl) {
    const m = sourceUrl.match(/\/(?:produto|products\/[^\/]+)\/([^/]+)\/?/i);
    if (m) slug = m[1];
  }
  if (!slug) {
    slug = baseName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // 3. Título e Nome Comercial
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const breadcrumb = lines.find((l: string) => l.startsWith('Início » Linha »')) || lines.find((l: string) => l.startsWith('Início /')) || '';
  let commercialName = breadcrumb
    .replace(/^Início\s*(?:»\s*Linha\s*»|\/)\s*/, '')
    .replace(/®/g, '')
    .trim();
  if (!commercialName || commercialName.length < 5) {
    commercialName = baseName;
  }
  if (
    !commercialName.startsWith('PremieR') &&
    !commercialName.startsWith('GoldeN') &&
    !commercialName.startsWith('Golden') &&
    !commercialName.startsWith('Vitta') &&
    !/f[óo]rmula\s*natural|adimax|whiskas|pedigree|royal|purina|biofresh|guabi/i.test(commercialName) &&
    !/f[óo]rmula\s*natural|adimax|whiskas|pedigree|royal|purina|biofresh|guabi/i.test(baseName)
  ) {
    commercialName = 'PremieR ' + commercialName;
  }

  // 4. Marca e Fabricante
  let brand = 'PremieR';
  let manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';

  if (/f[óo]rmula\s*natural/i.test(commercialName) || /f[óo]rmula\s*natural/i.test(baseName)) {
    if (/vet\s*care/i.test(commercialName) || /vet\s*care/i.test(baseName)) {
      brand = 'Fórmula Natural Vet Care';
    } else if (/fresh\s*meat/i.test(commercialName) || /fresh\s*meat/i.test(baseName)) {
      brand = 'Fórmula Natural Fresh Meat';
    } else if (/receitas\s*caseiras/i.test(commercialName) || /receitas\s*caseiras/i.test(baseName)) {
      brand = 'Fórmula Natural Receitas Caseiras';
    } else if (/life/i.test(commercialName) || /life/i.test(baseName)) {
      brand = 'Fórmula Natural Life';
    } else if (/gourmet/i.test(commercialName) || /gourmet/i.test(baseName)) {
      brand = 'Fórmula Natural Gourmet';
    } else {
      brand = 'Fórmula Natural';
    }
    manufacturerLegalName = 'Adimax Indústria e Comércio de Alimentos Ltda';
  } else if (/whiskas/i.test(commercialName) || /whiskas/i.test(baseName)) {
    brand = 'Whiskas';
    manufacturerLegalName = 'Mars Brasil Alimentos Ltda';
  } else if (/pedigree/i.test(commercialName) || /pedigree/i.test(baseName)) {
    brand = 'Pedigree';
    manufacturerLegalName = 'Mars Brasil Alimentos Ltda';
  } else if (/royal\s*canin/i.test(commercialName) || /royal\s*canin/i.test(baseName)) {
    brand = 'Royal Canin';
    manufacturerLegalName = 'Royal Canin do Brasil Indústria e Comércio Ltda';
  } else if (/golden/i.test(commercialName) || /golden/i.test(baseName)) {
    brand = 'GoldeN';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  } else if (/vitta\s*natural/i.test(commercialName) || /vitta\s*natural/i.test(baseName)) {
    brand = 'Vitta Natural';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  } else if (/nutri[çc][ãa]o cl[íi]nica/i.test(commercialName) || /nutri[çc][ãa]o cl[íi]nica/i.test(baseName)) {
    brand = 'PremieR Nutrição Clínica';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  } else if (/nattu/i.test(commercialName) || /nattu/i.test(baseName)) {
    brand = 'PremieR Nattu';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  } else if (/org[âa]nico/i.test(commercialName) || /org[âa]nico/i.test(baseName)) {
    brand = 'PremieR Orgânico';
    manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';
  }

  // 5. Espécie e Fase de Vida
  const dogBreedsRegex =
    /golden retriever|labrador|pit bull|bulldog|buldogue|pug|shih tzu|spitz|lhasa|malt[eê]s|yorkshire|rottweiler|pastor|poodle|beagle|dachshund|schnauzer|chihuahua|boxer|border collie|cocker|pinscher|dálmata|dalmata|basset/i;

  const isDual =
    /c[ãa]es\s*e\s*gatos/i.test(commercialName) ||
    /c[ãa]es\s*e\s*gatos/i.test(baseName);

  const isGato =
    /gato|gatos|felin/i.test(commercialName) ||
    /gato|gatos|felin/i.test(baseName);

  const isCao =
    dogBreedsRegex.test(commercialName) ||
    dogBreedsRegex.test(baseName) ||
    /c[ãa]o|c[ãa]es|cachorro|canin/i.test(commercialName) ||
    /c[ãa]o|c[ãa]es|cachorro|canin/i.test(baseName);

  let species: 'GATO' | 'CAO' | 'CAO_E_GATO' = 'CAO';
  if (isDual) {
    species = 'CAO_E_GATO';
  } else if (isGato) {
    species = 'GATO';
  } else if (isCao) {
    species = 'CAO';
  } else if (/desenvolvido para gatos|para gatos|nutri[çc][ãa]o felina/i.test(text)) {
    species = 'GATO';
  } else {
    species = 'CAO';
  }

  let lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR' = 'ADULTO';
  if (/filhote|crescimento/i.test(commercialName)) {
    lifeStage = 'CRESCIMENTO_INICIAL';
  } else if (/7 a 11 anos|acima de 12 anos|senior|sênior/i.test(commercialName) || /s[êe]nior/i.test(baseName)) {
    lifeStage = 'SENIOR';
  }

  // Porte
  let breedSize: 'TODOS' | 'MINI_PEQUENO' | 'MEDIO_GRANDE' = 'TODOS';
  if (/porte pequeno|mini/i.test(commercialName) || /porte pequeno|mini/i.test(baseName)) {
    breedSize = 'MINI_PEQUENO';
  } else if (/porte grande|m[ée]dio/i.test(commercialName) || /porte grande|m[ée]dio/i.test(baseName)) {
    breedSize = 'MEDIO_GRANDE';
  }

  // Formato do alimento
  let foodType: 'SECO' | 'UMIDO' =
    /úmido|umido|gourmet|sach[êe]|pat[êe]|lata/i.test(baseName) || /úmido|umido|gourmet|sach[êe]|pat[êe]|lata/i.test(commercialName) ? 'UMIDO' : 'SECO';

  // 5.1 Categoria Legal e Condição Coadjuvante
  let legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR' = 'ALIMENTO_COMPLETO';
  let coadjuvanteCondition: string | null = null;

  if (
    /nutri[çc][ãa]o cl[íi]nica/i.test(commercialName) ||
    /nutri[çc][ãa]o cl[íi]nica/i.test(baseName) ||
    /vet\s*care/i.test(commercialName) ||
    /vet\s*care/i.test(baseName) ||
    /alimento coadjuvante/i.test(text)
  ) {
    legalCategory = 'ALIMENTO_COADJUVANTE';
    const targetText = (commercialName + ' ' + baseName + ' ' + text.slice(0, 1200)).toLowerCase();
    if (/renal/i.test(targetText)) {
      coadjuvanteCondition = 'RENAL';
    } else if (/urin[áa]ri/i.test(targetText)) {
      coadjuvanteCondition = 'URINARIO';
    } else if (/recupera/i.test(targetText)) {
      coadjuvanteCondition = 'RECUPERACAO';
    } else if (/obesidade|perda de peso|controle de peso/i.test(targetText)) {
      coadjuvanteCondition = 'OBESIDADE';
    } else if (/diabet/i.test(targetText)) {
      coadjuvanteCondition = 'DIABETES';
    } else if (/gastro|gastrointestinal/i.test(targetText)) {
      coadjuvanteCondition = 'GASTROINTESTINAL';
    } else if (/hipoalerg|pele sens[íi]vel/i.test(targetText)) {
      coadjuvanteCondition = 'HIPOALERGENICO';
    } else if (/hep[áa]t/i.test(targetText)) {
      coadjuvanteCondition = 'HEPATICO';
    } else {
      coadjuvanteCondition = 'OUTRO';
    }
  } else if (
    /cookie|biscoito|snack|petisco|bites/i.test(commercialName) ||
    /cookie|biscoito|snack|petisco|bites/i.test(baseName) ||
    /premier.*gourmet/i.test(commercialName) ||
    /premier.*gourmet/i.test(baseName) ||
    /gourmet/i.test(commercialName) ||
    /gourmet/i.test(baseName) ||
    (!/alimento\s+completo/i.test(text.slice(0, 1000)) &&
      (/complemento\s+alimentar/i.test(text.slice(0, 1000)) ||
        /alimento\s+complementar/i.test(text.slice(0, 1000)) ||
        /alimento\s+espec[íi]fico/i.test(text.slice(0, 1000))))
  ) {
    legalCategory = 'ALIMENTO_COMPLEMENTAR';
  }

  // 6. Ingredientes (COMPOSIÇÃO / Ingredientes até o início da tabela de garantias ou seções subsequentes)
  const compMatch = text.match(/composi[çc][ãa]o\s*(?:b[áa]sica)?/i) || text.match(/\bIngredientes\b/i);
  const compIdx = compMatch && compMatch.index !== undefined ? compMatch.index + compMatch[0].length : -1;
  let endIdx = -1;
  const stopWords = [
    'NÍVEIS DE GARANTIA',
    'Níveis de Garantia',
    'Análise garantida',
    'Proteína Bruta',
    'Proteína Cruda',
    'Umidade',
    'Eventuais Substitutivos',
    '*Espécies doadoras',
    'NUTRIÇÃO',
    'Enriquecimento por',
    'ONDE COMPRAR',
    'Modo de Usar',
    'Guia Alimentar',
  ];
  for (const w of stopWords) {
    const idx = text.indexOf(w, compIdx !== -1 ? compIdx : 0);
    if (idx !== -1 && (endIdx === -1 || idx < endIdx)) endIdx = idx;
  }
  let compRaw = compIdx !== -1 && endIdx !== -1 ? text.slice(compIdx, endIdx) : (compIdx !== -1 ? text.slice(compIdx, compIdx + 1200) : '');

  // 7. Níveis de Garantia (Suporte a %, g/kg e mg/kg)
  const garMatch = text.match(/N[íi]veis\s+de\s+Garantia/i) || text.match(/An[áa]lise\s+garantida/i);
  const tableText = garMatch && garMatch.index !== undefined ? text.slice(garMatch.index) : text;

  const parseGuarantee = (pattern: RegExp): number => {
    const m = tableText.match(pattern);
    if (!m) return 0;
    const rawVal = m[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawVal);
    const unit = (m[2] || '%').toLowerCase();
    if (unit.includes('mg')) return Number((val / 10000).toFixed(4));
    if (unit.includes('g/kg') || unit === 'g') return Number((val / 10).toFixed(2));
    return val;
  };

  const umidadeMaxPct =
    parseGuarantee(/(?:^|\n)\s*Umidade[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/Umidade[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 86.0 : 10.0);
  if (umidadeMaxPct > 50) {
    foodType = 'UMIDO';
  }

  const proteinaBrutaMinPct =
    parseGuarantee(/(?:^|\n)\s*Prote[íi]na\s+(?:Bruta|Cruda)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/Prote[íi]na\s+(?:Bruta|Cruda)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const extratoEtereoMinPct =
    parseGuarantee(/(?:^|\n)\s*Extrato Et[ée]reo[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/Extrato Et[ée]reo[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);

  const materiaMineralMaxPct =
    parseGuarantee(/(?:^|\n)\s*Mat[ée]ria Mineral[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/Mat[ée]ria Mineral[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 2.5 : 8.0);

  const materiaFibrosaMaxPct =
    parseGuarantee(/(?:^|\n)\s*(?:Mat[ée]ria|Fibra)\s*(?:Fibrosa|Bruta)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/(?:Mat[ée]ria|Fibra)\s*(?:Fibrosa|Bruta)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 1.5 : 3.5);

  const calcioMinPct =
    parseGuarantee(/(?:^|\n)\s*C[áa]lcio[^\n\(]*\(m[íi]n\.?\)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/C[áa]lcio\s*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.2 : 0.8);

  const calcioMaxPct =
    parseGuarantee(/(?:^|\n)\s*C[áa]lcio[^\n\(]*\(m[áa]x\.?\)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/C[áa]lcio\s*\(m[áa]x\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.45 : 1.5);

  const fosforoMinPct =
    parseGuarantee(/(?:^|\n)\s*F[óo]sforo[^\n\(]*\(m[íi]n\.?\)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/F[óo]sforo\s*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.15 : 0.7);

  const sodioMinPct =
    parseGuarantee(/(?:^|\n)\s*S[óo]dio[^\n\(]*\(m[íi]n\.?\)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/S[óo]dio\s*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.1 : 0.25);

  const omega3MinPct =
    parseGuarantee(/(?:^|\n)\s*[ÔO]mega\s*3.*?\(m[íi]n\.?\)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/[ÔO]mega\s*3[^\d]*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/(?:^|\n)\s*EPA\s*\+\s*DHA.*?\(m[íi]n\.?\)[^\n\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    0.2;

  // Se for alimento úmido com níveis residuais de cálcio e fósforo (sem premix mineral completo), é Alimento Complementar (Topper)
  if (legalCategory === 'ALIMENTO_COMPLETO' && foodType === 'UMIDO' && calcioMinPct <= 0.05 && fosforoMinPct <= 0.08) {
    legalCategory = 'ALIMENTO_COMPLEMENTAR';
  }

  // Energia Metabolizável
  let energiaMetabolizavelKcalKg: number | null = null;
  const emMatch =
    tableText.match(/Energia\s+Metaboliz[áa]vel[^\d]*(\d[\d\.,]+)\s*kcal/i) ||
    tableText.match(/(\d{4})\s*kcal\/kg/i) ||
    text.match(/Energia\s+Metaboliz[áa]vel[^\d]*(\d[\d\.,]+)\s*kcal/i) ||
    text.match(/(\d{4})\s*kcal\/kg/i);
  if (emMatch) {
    const rawEm = emMatch[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawEm);
    energiaMetabolizavelKcalKg = Math.round(val);
  }

  // Transgênicos (Conformidade com Decreto nº 4.680/2003 e Rotulagem Oficial MAPA)
  const hasNaoTransgExplicit =
    /n[ãa]o\s+transg[êe]nico/i.test(compRaw) ||
    /n[ãa]o\s+transg[êe]nico/i.test(text) ||
    /livre\s+de\s+(?:ingredientes\s+)?transg[êe]nico/i.test(text) ||
    /sem\s+(?:ingredientes\s+)?transg[êe]nico/i.test(text) ||
    /100%\s+livre\s+de\s+transg[êe]nico/i.test(text) ||
    /n[ãa]o\s+cont[ée]m\s+transg[êe]nico/i.test(text);

  const hasContemGmo =
    /\*Cont[ée]m.*transg/i.test(compRaw) ||
    /\*Cont[ée]m.*transg/i.test(text) ||
    /Esp[ée]cies\s+doadoras\s+d[eo]\s+gene/i.test(text) ||
    /doadoras\s+d[eo]\s+gene/i.test(text) ||
    /\btransg[êe]nic[oa]s?\s*\*/i.test(text) ||
    /\b(?:Milho|Soja)\s*\*/i.test(text) ||
    /\(transg[êe]nico\)/i.test(compRaw);

  const containsGmo = hasContemGmo && !hasNaoTransgExplicit;

  let gmoIngredients: string | null = null;
  if (containsGmo) {
    const gmoMatch = compRaw.match(/\*Contém\s+([^.]+)/i);
    if (gmoMatch) {
      gmoIngredients = gmoMatch[1]
        .replace(/1,2|1|2/g, '')
        .replace(/e\/ou.*$/gi, '')
        .replace(/transgênicos.*$/gi, 'transgênicos')
        .trim();
    } else {
      gmoIngredients = 'Milho transgênico, Glúten de milho transgênico, Farelo de soja transgênico';
    }
  }

  // Remove a nota de rodapé de transgênicos ou "não transgênicos" do final da lista de ingredientes
  if (compRaw.includes('*Contém')) {
    compRaw = compRaw.split('*Contém')[0];
  }
  if (compRaw.includes('*Ingredientes')) {
    compRaw = compRaw.split('*Ingredientes')[0];
  }

  // Limpeza de ruídos de cabeçalho / rodapé de página dentro da composição
  const cleanCompText = compRaw
    .replace(/-- \d+ of \d+ --/g, ' ')
    .replace(/Blogs\s*Gatos\s*Cães\s*Alimento\s*Ideal/gi, ' ')
    .replace(/https:\/\/[^\s]*/gi, ' ')
    .replace(/\d{2}\/\d{2}\/\d{4}[^\n]*/g, ' ')
    .replace(/SECA|ÚMIDO|GATOS ADULTOS|GATOS FILHOTES/gi, ' ')
    .replace(/Benefícios[^\n]*/gi, ' ')
    .replace(/\?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Divisão inteligente por vírgulas preservando parênteses
  const topIngredientsList: string[] = [];
  let cur = '';
  let parenDepth = 0;
  for (let i = 0; i < cleanCompText.length; i++) {
    const c = cleanCompText[i];
    if (c === '(') parenDepth++;
    else if (c === ')') parenDepth = Math.max(0, parenDepth - 1);

    if (c === ',' && parenDepth === 0) {
      const item = cur.trim().replace(/\.$/, '');
      if (item && item.length > 1) topIngredientsList.push(item);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) {
    const item = cur.trim().replace(/\.$/, '');
    if (item && item.length > 1) topIngredientsList.push(item);
  }

  // 8. Conservantes / Antioxidantes
  const hasBhaBht = /BHA|BHT|B\.H\.T\./i.test(text);
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

async function processAll() {
  const dir = path.join(process.cwd(), 'produtos_cadastro');
  if (!fs.existsSync(dir)) {
    console.error(`Diretório ${dir} não encontrado!`);
    return;
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const allFiles = fs.readdirSync(dir);
  const pdfFiles = allFiles.filter((f) => f.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.log(`\n📁 Nenhum arquivo PDF pendente na pasta "produtos_cadastro/". Tudo atualizado!\n`);
    return;
  }

  console.log(`\n================================================================`);
  console.log(`🤖 PIPELINE OFICIAL DE CADASTRO E AUDITORIA PETRANKINGS`);
  console.log(`📁 Diretório de Entrada: produtos_cadastro/ (${pdfFiles.length} produtos pendentes)`);
  console.log(`================================================================\n`);

  for (const pdfFile of pdfFiles) {
    const baseName = pdfFile.replace('.pdf', '');
    const pdfFullPath = path.join(dir, pdfFile);

    // 1. Hash SHA-256 do PDF
    const pdfBuf = fs.readFileSync(pdfFullPath);
    const sha256 = crypto.createHash('sha256').update(pdfBuf).digest('hex');

    // 2. Extrai metadados oficiais do PDF
    const meta = await parseProductFromPdf(baseName, pdfBuf);

    // 3. Verifica se o produto já existe no banco por slug
    const existing = await prisma.product.findUnique({
      where: { slug: meta.slug },
    });

    // 4. Localiza imagem correspondente na pasta de entrada
    const imgFile = allFiles.find((f) => {
      const ext = path.extname(f).toLowerCase();
      const name = path.basename(f, ext);
      return name === baseName && ['.webp', '.png', '.jpg', '.jpeg', '.avif'].includes(ext);
    });

    // Mantém o ID existente ou gera um novo com prefixo cmtz
    const productId = existing ? existing.id : 'cmtz' + crypto.randomBytes(10).toString('hex');

    // 5. Destinos padronizados em public/uploads/
    let destImgRel = `/uploads/produto_${productId}.webp`;
    const destPdfRel = `/uploads/ficha_${productId}.pdf`;
    const destImgPath = path.join(process.cwd(), 'public', destImgRel);
    const destPdfPath = path.join(process.cwd(), 'public', destPdfRel);

    if (imgFile) {
      const imgFullPath = path.join(dir, imgFile);
      if (path.extname(imgFullPath).toLowerCase() === '.webp') {
        fs.copyFileSync(imgFullPath, destImgPath);
      } else {
        const sharp = require('sharp');
        await sharp(imgFullPath).webp({ quality: 85 }).toFile(destImgPath);
      }
    } else if (existing?.frontLabelImageUrl && fs.existsSync(path.join(process.cwd(), 'public', existing.frontLabelImageUrl))) {
      destImgRel = existing.frontLabelImageUrl;
      console.log(`   ℹ️ Reutilizando imagem packshot existente: ${destImgRel}`);
    } else {
      console.warn(`⚠️ [AVISO] Imagem correspondente não encontrada para: "${baseName}" e produto não possui imagem anterior. Ignorado.`);
      continue;
    }

    fs.copyFileSync(pdfFullPath, destPdfPath);

    // 6. Executa Motor de Auditoria Oficial
    const auditFase: FaseVida = meta.lifeStage;

    const garantias = {
      umidadeMaxPct: meta.umidadeMaxPct,
      proteinaBrutaMinPct: meta.proteinaBrutaMinPct,
      extratoEtereoMinPct: meta.extratoEtereoMinPct,
      materiaFibrosaMaxPct: meta.materiaFibrosaMaxPct,
      materiaMineralMaxPct: meta.materiaMineralMaxPct,
      calcioMinPct: meta.calcioMinPct,
      calcioMaxPct: meta.calcioMaxPct,
      fosforoMinPct: meta.fosforoMinPct,
      sodioMinPct: meta.sodioMinPct,
      omega3MinPct: meta.omega3MinPct,
    };

    const isCoadjuvante = meta.legalCategory === 'ALIMENTO_COADJUVANTE';
    const isComplementar = meta.legalCategory === 'ALIMENTO_COMPLEMENTAR';

    const audit = calcularScoreAnaliseRotulo(
      meta.species,
      auditFase,
      garantias,
      {
        topIngredientes: meta.topIngredientsList,
        antioxidanteTipo: meta.antioxidantType,
        omega3OuPrebioticosGarantidos: (meta.omega3MinPct ?? 0) > 0,
        claimCarneTipo: 'COM_CARNE',
        claimCarneAdequado: true,
        foodType: meta.foodType,
      },
      meta.foodType
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
            justificativa:
              'Alimento Específico / Complementar: Produto formulado como agrado, petisco ou hidratação suplementar. Não possui suplementação vitamínico-mineral completa de uso exclusivo, devendo ser oferecido em conjunto com a alimentação diária balanceada.',
          },
        ]
      : audit.extratoPontos;

    // 7. Parecer Técnico com Inteligência Artificial Gemini (com fallback determinístico)
    console.log(`🤖 Gerando parecer editorial técnico via Gemini AI...`);
    const editorialOpinion = await generateEditorialOpinionWithGemini({
      commercialName: meta.commercialName,
      brand: meta.brand,
      species: meta.species,
      lifeStage: meta.lifeStage,
      foodType: meta.foodType,
      legalCategory: meta.legalCategory,
      coadjuvanteCondition: meta.coadjuvanteCondition,
      proteinaBrutaMinPct: meta.proteinaBrutaMinPct,
      energiaMetabolizavelKcalKg: meta.energiaMetabolizavelKcalKg,
      antioxidantType: meta.antioxidantType,
      containsGmo: meta.containsGmo,
      topIngredients: meta.topIngredientsList,
      scoreTotal: finalScoreTotal,
      classificationTier: finalClassificationTier,
      extratoPontos: audit.extratoPontos,
      calcioMinPct: meta.calcioMinPct,
      calcioMaxPct: meta.calcioMaxPct,
      fosforoMinPct: meta.fosforoMinPct,
      umidadeMaxPct: meta.umidadeMaxPct,
      extratoEtereoMinPct: meta.extratoEtereoMinPct,
    });

    // 8. Upsert no PostgreSQL via Prisma
    const saved = await prisma.product.upsert({
      where: { slug: meta.slug },
      update: {
        commercialName: meta.commercialName,
        brand: meta.brand,
        manufacturerLegalName: meta.manufacturerLegalName,
        legalCategory: meta.legalCategory,
        species: meta.species,
        lifeStage: meta.lifeStage,
        breedSize: meta.breedSize,
        foodType: meta.foodType,
        coadjuvanteCondition: meta.coadjuvanteCondition,
        sourceUrl: meta.sourceUrl,
        sourceDocumentUrl: destPdfRel,
        frontLabelImageUrl: destImgRel,
        analyzedBatch: 'LOTE-WEB-2026-09',
        labelCollectionDate: new Date('2026-09-13T12:00:00Z'),
        curatorResponsible: 'Curadoria Técnica',

        moistureMaxPct: meta.umidadeMaxPct,
        crudeProteinMinPct: meta.proteinaBrutaMinPct,
        etherExtractMinPct: meta.extratoEtereoMinPct,
        crudeFiberMaxPct: meta.materiaFibrosaMaxPct,
        mineralMatterMaxPct: meta.materiaMineralMaxPct,
        calciumMinPct: meta.calcioMinPct,
        calciumMaxPct: meta.calcioMaxPct,
        phosphorusMinPct: meta.fosforoMinPct,
        sodiumMinPct: meta.sodioMinPct,
        omega3MinPct: meta.omega3MinPct,

        meatClaimType: 'COM_CARNE',
        containsGmo: meta.containsGmo,
        gmoIngredients: meta.gmoIngredients,
        antioxidantType: meta.antioxidantType,
        topIngredients: JSON.stringify(meta.topIngredientsList),
        editorialOpinion: editorialOpinion,

        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: finalScoreBreakdown as any,
        calculatedAt: new Date(),
        isPublished: true,
      },
      create: {
        id: productId,
        slug: meta.slug,
        commercialName: meta.commercialName,
        brand: meta.brand,
        manufacturerLegalName: meta.manufacturerLegalName,
        legalCategory: meta.legalCategory,
        species: meta.species,
        lifeStage: meta.lifeStage,
        breedSize: meta.breedSize,
        foodType: meta.foodType,
        coadjuvanteCondition: meta.coadjuvanteCondition,
        sourceUrl: meta.sourceUrl,
        sourceDocumentUrl: destPdfRel,
        frontLabelImageUrl: destImgRel,
        analyzedBatch: 'LOTE-WEB-2026-09',
        labelCollectionDate: new Date('2026-09-13T12:00:00Z'),
        curatorResponsible: 'Curadoria Técnica',

        moistureMaxPct: meta.umidadeMaxPct,
        crudeProteinMinPct: meta.proteinaBrutaMinPct,
        etherExtractMinPct: meta.extratoEtereoMinPct,
        crudeFiberMaxPct: meta.materiaFibrosaMaxPct,
        mineralMatterMaxPct: meta.materiaMineralMaxPct,
        calciumMinPct: meta.calcioMinPct,
        calciumMaxPct: meta.calcioMaxPct,
        phosphorusMinPct: meta.fosforoMinPct,
        sodiumMinPct: meta.sodioMinPct,
        omega3MinPct: meta.omega3MinPct,

        meatClaimType: 'COM_CARNE',
        containsGmo: meta.containsGmo,
        gmoIngredients: meta.gmoIngredients,
        antioxidantType: meta.antioxidantType,
        topIngredients: JSON.stringify(meta.topIngredientsList),
        editorialOpinion: editorialOpinion,

        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: finalScoreBreakdown as any,
        calculatedAt: new Date(),
        isPublished: true,
      },
    });

    console.log(`✅ [CADASTRADO] ${saved.commercialName}`);
    console.log(`   ID: ${saved.id} | Slug: ${saved.slug}`);
    console.log(`   Categoria: ${saved.legalCategory} ${saved.coadjuvanteCondition ? '(' + saved.coadjuvanteCondition + ')' : ''}`);
    console.log(`   Score: ${saved.scoreTotal !== null ? saved.scoreTotal + ' (' + saved.classificationTier + ')' : (saved.legalCategory === 'ALIMENTO_COMPLEMENTAR' ? 'Alimento Complementar / Petisco (Sem Score de Ranking)' : 'Prescrição Clínica (Sem Score de Ranking)')}`);
    console.log(`   Transgênicos: ${saved.containsGmo ? 'SIM (' + (saved.gmoIngredients || 'Declarado') + ')' : 'NÃO (LIVRE)'}`);
    console.log(`   Conservantes: ${saved.antioxidantType}`);
    console.log(`   Ingredientes: ${meta.topIngredientsList.length} itens cadastrados`);
    console.log(`   Packshot: ${saved.frontLabelImageUrl}`);
    console.log(`   PDF Ficha: ${saved.sourceDocumentUrl}`);
    console.log(`   SHA-256: ${sha256}`);

    // 8. Exclusão segura dos arquivos da pasta de entrada após persistência bem-sucedida
    try {
      if (fs.existsSync(pdfFullPath)) fs.unlinkSync(pdfFullPath);
      if (imgFile && fs.existsSync(path.join(dir, imgFile))) fs.unlinkSync(path.join(dir, imgFile));
      console.log(`   🗑️ Arquivos originais de produtos_cadastro/ removidos com sucesso.`);
    } catch (err) {
      console.warn(`   ⚠️ Não foi possível remover os arquivos de entrada:`, err);
    }
    // Pausa preventiva de 3s para respeitar limites de taxa da API Gemini
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('----------------------------------------------------------------');
  }

  console.log(`\n🎉 Todos os produtos de produtos_cadastro/ foram auditados e sincronizados com sucesso!\n`);

  // Atualiza o arquivo de rastreamento editorial JSON
  try {
    const DETERMINISTIC_REGEX = /(?:Alimento (?:seco|úmido) do segmento|Alimento dietoterápico coadjuvante formulado especialmente|Alimento específico \/ complementar|ao demonstrar atendimento aos pisos regulatórios|demonstrando alta densidade nutricional e atendimento pleno aos parâmetros do Manual Pet Food Brasil|Classificado Sob Observação \(|na auditoria técnica do PetRankings\..*A pontuação foi penalizada porque)/i;
    const allProducts = await prisma.product.findMany({
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

    const processed: any[] = [];
    const pending: any[] = [];

    for (const p of allProducts) {
      const isDeterministic = !p.editorialOpinion || p.editorialOpinion.trim().length === 0 || DETERMINISTIC_REGEX.test(p.editorialOpinion);
      if (isDeterministic) {
        pending.push({
          id: p.id,
          slug: p.slug,
          commercialName: p.commercialName,
          brand: p.brand,
          species: p.species,
          legalCategory: p.legalCategory,
          scoreTotal: p.scoreTotal,
          classificationTier: p.classificationTier,
        });
      } else {
        processed.push({
          id: p.id,
          slug: p.slug,
          commercialName: p.commercialName,
          brand: p.brand,
          species: p.species,
          legalCategory: p.legalCategory,
          scoreTotal: p.scoreTotal,
          classificationTier: p.classificationTier,
          updatedAt: p.updatedAt,
          editorialOpinionSnippet: p.editorialOpinion ? p.editorialOpinion.slice(0, 140) + '...' : '',
        });
      }
    }

    const outDir = path.join(process.cwd(), 'scripts', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const progressFile = path.join(outDir, 'editorial-revision-progress.json');

    fs.writeFileSync(
      progressFile,
      JSON.stringify(
        {
          lastUpdated: new Date().toISOString(),
          summary: {
            totalProducts: allProducts.length,
            processedByGemini: processed.length,
            pending: pending.length,
            percentComplete: `${((processed.length / allProducts.length) * 100).toFixed(2)}%`,
          },
          processed,
          pending,
        },
        null,
        2
      ),
      'utf-8'
    );
    console.log(`📊 Arquivo de progresso editorial atualizado com ${allProducts.length} produtos no total.`);
  } catch (err) {
    console.warn(`⚠️ Não foi possível sincronizar o arquivo de progresso JSON:`, err);
  }
}

processAll()
  .catch((e) => {
    console.error('❌ Erro no pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
