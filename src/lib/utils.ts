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

