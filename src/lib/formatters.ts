/**
 * Sanitizador e Formatador Oficial de Interface (DRS 8.0 - Seção 1)
 * Garante a substituição compulsória de códigos técnicos/SNAKE_CASE por termos elegantes,
 * eliminando estritamente qualquer caractere de sublinhado (_) do front-end.
 */

// Tabela Oficial de Mapeamento (Parser Back-End ➔ Front-End)
const MAPA_TERMOS: Record<string, string> = {
  // Faixas de Classificação
  NIVEL_OURO: 'Nível Ouro',
  NIVEL_PRATA: 'Nível Prata',
  NIVEL_BRONZE: 'Nível Bronze',
  SOB_OBSERVACAO: 'Sob Observação',
  SUPER_PREMIUM: 'Nível Ouro (Padrão Superior)',
  PREMIUM_ESPECIAL: 'Nível Prata (Padrão Ótimo)',
  ECONOMICO: 'Nível Bronze (Padrão Regular)',
  NAO_CONFORME: 'Sob Observação',
  PARAMETRO_LIMITROFE: 'Sob Observação',

  // Portes
  MEDIO_GRANDE: 'Porte Médio e Grande',
  PEQUENO_MINI: 'Porte Pequeno e Mini',
  MINI_PEQUENO: 'Porte Pequeno e Mini',
  TODOS: 'Todos os Portes',

  // Fases de Vida
  CRESCIMENTO_INICIAL: 'Filhote',
  CRESCIMENTO_FINAL: 'Filhote',
  FILHOTE: 'Filhote',
  ADULTO_MANUTENCAO: 'Adulto',
  ADULTO: 'Adulto',
  SENIOR: 'Sênior (Idoso)',

  // Claims de Carne e Rotulagem
  COM_CARNE: 'Com Carne',
  SABOR_CARNE: 'Sabor Carne',
  COM_CARNE_FRESCA: 'Com Carne Fresca',
  NENHUM: 'Padrão',

  // Categorias Legais MAPA
  ALIMENTO_COMPLETO: 'Alimento Completo',
  ALIMENTO_COADJUVANTE: 'Alimento Coadjuvante (Prescrição)',

  // Condições Coadjuvantes
  RENAL: 'Coadjuvante Renal',
  URINARIO: 'Coadjuvante Urinário',
  OBESIDADE: 'Controle de Peso e Obesidade',
  HIPOALERGENICO: 'Hipoalergênico / Alergias',
  HEPATICO: 'Coadjuvante Hepático',
  GASTROINTESTINAL: 'Coadjuvante Gastrointestinal',

  // Status e Tipos de Chamados de Fabricantes
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em Análise',
  DEFERIDO: 'Deferido',
  INDEFERIDO: 'Indeferido',
  ATUALIZACAO_LOTE: 'Atualização de Lote',
  RETIFICACAO_DADOS: 'Retificação de Dados',
  DIVERGENCIA_ANALITICA: 'Divergência Analítica',

  // Nutrientes
  proteina_bruta_min_pct: 'Proteína Bruta Mínima',
  extrato_etereo_min_pct: 'Gordura Mínima',
  materia_fibrosa_max_pct: 'Fibras Máximas',
  materia_mineral_max_pct: 'Minerais Máximos',
  balanco_calcio_fosforo: 'Equilíbrio entre Cálcio e Fósforo',
  energia_metabolizavel_nrc: 'Energia Metabolizável Estimada',

  // Espécies
  CAO: 'Cão',
  GATO: 'Gato',

  // Tipos de Alimento
  SECO: 'Seco',
  SEMI_UMIDO: 'Semiúmido',
  UMIDO: 'Úmido',
};

/**
 * Formata um valor de código/enum para exibição limpa e sanitizada.
 * Se o valor contiver sublinhado (_) e não estiver no mapa, substitui por espaços e capitaliza.
 */
export function formatarTermo(valor: string | null | undefined): string {
  if (!valor) return '';
  const trimmed = valor.trim();
  if (MAPA_TERMOS[trimmed]) {
    return MAPA_TERMOS[trimmed];
  }
  // Higieniza qualquer outro valor que contenha sublinhado
  return trimmed
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}

/**
 * Retorna as propriedades visuais da faixa de classificação (cor, badge, rótulo oficial).
 */
export function getFaixaVisual(faixa: string | null | undefined, isCoadjuvante = false) {
  if (isCoadjuvante) {
    return {
      label: 'Alimento Coadjuvante (Prescrição)',
      shortLabel: 'Coadjuvante',
      badgeClass: 'badge-tier badge-coadjuvante',
      color: '#4338ca',
      bgColor: '#eef2ff',
      borderColor: '#818cf8',
    };
  }

  const f = (faixa || '').toUpperCase();

  if (f === 'NIVEL_OURO' || f === 'SUPER_PREMIUM') {
    return {
      label: 'Nível Ouro — Padrão Superior',
      shortLabel: 'Nível Ouro',
      badgeClass: 'badge-tier badge-super-premium',
      color: '#065f46',
      bgColor: '#ecfdf5',
      borderColor: '#34d399',
    };
  }

  if (f === 'NIVEL_PRATA' || f === 'PREMIUM_ESPECIAL') {
    return {
      label: 'Nível Prata — Padrão Ótimo',
      shortLabel: 'Nível Prata',
      badgeClass: 'badge-tier badge-premium-especial',
      color: '#115e59',
      bgColor: '#f0fdfa',
      borderColor: '#2dd4bf',
    };
  }

  if (f === 'NIVEL_BRONZE' || f === 'ECONOMICO') {
    return {
      label: 'Nível Bronze — Padrão Regular',
      shortLabel: 'Nível Bronze',
      badgeClass: 'badge-tier badge-economico',
      color: '#92400e',
      bgColor: '#fffbeb',
      borderColor: '#fcd34d',
    };
  }

  return {
    label: 'Sob Observação — Parâmetro Limítrofe',
    shortLabel: 'Sob Observação',
    badgeClass: 'badge-tier badge-nao-conforme',
    color: '#991b1b',
    bgColor: '#fef2f2',
    borderColor: '#f87171',
  };
}
