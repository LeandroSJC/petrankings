import fs from 'fs';
import path from 'path';
const { PDFParse } = require('pdf-parse');

async function testAll() {
  const dir = path.join(process.cwd(), 'produtos_cadastro');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf'));

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const parser = new PDFParse({ data: fs.readFileSync(fullPath) });
    const res = await parser.getText();
    const text = res.text;

    // 1. Extração de URL
    const urlMatch = text.match(/https:\/\/premierpet\.com\.br\/produto\/[^\s\t\n]+/);
    const url = urlMatch ? urlMatch[0] : (f.includes('Wild') ? 'https://premierpet.com.br/produto/nattu-wild-gatos-adultos-castrados-abobora-e-espinafre/' : null);

    // 2. Extração de Garantias
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
    const sodio = parseNum(/S[óo]dio[^\d]*(\d+[\.,]\d+)\s*%/i);
    const omega3 = parseNum(/[ÔO]mega\s*3[^\d]*(\d+[\.,]\d+)\s*%/i);
    const emMatch = text.match(/Energia Metaboliz[áa]vel[^\d]*(\d[\d\.,]+)\s*kcal/i);
    const em = emMatch ? parseInt(emMatch[1].replace(/\D/g, ''), 10) : null;

    // 3. Transgênicos & Antioxidantes
    const isNatural = /antioxidante natural|concentrado de tocofer/i.test(text) && !/BHA|BHT/i.test(text);
    const isTransgenic = /Biotecnologia|espécies doadoras|milho\*|soja\*|transgênic[ao]\s*\(?(?!não)/i.test(text) && !/glúten de milho \(não transgênico\)/i.test(text);

    console.log(`\n========================================`);
    console.log(`PRODUTO: ${f.replace('.pdf', '')}`);
    console.log(`URL: ${url}`);
    console.log(`Garantias: Umid=${umidade}%, PB=${proteina}%, EE=${gordura}%, MM=${mineral}%, FB=${fibra}%, CaMin=${calcioMin}%, CaMax=${calcioMax}%, P=${fosforo}%, Na=${sodio}%, Omega3=${omega3}%, EM=${em} kcal/kg`);
    console.log(`Conservantes: ${isNatural ? 'NATURAL' : 'SINTETICO (BHA/BHT)'} | Transgênicos: ${isTransgenic ? 'SIM' : 'NÃO (LIVRE)'}`);
  }
}

testAll().catch(console.error);
