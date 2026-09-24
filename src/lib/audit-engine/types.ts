/**
 * Tipos e Interfaces do Motor Determinístico de Análise Nutricional Pet Food
 * Revisão Terminológica: Substituição formal de "Auditoria" por "Análise de Rótulo"
 */

export type Especie = 'CAO' | 'GATO' | 'CAO_E_GATO';
export type FaseVida = 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR';
export type Porte = 'MINI_PEQUENO' | 'MEDIO_GRANDE' | 'TODOS';
export type TipoAlimento = 'SECO' | 'UMIDO';
export type CategoriaLegal = 'ALIMENTO_COMPLETO' | 'ALIMENTO_COADJUVANTE' | 'ALIMENTO_COMPLEMENTAR';

export type CondicaoClinica =
  | 'RENAL'
  | 'URINARIO'
  | 'OBESIDADE'
  | 'HEPATICO'
  | 'HIPOALERGENICO'
  | 'GASTROINTESTINAL'
  | 'CARDIOPATA'
  | 'DIABETES'
  | 'RECUPERACAO'
  | 'OUTRO';

export type FaixaClassificacao =
  | 'NIVEL_OURO'          // 90 a 100 pts: Nível Ouro (Padrão Superior)
  | 'NIVEL_PRATA'         // 75 a 89 pts: Nível Prata (Padrão Ótimo)
  | 'NIVEL_BRONZE'        // 60 a 74 pts: Nível Bronze (Padrão Regular / Econômico)
  | 'SOB_OBSERVACAO'      // Abaixo de 60 pts: Sob Observação (Parâmetro Limítrofe)
  // Aliases de retrocompatibilidade
  | 'SUPER_PREMIUM'
  | 'PREMIUM_ESPECIAL'
  | 'ECONOMICO'
  | 'NAO_CONFORME'
  | 'PARAMETRO_LIMITROFE';

export type AntioxidanteTipo = 'NATURAL' | 'SINTETICO' | 'MISTO';
export type ClaimCarneTipo = 'COM_CARNE_FRESCA' | 'COM_CARNE' | 'SABOR_CARNE' | 'NENHUM' | 'OUTRO';

/** Níveis de garantia expressos em Matéria Natural (MN) declarados no rótulo */
export interface GarantiasMN {
  umidadeMaxPct: number;
  proteinaBrutaMinPct: number;
  extratoEtereoMinPct: number;
  materiaFibrosaMaxPct: number;
  materiaMineralMaxPct: number;
  calcioMinPct: number;
  calcioMaxPct?: number | null;
  fosforoMinPct: number;
  sodioMinPct?: number | null;
  omega3MinPct?: number | null;
}

/** Níveis de garantia calculados em Matéria Seca (MS) */
export interface NutrientesMS {
  fatorMS: number; // Ex: 0.90 para 10% de umidade
  proteinaBrutaPct: number;
  extratoEtereoPct: number;
  calcioMinPct: number;
  calcioMaxPct?: number | null;
  fosforoMinPct: number;
  sodioMinPct?: number | null;
  omega3MinPct?: number | null;
}

/** Dados de rotulagem e composição para análise documental qualitativa */
export interface RotulagemAnaliseInput {
  topIngredientes: string[]; // Lista ordenada decrescente de ingredientes
  antioxidanteTipo: AntioxidanteTipo;
  omega3OuPrebioticosGarantidos: boolean;
  claimCarneTipo: ClaimCarneTipo;
  claimCarneAdequado?: boolean; // Se cumpre IN MAPA 30/2009
  foodType?: TipoAlimento;
}

/** Detalhe de cada pilar no Extrato da Análise de Rótulo */
export interface ExtratoPilarItem {
  pilar: 'Conformidade MS' | 'Balanço Ca:P' | 'Ingredientes Principais' | 'Transparência e Atributos' | 'Transparência e Aditivos';
  pontos_obtidos: number;
  pontos_max: number;
  justificativa: string;
}

/** Resultado consolidado da análise nutricional e conformidade de rótulo */
export interface AnaliseScoreResult {
  scoreTotal: number; // 0 a 100
  classificacaoFaixa: FaixaClassificacao;
  faixaNomeFormatado: string;
  extratoPontos: ExtratoPilarItem[];
  nutrientesMS: NutrientesMS;
  relacaoCaP: number;
  statusConformidade: 'CONFORME' | 'PARAMETRO_LIMITROFE' | 'COADJUVANTE';
  parecerSugerido: string;
}
