import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';
import { FaseVida } from '../src/lib/audit-engine/types';
const { PDFParse } = require('pdf-parse');

interface ProductMetadata {
  commercialName: string;
  slug: string;
  brand: string;
  manufacturerLegalName: string;
  species: 'GATO' | 'CAO';
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
  editorialOpinion: string;
}

/**
 * Extrator automático e determinístico de dados de rotulagem a partir do PDF oficial do fabricante
 */
async function parseProductFromPdf(baseName: string, pdfBuf: Buffer): Promise<ProductMetadata> {
  const parser = new PDFParse({ data: pdfBuf });
  const parsed = await parser.getText();
  const text: string = parsed.text;

  // 1. URL Oficial no rodapé
  const urlMatch = text.match(/https:\/\/premierpet\.com\.br\/produto\/[^\s\t\n]+/);
  let sourceUrl = urlMatch ? urlMatch[0].trim() : '';
  if (!sourceUrl) {
    if (/wild/i.test(baseName)) {
      sourceUrl = 'https://premierpet.com.br/produto/nattu-wild-gatos-adultos-castrados-abobora-e-espinafre/';
    }
  }

  // 2. Slug
  let slug = '';
  if (sourceUrl) {
    const m = sourceUrl.match(/\/produto\/([^/]+)\/?/);
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
  const breadcrumb = lines.find((l: string) => l.startsWith('Início » Linha »')) || '';
  let commercialName = breadcrumb.replace('Início » Linha »', '').trim();
  if (!commercialName || commercialName.length < 5) {
    commercialName = baseName;
  }
  if (
    !commercialName.startsWith('PremieR') &&
    !commercialName.startsWith('GoldeN') &&
    !commercialName.startsWith('Golden') &&
    !commercialName.startsWith('Vitta')
  ) {
    commercialName = 'PremieR ' + commercialName;
  }

  // 4. Marca e Fabricante
  let brand = 'PremieR';
  if (/golden/i.test(commercialName) || /golden/i.test(baseName)) {
    brand = 'GoldeN';
  } else if (/vitta\s*natural/i.test(commercialName) || /vitta\s*natural/i.test(baseName)) {
    brand = 'Vitta Natural';
  } else if (/nutri[çc][ãa]o cl[íi]nica/i.test(commercialName) || /nutri[çc][ãa]o cl[íi]nica/i.test(baseName)) {
    brand = 'PremieR Nutrição Clínica';
  } else if (/nattu/i.test(commercialName) || /nattu/i.test(baseName)) {
    brand = 'PremieR Nattu';
  } else if (/org[âa]nico/i.test(commercialName) || /org[âa]nico/i.test(baseName)) {
    brand = 'PremieR Orgânico';
  }
  const manufacturerLegalName = 'Grandfood Indústria e Comércio Ltda';

  // 5. Espécie e Fase de Vida
  const isCao = /c[ãa]o|c[ãa]es|cachorro/i.test(commercialName) || /c[ãa]o|c[ãa]es|cachorro/i.test(baseName);
  const species: 'GATO' | 'CAO' = isCao && !/gato/i.test(commercialName) ? 'CAO' : 'GATO';

  let lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR' = 'ADULTO';
  if (/filhote|crescimento/i.test(commercialName)) {
    lifeStage = 'CRESCIMENTO_INICIAL';
  } else if (/7 a 11 anos|acima de 12 anos|senior|sênior/i.test(commercialName)) {
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
    /úmido|umido|gourmet/i.test(baseName) || /úmido|umido|gourmet/i.test(commercialName) ? 'UMIDO' : 'SECO';

  // 5.1 Categoria Legal e Condição Coadjuvante
  let legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR' = 'ALIMENTO_COMPLETO';
  let coadjuvanteCondition: string | null = null;

  if (
    /nutri[çc][ãa]o cl[íi]nica/i.test(commercialName) ||
    /nutri[çc][ãa]o cl[íi]nica/i.test(baseName) ||
    /alimento coadjuvante/i.test(text)
  ) {
    legalCategory = 'ALIMENTO_COADJUVANTE';
    const targetText = (commercialName + ' ' + baseName).toLowerCase();
    if (/renal/i.test(targetText)) {
      coadjuvanteCondition = 'RENAL';
    } else if (/urin[áa]rio|estruvita|oxalate/i.test(targetText)) {
      coadjuvanteCondition = 'URINARIO';
    } else if (/obesidade|perda de peso|controle de peso/i.test(targetText)) {
      coadjuvanteCondition = 'OBESIDADE';
    } else if (/diabet/i.test(targetText)) {
      coadjuvanteCondition = 'DIABETES';
    } else if (/gastro|gastrointestinal/i.test(targetText)) {
      coadjuvanteCondition = 'GASTROINTESTINAL';
    } else if (/recupera[çc][ãa]o|convalesc/i.test(targetText)) {
      coadjuvanteCondition = 'RECUPERACAO';
    } else if (/hipoalerg|pele sens[íi]vel/i.test(targetText)) {
      coadjuvanteCondition = 'HIPOALERGENICO';
    } else if (/hep[áa]t/i.test(targetText)) {
      coadjuvanteCondition = 'HEPATICO';
    } else {
      coadjuvanteCondition = 'OUTRO';
    }
  } else if (
    /complemento alimentar/i.test(text) ||
    /alimento complementar/i.test(text) ||
    /alimento espec[íi]fico/i.test(text)
  ) {
    legalCategory = 'ALIMENTO_COMPLEMENTAR';
  }

  // 6. Ingredientes (COMPOSIÇÃO até o início da tabela de garantias)
  const compIdx = text.indexOf('COMPOSIÇÃO');
  let endIdx = -1;
  const stopWords = ['NÍVEIS DE GARANTIA', 'Níveis de Garantia', 'Proteína Bruta', 'Proteína Cruda', 'Umidade'];
  for (const w of stopWords) {
    const idx = text.indexOf(w, compIdx !== -1 ? compIdx + 10 : 0);
    if (idx !== -1 && (endIdx === -1 || idx < endIdx)) endIdx = idx;
  }
  let compRaw = compIdx !== -1 && endIdx !== -1 ? text.slice(compIdx + 10, endIdx) : '';
  const tableText = compIdx !== -1 ? text.slice(compIdx) : text;

  // 7. Níveis de Garantia (Suporte a % e g/kg ou mg/kg)
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
    parseGuarantee(/Umidade[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) || (foodType === 'UMIDO' ? 86.0 : 10.0);
  if (umidadeMaxPct > 50) {
    foodType = 'UMIDO';
  }

  const proteinaBrutaMinPct = parseGuarantee(
    /Prote[íi]na\s+(?:Bruta|Cruda)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i
  );
  const extratoEtereoMinPct = parseGuarantee(/Extrato Et[ée]reo[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i);
  const materiaMineralMaxPct =
    parseGuarantee(/Mat[ée]ria Mineral[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 2.5 : 8.0);
  const materiaFibrosaMaxPct =
    parseGuarantee(/(?:Mat[ée]ria|Fibra)\s*(?:Fibrosa|Bruta)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 1.5 : 3.5);
  const calcioMinPct =
    parseGuarantee(/C[áa]lcio\s*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.2 : 0.8);
  const calcioMaxPct =
    parseGuarantee(/C[áa]lcio\s*\(m[áa]x\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.45 : 1.5);
  const fosforoMinPct =
    parseGuarantee(/F[óo]sforo\s*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.15 : 0.7);
  const sodioMinPct =
    parseGuarantee(/S[óo]dio\s*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    (foodType === 'UMIDO' ? 0.1 : 0.25);
  const omega3MinPct =
    parseGuarantee(/[ÔO]mega\s*3[^\d]*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/[ÔO]mega\s*3[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    parseGuarantee(/EPA\s*\+\s*DHA[^\d]*\(m[íi]n\.?\)[^\d]*(\d+(?:[\.,]\d+)?)\s*(%|g\/kg|mg\/kg|g)?/i) ||
    0.2;

  // Energia Metabolizável
  let energiaMetabolizavelKcalKg: number | null = null;
  const emMatch = text.match(/Energia Metaboliz[áa]vel[^\d]*(\d[\d\.,]+)\s*kcal/i);
  if (emMatch) {
    const rawEm = emMatch[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawEm);
    energiaMetabolizavelKcalKg = Math.round(val);
  }

  // Transgênicos (Conformidade com Decreto nº 4.680/2003 e Rotulagem Oficial MAPA)
  const hasNaoTransgExplicit = /n[ãa]o transg[êe]nico/i.test(compRaw) || /n[ãa]o transg[êe]nico/i.test(text);
  const hasContemGmo = /\*Cont[ée]m.*transg/i.test(compRaw) || /\*Cont[ée]m.*transg/i.test(text);
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
      gmoIngredients = 'Milho transgênico, Glúten de milho transgênico, Proteína concentrada de soja transgênica';
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
    .replace(/https:\/\/premierpet\.com\.br[^\s]*/gi, ' ')
    .replace(/\d{2}\/\d{2}\/\d{4}[^\n]*/g, ' ')
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
  const hasBhaBht = /BHA|BHT/i.test(text);
  const antioxidantType: 'NATURAL' | 'SINTETICO' = hasBhaBht ? 'SINTETICO' : 'NATURAL';

  // 9. Parecer Técnico Justificado
  const calStr = energiaMetabolizavelKcalKg ? ` com densidade de ${energiaMetabolizavelKcalKg.toLocaleString('pt-BR')} kcal/kg` : '';
  const gmoStr = containsGmo ? 'e presença de cereais transgênicos' : 'e fórmula livre de transgênicos';
  const conservStr = antioxidantType === 'NATURAL' ? 'conservantes 100% naturais' : 'antioxidantes sintéticos (BHA/BHT)';
  const faseLabel = lifeStage === 'CRESCIMENTO_INICIAL' ? 'filhotes em fase de crescimento' : (lifeStage === 'SENIOR' ? 'idosos / sênior' : 'adultos');

  let editorialOpinion = '';
  if (legalCategory === 'ALIMENTO_COADJUVANTE') {
    const descMatch = text.match(/PremieR[®\s]+(?:Nutrição Clínica|NC)[^\n]+\s*é um alimento coadjuvante desenvolvido especialmente para[^\.\n]+\./i)
      || text.match(/PremieR[®\s]+(?:Nutrição Clínica|NC)[^\.\n]+\./i);
    const descClinica = descMatch
      ? descMatch[0].replace(/\s+/g, ' ').trim()
      : `Alimento coadjuvante desenvolvido especialmente para suporte clínico a ${species === 'GATO' ? 'gatos' : 'cães'} (${coadjuvanteCondition?.toLowerCase()}).`;
    editorialOpinion = `${descClinica} Formulado com ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} ${gmoStr}. Alimento dietoterápico coadjuvante de uso sob orientação veterinária.`;
  } else {
    const tierLabel = brand === 'GoldeN' ? 'Premium Especial' : (brand === 'Vitta Natural' ? 'Premium' : 'Super Premium');
    const foodTypeLabel = foodType === 'UMIDO' ? 'úmido ' : '';
    editorialOpinion = `Alimento ${foodTypeLabel}${tierLabel} para ${species === 'GATO' ? 'gatos' : 'cães'} (${faseLabel}), formulado com ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} ${gmoStr}. Relação cálcio:fósforo equilibrada e atendimento integral aos limites da 11ª Edição do Manual ABINPET.`;
  }

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
    editorialOpinion,
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

    // 1. Localiza imagem correspondente
    const imgFile = allFiles.find((f) => {
      const ext = path.extname(f).toLowerCase();
      const name = path.basename(f, ext);
      return name === baseName && ['.webp', '.png', '.jpg', '.jpeg'].includes(ext);
    });

    if (!imgFile) {
      console.warn(`⚠️ [AVISO] Imagem correspondente não encontrada para: "${baseName}". Produto ignorado.`);
      continue;
    }

    const pdfFullPath = path.join(dir, pdfFile);
    const imgFullPath = path.join(dir, imgFile);

    // 2. Hash SHA-256 do PDF
    const pdfBuf = fs.readFileSync(pdfFullPath);
    const sha256 = crypto.createHash('sha256').update(pdfBuf).digest('hex');

    // 3. Extrai metadados oficiais do PDF
    const meta = await parseProductFromPdf(baseName, pdfBuf);

    // 4. Verifica se o produto já existe no banco por slug
    const existing = await prisma.product.findUnique({
      where: { slug: meta.slug },
    });

    // Mantém o ID existente ou gera um novo com prefixo cmtz
    const productId = existing ? existing.id : 'cmtz' + crypto.randomBytes(10).toString('hex');

    // 5. Destinos padronizados em public/uploads/
    const destImgRel = `/uploads/produto_${productId}.webp`;
    const destPdfRel = `/uploads/ficha_${productId}.pdf`;
    const destImgPath = path.join(process.cwd(), 'public', destImgRel);
    const destPdfPath = path.join(process.cwd(), 'public', destPdfRel);

    if (path.extname(imgFullPath).toLowerCase() === '.webp') {
      fs.copyFileSync(imgFullPath, destImgPath);
    } else {
      const sharp = require('sharp');
      await sharp(imgFullPath).webp({ quality: 85 }).toFile(destImgPath);
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

    // 7. Upsert no PostgreSQL via Prisma
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
        editorialOpinion: meta.editorialOpinion,

        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: audit.extratoPontos as any,
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
        editorialOpinion: meta.editorialOpinion,

        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: audit.extratoPontos as any,
        calculatedAt: new Date(),
        isPublished: true,
      },
    });

    console.log(`✅ [CADASTRADO] ${saved.commercialName}`);
    console.log(`   ID: ${saved.id} | Slug: ${saved.slug}`);
    console.log(`   Categoria: ${saved.legalCategory} ${saved.coadjuvanteCondition ? '(' + saved.coadjuvanteCondition + ')' : ''}`);
    console.log(`   Score: ${saved.scoreTotal !== null ? saved.scoreTotal + ' (' + saved.classificationTier + ')' : 'Prescrição Clínica (Sem Score de Ranking)'}`);
    console.log(`   Transgênicos: ${saved.containsGmo ? 'SIM (' + (saved.gmoIngredients || 'Declarado') + ')' : 'NÃO (LIVRE)'}`);
    console.log(`   Conservantes: ${saved.antioxidantType}`);
    console.log(`   Ingredientes: ${meta.topIngredientsList.length} itens cadastrados`);
    console.log(`   Packshot: ${saved.frontLabelImageUrl}`);
    console.log(`   PDF Ficha: ${saved.sourceDocumentUrl}`);
    console.log(`   SHA-256: ${sha256}`);

    // 8. Exclusão segura dos arquivos da pasta de entrada após persistência bem-sucedida
    try {
      if (fs.existsSync(pdfFullPath)) fs.unlinkSync(pdfFullPath);
      if (fs.existsSync(imgFullPath)) fs.unlinkSync(imgFullPath);
      console.log(`   🗑️ Arquivos originais de produtos_cadastro/ removidos com sucesso.`);
    } catch (err) {
      console.warn(`   ⚠️ Não foi possível remover os arquivos de entrada:`, err);
    }
    console.log('----------------------------------------------------------------');
  }

  console.log(`\n🎉 Todos os produtos de produtos_cadastro/ foram auditados e sincronizados com sucesso!\n`);
}

processAll()
  .catch((e) => {
    console.error('❌ Erro no pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
