import fs from 'fs';
import path from 'path';
const { PDFParse } = require('pdf-parse');

async function inspectDetails() {
  const dir = path.join(process.cwd(), 'produtos_cadastro');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf'));

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const parser = new PDFParse({ data: fs.readFileSync(fullPath) });
    const res = await parser.getText();
    const text = res.text;

    // Título
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const breadcrumb = lines.find((l: string) => l.startsWith('Início » Linha »')) || '';
    const title = breadcrumb.replace('Início » Linha »', '').trim() || f.replace('.pdf', '');

    // URL
    const urlMatch = text.match(/https:\/\/premierpet\.com\.br\/produto\/[^\s\t\n]+/);
    const url = urlMatch ? urlMatch[0] : '';

    // Extração de Garantias
    const parseNum = (regex: RegExp) => {
      const m = text.match(regex);
      if (!m) return null;
      return parseFloat(m[1].replace(',', '.'));
    };

    const umidade = parseNum(/Umidade[^\d]*(\d+[\.,]\d+)\s*%/i);
    const proteina = parseNum(/Prote[íi]na Bruta[^\d]*(\d+[\.,]\d+)\s*%/i);
    const gordura = parseNum(/Extrato Et[ée]reo[^\d]*(\d+[\.,]\d+)\s*%/i);
    const mineral = parseNum(/Mat[ée]ria Mineral[^\d]*(\d+[\.,]\d+)\s*%/i);
    const fibra = parseNum(/Mat[ée]ria Fibrosa[^\d]*(\d+[\.,]\d+)\s*%/i);
    const calcioMax = parseNum(/C[áa]lcio\s*\(m[áa]x\.?\)[^\d]*(\d+[\.,]\d+)\s*%/i);
    const calcioMin = parseNum(/C[áa]lcio\s*\(m[íi]n\.?\)[^\d]*(\d+[\.,]\d+)\s*%/i);
    const fosforo = parseNum(/F[óo]sforo[^\d]*(\d+[\.,]\d+)\s*%/i);
    const sodio = parseNum(/(?:^|\n)\s*S[óo]dio\s*\(m[íi]n\.?\)\s*(\d+[\.,]\d+)/i);
    const omega3 = parseNum(/[ÔO]mega\s*3[^\d]*(\d+[\.,]\d+)\s*%/i);
    const emMatch = text.match(/Energia Metaboliz[áa]vel[^\d]*(\d[\d\.,]+)\s*kcal/i);
    const em = emMatch ? parseInt(emMatch[1].replace(/\D/g, ''), 10) : null;

    // Fase de Vida
    let lifeStage: 'ADULTO' | 'FILHOTE' | 'SENIOR' = 'ADULTO';
    if (/filhote/i.test(title)) lifeStage = 'FILHOTE';
    else if (/7 a 11 anos|acima de 12 anos|senior|sênior/i.test(title)) lifeStage = 'SENIOR';

    // Antioxidantes
    const hasBhaBht = /BHA|BHT/i.test(text);
    const antioxidantType = hasBhaBht ? 'SINTETICO' : 'NATURAL';

    // Transgênicos
    const isTransgenic = /Biotecnologia|espécies doadoras|milho\*|soja\*|transgênic/i.test(text) && !/glúten de milho \(não transgênico\)/i.test(text);

    // Ingredientes (trecho entre COMPOSIÇÃO e Umidade)
    const compIdx = text.indexOf('COMPOSIÇÃO');
    const umidIdx = text.indexOf('Umidade', compIdx !== -1 ? compIdx : 0);
    const compRaw = compIdx !== -1 && umidIdx !== -1 ? text.slice(compIdx + 10, umidIdx).trim() : '';

    console.log(`\n================================================================`);
    console.log(`ARQUIVO: ${f}`);
    console.log(`TÍTULO: ${title} | FASE: ${lifeStage}`);
    console.log(`URL: ${url}`);
    console.log(`GARANTIAS: Umid=${umidade}%, PB=${proteina}%, EE=${gordura}%, MM=${mineral}%, FB=${fibra}%, CaMin=${calcioMin}%, CaMax=${calcioMax}%, P=${fosforo}%, Na=${sodio}%, Omega3=${omega3}%, EM=${em}`);
    console.log(`CONSERVANTES: ${antioxidantType} | TRANSGÊNICOS: ${isTransgenic ? 'SIM' : 'NÃO (LIVRE)'}`);
    console.log(`INGR RAW (início): ${compRaw.slice(0, 150).replace(/\n/g, ' ')}...`);
  }
}

inspectDetails().catch(console.error);
