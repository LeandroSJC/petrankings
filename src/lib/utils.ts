const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://petrankings.com.br';
export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Não revisado';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Remove menções de peso, gramatura e termos de embalagem do nome comercial do produto.
 * Ex: "Ração Úmida WHISKAS Sachê Frango 85 g" -> "Ração Úmida WHISKAS Sachê Frango"
 * Ex: "PremieR Formula Cães Adultos 15kg" -> "PremieR Formula Cães Adultos"
 * Ex: "Ração Cães Adultos (10,1 kg)" -> "Ração Cães Adultos"
 */
export function stripWeightFromTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;

  for (let iter = 0; iter < 3; iter++) {
    const prev = cleaned;
    // 1. Remove parênteses ou colchetes contendo peso: (15 kg), [85g], (Pacote 10,1kg)
    cleaned = cleaned.replace(
      /\s*[\(\[\{]\s*(?:(?:pacote|saco|embalagem|peso)\s*(?:de\s*)?)?\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilos?|quilos?|g|gr|grs|gramas?|ml|l)\s*[\)\]\}]/gi,
      ''
    );
    // 2. Remove prefixos como ' - 15kg', ' | 15 kg', ' / 85g'
    cleaned = cleaned.replace(
      /\s*[-–—|/]\s*(?:(?:pacote|saco|embalagem|peso)\s*(?:de\s*)?)?\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilos?|quilos?|g|gr|grs|gramas?|ml|l)\b/gi,
      ''
    );
    // 3. Remove 'pacote de 15kg', 'saco 15kg', 'embalagem 85g'
    cleaned = cleaned.replace(
      /\b(?:pacote|saco|embalagem|peso)\s*(?:de\s*)?\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilos?|quilos?|g|gr|grs|gramas?|ml|l)\b/gi,
      ''
    );
    // 4. Remove peso solto: ' 15kg', ' 85 g', ' 10,1 kg', ' 290 g'
    cleaned = cleaned.replace(
      /\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilos?|quilos?|g|gr|grs|gramas?|ml|l)\b/gi,
      ''
    );
    // 5. Remove resíduos de pontuação, preposições/conjunções no final ('de', 'com', 'e', 'ou')
    cleaned = cleaned
      .replace(/\s*[-–—|/]\s*$/g, '')
      .replace(/\s+(?:de|com|em|e|ou|para)\s*$/i, '')
      .replace(/\s*[-–—|/]\s*$/g, '')
      .replace(/\s+([,.:;])/g, '$1')
      .replace(/\(\s*\)|\[\s*\]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned === prev) break;
  }

  return cleaned;
}

/**
 * Normaliza o texto de um ingrediente individual, convertendo textos em CAIXA ALTA (ALL CAPS)
 * para a escrita padrão (primeira letra maiúscula e restante minúsculo),
 * preservando siglas técnicas (BHT, BHA, DHA, EPA, MOS, FOS), vitaminas (vitamina A, D3, B12)
 * e aminoácidos (L-carnitina, DL-metionina).
 */
export function normalizeIngredient(text: string): string {
  if (!text) return '';
  let str = text.trim();

  // Se não tem letras, retorna como está
  if (!/[a-zA-ZÀ-ÿ]/.test(str)) return str;

  // Verifica se o texto tem proporção alta de caixa alta (ex: >= 50% das letras são maiúsculas)
  const letters = str.match(/[a-zA-ZÀ-ÿ]/g) || [];
  const upperLetters = str.match(/[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]/g) || [];
  const isMostlyUpper = letters.length > 0 && upperLetters.length / letters.length >= 0.5;

  if (isMostlyUpper) {
    // Converte para minúsculas
    str = str.toLowerCase();

    // 1. Preserva siglas nutricionais e tecnológicas em maiúsculas
    const acronyms = ['bha', 'bht', 'dha', 'epa', 'mos', 'fos', 'gos', 'edta', 'hmb', 'ogm', 'dna', 'rna'];
    for (const acr of acronyms) {
      const reg = new RegExp(`\\b${acr}\\b`, 'gi');
      str = str.replace(reg, acr.toUpperCase());
    }

    // 2. Preserva aminoácidos comuns: L-carnitina, DL-metionina, L-lisina, L-triptofano
    str = str.replace(/\bl-([a-zà-ÿ]+)/gi, (m, p1) => `L-${p1.toLowerCase()}`);
    str = str.replace(/\bdl-([a-zà-ÿ]+)/gi, (m, p1) => `DL-${p1.toLowerCase()}`);

    // 3. Preserva letras de vitaminas: vitamina A, D3, B12, etc.
    str = str.replace(
      /\b(vitamina|vitaminas)\s*\(([^)]+)\)/gi,
      (m, p1, p2) => {
        const fixedVits = p2.replace(/\b([a-z])(\d*)\b/gi, (match: string, letter: string, num: string) => {
          return letter.toUpperCase() + num;
        });
        return `${p1} (${fixedVits})`;
      }
    );
    str = str.replace(/\bvitamina\s+([a-z])(\d*)\b/gi, (match, letter, num) => {
      return `vitamina ${letter.toUpperCase()}${num}`;
    });

    // 4. Capitaliza a primeira letra do ingrediente
    str = str.charAt(0).toUpperCase() + str.slice(1);
  } else {
    // Mesmo quando não for todo em maiúsculas, garante primeira letra maiúscula
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Remove espaços duplicados e pontuações estranhas
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Normaliza um array de ingredientes.
 */
export function normalizeIngredientsList(ingredients: string[]): string[] {
  if (!Array.isArray(ingredients)) return [];
  return ingredients.map((ing) => normalizeIngredient(ing)).filter(Boolean);
}

/**
 * Normaliza uma string de ingredientes separados por vírgula.
 */
export function normalizeIngredientsText(text: string): string {
  if (!text) return '';
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  return normalizeIngredientsList(parts).join(', ');
}


