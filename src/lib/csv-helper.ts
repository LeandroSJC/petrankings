/**
 * Utilitário de Parsing e Serialização de CSV para o PetRankings (admin-dashboard-engineer).
 * Suporta RFC 4180, aspas escapadas, quebras de linha em campos e detecção automática de delimitador (, ou ;).
 */

export interface ParsedCsvRow {
  [header: string]: string;
}

/**
 * Faz o parse de texto CSV em array de objetos com cabeçalhos normalizados.
 */
export function parseCsv(csvText: string): ParsedCsvRow[] {
  // Remover BOM se existir
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  // Detectar delimitador na primeira linha (; ou ,)
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // pular aspa duplicada
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Normalizar cabeçalhos (remover aspas, espaços e padronizar minúsculas sem acentos)
  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

  const result: ParsedCsvRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const item: ParsedCsvRow = {};
    let hasData = false;

    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      const val = row[c] !== undefined ? row[c].replace(/^["']|["']$/g, '').trim() : '';
      if (val) hasData = true;
      item[header] = val;
    }

    if (hasData) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Serializa array de objetos em string CSV com UTF-8 BOM e delimitador compatível com Excel.
 */
export function serializeToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const formatCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => `"${h}"`).join(',');
  const rowLines = rows.map((r) => r.map(formatCell).join(','));

  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Dispara o download de um arquivo CSV no navegador.
 */
export function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// MODELOS / TEMPLATES DE IMPORTAÇÃO
// -------------------------------------------------------------

export const PRODUCT_CSV_HEADERS = [
  'id',
  'titulo',
  'marca',
  'especie',
  'tipo_produto',
  'descricao',
  'url_imagem',
  'amazon_url',
  'amazon_nota',
  'amazon_avaliacoes',
  'petlove_url',
  'petlove_nota',
  'petlove_avaliacoes',
  'cobasi_url',
  'cobasi_nota',
  'cobasi_avaliacoes',
  'mercadolivre_url',
  'mercadolivre_nota',
  'mercadolivre_avaliacoes',
  'shopee_url',
  'shopee_nota',
  'shopee_avaliacoes',
  'rankings_vinculados',
];

export const PRODUCT_CSV_TEMPLATE = serializeToCsv(
  PRODUCT_CSV_HEADERS,
  [
    [
      '', // ID vazio para criar novo
      'Ração PremieR Formula Cães Adultos Frango 15kg',
      'PremieR Pet',
      'caes',
      'Ração seca',
      'Alimento super premium completo e balanceado para cães adultos com ingredientes nobres.',
      'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600',
      'https://www.amazon.com.br/dp/B07XYZ123',
      '4.9',
      '1420',
      'https://www.petlove.com.br/produto/12345',
      '4.8',
      '890',
      'https://www.cobasi.com.br/produto/67890',
      '4.8',
      '530',
      'https://produto.mercadolivre.com.br/MLB-123456',
      '4.9',
      '2100',
      'https://shopee.com.br/product/999/888',
      '4.7',
      '340',
      'Melhores Rações Secas para Cães Adultos',
    ],
    [
      '',
      'Areia Sanitária Pipicat Classic 4kg',
      'Pipicat',
      'gatos',
      'Areia higiênica',
      'Granulado sanitário tradicional de alta absorção e controle natural de odores.',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
      'https://www.amazon.com.br/dp/B08ABC456',
      '4.7',
      '980',
      'https://www.petlove.com.br/produto/54321',
      '4.6',
      '620',
      'https://www.cobasi.com.br/produto/98765',
      '4.8',
      '410',
      '',
      '',
      '',
      '',
      '',
      '',
      'Melhores Areias Sanitárias para Gatos',
    ],
  ]
);

export const RANKING_CSV_HEADERS = [
  'id',
  'slug',
  'titulo',
  'especie',
  'tipo_produto',
  'descricao',
  'publicado',
];

export const RANKING_CSV_TEMPLATE = serializeToCsv(
  RANKING_CSV_HEADERS,
  [
    [
      '',
      'melhores-racoes-secas-para-caes-adultos',
      'Melhores Rações Secas para Cães Adultos',
      'caes',
      'Ração seca',
      'Comparativo carinhoso e transparente das rações secas mais recomendadas para cães adultos.',
      'true',
    ],
    [
      '',
      'melhores-areias-sanitarias-para-gatos',
      'Melhores Areias Sanitárias para Gatos',
      'gatos',
      'Areia higiênica',
      'Guia completo das melhores opções de areia para caixas de higiene felina.',
      'true',
    ],
  ]
);
