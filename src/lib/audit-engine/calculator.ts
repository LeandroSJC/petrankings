import {
  Especie,
  FaseVida,
  GarantiasMN,
  NutrientesMS,
  RotulagemAnaliseInput,
  AnaliseScoreResult,
  FaixaClassificacao,
  ExtratoPilarItem,
} from './types';
import { getAbinpetStandard } from './abinpet-standards';

/** Palavras-chave para identificação de fontes nobres e proteínas cárneas */
const PROTEINAS_ANIMAIS_REGEX =
  /(farinha\s+de\s+(v[ií]sceras|carne|frango|aves|peixe|salm[aã]o|cordeiro|peru|su[ií]no|torresmo))|(torresmo)|(plasma(\s+sangu[ií]neo)?(\s+desidratado)?)|(albumina(\s+de\s+ovo)?)|(prote[ií]na\s+(hidrolisada|isolada)\s+de\s+(su[ií]no|frango|aves|peixe|carne))|(carne\s+mecanicamente\s+separada)|(carne\s+(desidratada|fresca|bovina|de\s+frango|de\s+salm[aã]o|de\s+su[ií]no|de\s+cordeiro|de\s+peru|de\s+atum))|(peito\s+de\s+(frango|peru|aves))|(fil[eé]\s+de\s+(frango|salm[aã]o|peixe|atum))|((v[ií]sceras|mi[uú]dos|f[ií]gado|cora[cç][aã]o)\s+de\s+(aves|frango|bovino|su[ií]no|peru|peixe))|(ovo\s+em\s+p[oó])|(\b(salm[aã]o|atum|sardinha)\b)/i;

const CARBOIDRATOS_NOBRES_REGEX =
  /(arroz|quirera\s+de\s+arroz|arroz\s+integral|aveia|cevada|batata|batata-doce|mandioca|farinha\s+de\s+mandioca|lentilha|ervilha)/i;

const VEGETAIS_FARELOS_SECUNDARIOS_REGEX =
  /(milho|farelo\s+de\s+soja|farelo\s+de\s+trigo|gl[uú]ten\s+de\s+milho|subprodutos|casca\s+de\s+soja)/i;

/** Converte níveis de garantia de Matéria Natural (MN) para Matéria Seca (MS) */
export function calcularNutrientesMS(garantias: GarantiasMN): NutrientesMS {
  const umidade = Math.min(Math.max(garantias.umidadeMaxPct || 10, 0), 95);
  const fatorMS = (100 - umidade) / 100;
  const divisor = fatorMS > 0 ? fatorMS : 1;

  return {
    fatorMS,
    proteinaBrutaPct: Number((garantias.proteinaBrutaMinPct / divisor).toFixed(2)),
    extratoEtereoPct: Number((garantias.extratoEtereoMinPct / divisor).toFixed(2)),
    calcioMinPct: Number((garantias.calcioMinPct / divisor).toFixed(2)),
    calcioMaxPct: garantias.calcioMaxPct ? Number((garantias.calcioMaxPct / divisor).toFixed(2)) : null,
    fosforoMinPct: Number((garantias.fosforoMinPct / divisor).toFixed(2)),
    sodioMinPct: garantias.sodioMinPct ? Number((garantias.sodioMinPct / divisor).toFixed(2)) : null,
    omega3MinPct: garantias.omega3MinPct ? Number((garantias.omega3MinPct / divisor).toFixed(2)) : null,
  };
}

/** Executa a análise comparativa de rótulo de um produto e gera o índice determinístico */
export function calcularScoreAnaliseRotulo(
  especie: Especie,
  faseVida: FaseVida,
  garantias: GarantiasMN,
  rotulagem: RotulagemAnaliseInput
): AnaliseScoreResult {
  const standard = getAbinpetStandard(especie, faseVida);
  const ms = calcularNutrientesMS(garantias);
  const extrato: ExtratoPilarItem[] = [];

  // =========================================================================
  // PILAR 1: Conformidade Nutricional em Matéria Seca (40 pontos)
  // =========================================================================
  let pilar1Pontos = 0;
  let pilar1Justificativa = '';

  const pbOk = ms.proteinaBrutaPct >= standard.proteinaBrutaMinMS;
  const eeOk = ms.extratoEtereoPct >= standard.extratoEtereoMinMS;
  const caMinOk = ms.calcioMinPct >= standard.calcioMinMS;
  const caMaxOk = ms.calcioMaxPct ? ms.calcioMaxPct <= standard.calcioMaxSeguroMS : ms.calcioMinPct <= standard.calcioMaxSeguroMS;
  const pMinOk = ms.fosforoMinPct >= standard.fosforoMinMS;
  const pMaxOk = ms.fosforoMinPct <= standard.fosforoMaxSeguroMS;

  const atendePisosLegais = pbOk && eeOk && caMinOk && caMaxOk && pMinOk && pMaxOk;

  if (!atendePisosLegais) {
    pilar1Pontos = 0;
    pilar1Justificativa =
      'Nutrientes essenciais em Matéria Seca abaixo do piso ou acima do teto de segurança da ABINPET / MAPA.';
  } else {
    // Verifica margem de segurança industrial
    const pbComMargem = ms.proteinaBrutaPct >= standard.proteinaBrutaMargemSegurancaMS;
    const eeComMargem = ms.extratoEtereoPct >= standard.extratoEtereoMargemSegurancaMS;

    if (pbComMargem && eeComMargem) {
      pilar1Pontos = 40;
      pilar1Justificativa =
        'Todos os nutrientes (Proteína Bruta, Extrato Etéreo, Cálcio e Fósforo) atendem com margem técnica de segurança na MS.';
    } else {
      pilar1Pontos = 20;
      pilar1Justificativa =
        'Atinge os pisos legais mínimos da ABINPET em MS, porém no limite estrito sem margem de segurança industrial.';
    }
  }

  extrato.push({
    pilar: 'Conformidade MS',
    pontos_obtidos: pilar1Pontos,
    pontos_max: 40,
    justificativa: pilar1Justificativa,
  });

  // =========================================================================
  // PILAR 2: Balanço Cálcio : Fósforo (Ca:P) (20 pontos)
  // =========================================================================
  const fosforoBase = garantias.fosforoMinPct > 0 ? garantias.fosforoMinPct : 0.01;
  const relacaoCaP = Number((garantias.calcioMinPct / fosforoBase).toFixed(2));
  let pilar2Pontos = 0;
  let pilar2Justificativa = '';

  if (relacaoCaP >= standard.relacaoCaPIdealMin && relacaoCaP <= standard.relacaoCaPIdealMax) {
    pilar2Pontos = 20;
    pilar2Justificativa = `Relação Ca:P calculada em ${relacaoCaP}:1 (faixa ideal e segura: ${standard.relacaoCaPIdealMin}:1 a ${standard.relacaoCaPIdealMax}:1).`;
  } else if (relacaoCaP >= standard.relacaoCaPToleranciaMin && relacaoCaP <= standard.relacaoCaPToleranciaMax) {
    pilar2Pontos = 10;
    pilar2Justificativa = `Relação Ca:P calculada em ${relacaoCaP}:1 (faixa aceitável de tolerância: 1,0:1 até 2,0:1).`;
  } else {
    pilar2Pontos = 0;
    pilar2Justificativa = `Relação Ca:P calculada em ${relacaoCaP}:1 (desbalanceada com risco nutricional: < 1,0:1 ou > 2,0:1).`;
  }

  extrato.push({
    pilar: 'Balanço Ca:P',
    pontos_obtidos: pilar2Pontos,
    pontos_max: 20,
    justificativa: pilar2Justificativa,
  });

  // =========================================================================
  // PILAR 3: Qualidade Declarada dos Ingredientes Principais (25 pontos)
  // =========================================================================
  let pilar3Pontos = 0;
  const ing1 = rotulagem.topIngredientes[0] || '';
  const ing2 = rotulagem.topIngredientes[1] || '';

  const ing1IsAnimal = PROTEINAS_ANIMAIS_REGEX.test(ing1);
  const ing2IsAnimal = PROTEINAS_ANIMAIS_REGEX.test(ing2);
  const ing2IsCarbNobre = CARBOIDRATOS_NOBRES_REGEX.test(ing2);

  let ing1Texto = '';
  let ing2Texto = '';

  if (ing1IsAnimal) {
    pilar3Pontos += 15;
    ing1Texto = '1º ingrediente é proteína cárnea de alta digestibilidade (+15)';
  } else {
    const isVegetal = VEGETAIS_FARELOS_SECUNDARIOS_REGEX.test(ing1);
    ing1Texto = isVegetal
      ? '1º ingrediente de origem vegetal ou farelos secundários (+0)'
      : '1º ingrediente não cárneo (+0)';
  }

  if (ing2IsAnimal || ing2IsCarbNobre) {
    pilar3Pontos += 10;
    ing2Texto = '2º ingrediente nobre/animal declarado (+10)';
  } else {
    ing2Texto = '2º ingrediente de menor aproveitamento biológico (+0)';
  }

  extrato.push({
    pilar: 'Ingredientes Principais',
    pontos_obtidos: pilar3Pontos,
    pontos_max: 25,
    justificativa: `${ing1Texto}; ${ing2Texto}.`,
  });

  // =========================================================================
  // PILAR 4: Transparência e Atributos Funcionais Declarados (15 pontos)
  // =========================================================================
  let pilar4Pontos = 0;
  const justificativasPilar4: string[] = [];

  // Conservantes Naturais (+5)
  if (rotulagem.antioxidanteTipo === 'NATURAL') {
    pilar4Pontos += 5;
    justificativasPilar4.push('Conservantes 100% naturais sem BHA/BHT (+5)');
  } else {
    justificativasPilar4.push('Uso de conservantes sintéticos BHA/BHT (+0)');
  }

  // Ômega-3 ou Prebióticos (+5)
  const temOmegaOuPrebiotico =
    rotulagem.omega3OuPrebioticosGarantidos ||
    (garantias.omega3MinPct !== undefined && garantias.omega3MinPct !== null && garantias.omega3MinPct >= 0.2);

  if (temOmegaOuPrebiotico) {
    pilar4Pontos += 5;
    justificativasPilar4.push('Inclusão garantida de Ômega-3 funcional ou prebióticos (+5)');
  } else {
    justificativasPilar4.push('Sem garantia expressa de Ômega-3 funcional ou prebióticos (+0)');
  }

  // Aderência a Claims (+5)
  const claimConforme = rotulagem.claimCarneAdequado !== false;
  if (claimConforme) {
    pilar4Pontos += 5;
    justificativasPilar4.push('Estrita conformidade dos claims comerciais declarados (+5)');
  } else {
    justificativasPilar4.push('Inconsistência nos claims comerciais do painel principal (+0)');
  }

  extrato.push({
    pilar: 'Transparência e Atributos',
    pontos_obtidos: pilar4Pontos,
    pontos_max: 15,
    justificativa: justificativasPilar4.join('. ') + '.',
  });

  // =========================================================================
  // TOTALIZAÇÃO E FAIXA DE CLASSIFICAÇÃO
  // =========================================================================
  const scoreTotal = pilar1Pontos + pilar2Pontos + pilar3Pontos + pilar4Pontos;

  let classificacaoFaixa: FaixaClassificacao = 'PARAMETRO_LIMITROFE';
  let faixaNomeFormatado = 'Atenção / Parâmetro Limítrofe';

  if (scoreTotal >= 90) {
    classificacaoFaixa = 'NIVEL_OURO';
    faixaNomeFormatado = 'Nível Ouro — Padrão Superior';
  } else if (scoreTotal >= 75) {
    classificacaoFaixa = 'NIVEL_PRATA';
    faixaNomeFormatado = 'Nível Prata — Padrão Ótimo';
  } else if (scoreTotal >= 60) {
    classificacaoFaixa = 'NIVEL_BRONZE';
    faixaNomeFormatado = 'Nível Bronze — Padrão Regular';
  } else {
    classificacaoFaixa = 'SOB_OBSERVACAO';
    faixaNomeFormatado = 'Sob Observação — Parâmetros Limítrofes';
  }

  let parecerSugerido = '';
  if (scoreTotal >= 90) {
    parecerSugerido =
      'Alimento com excelente equilíbrio nutricional declarado na Matéria Seca, primeiro ingrediente de alta digestibilidade animal e conservantes 100% naturais.';
  } else if (scoreTotal >= 75) {
    parecerSugerido =
      'Alimento nutricionalmente completo e estável, atendendo com folga às diretrizes da ABINPET e boas práticas de rotulagem.';
  } else if (scoreTotal >= 60) {
    parecerSugerido =
      'Cumpre os parâmetros científicos de nutrição recomendados pela ABINPET, apresentando formulação básica de manutenção.';
  } else {
    parecerSugerido =
      'Apresenta inconsistências nas informações do rótulo, desequilíbrio mineral ou nutrientes abaixo das recomendações da ABINPET.';
  }

  return {
    scoreTotal,
    classificacaoFaixa,
    faixaNomeFormatado,
    extratoPontos: extrato,
    nutrientesMS: ms,
    relacaoCaP,
    statusConformidade: scoreTotal >= 60 ? 'CONFORME' : 'PARAMETRO_LIMITROFE',
    parecerSugerido,
  };
}

/**
 * Estimativa de Energia Metabolizável (EM) — Método NRC / ABINPET (Seção 3.2 do DRS 8.0)
 * Retorna EM estimada em kcal/kg de Matéria Natural (MN).
 */
export function calcularEnergiaMetabolizavel(
  especie: Especie,
  umidadeMaxPct: number,
  pbMinPct: number,
  eeMinPct: number,
  fbMaxPct: number,
  mmMaxPct: number
): {
  ennPct: number;
  ebKcalKg: number;
  cdePct: number;
  edKcalKg: number;
  emKcalKg: number;
} {
  const umidade = Math.min(Math.max(umidadeMaxPct || 10, 0), 95);
  const fatorMS = (100 - umidade) / 100;
  const divisor = fatorMS > 0 ? fatorMS : 1;

  // 1. Extrativos Não-Nitrogenados (ENN %)
  const ennPct = Math.max(0, 100 - (umidade + pbMinPct + eeMinPct + fbMaxPct + mmMaxPct));

  // Conversão de % para g/kg (multiplica por 10)
  const pbGkg = pbMinPct * 10;
  const eeGkg = eeMinPct * 10;
  const fbGkg = fbMaxPct * 10;
  const ennGkg = ennPct * 10;

  // 2. Energia Bruta (EB em kcal/kg de MN)
  const ebKcalKg = (5.7 * pbGkg) + (9.4 * eeGkg) + (4.1 * (ennGkg + fbGkg));

  // % Fibra Bruta na Matéria Seca
  const fbMS = fbMaxPct / divisor;

  // 3. Coeficiente de Digestibilidade da Energia (CDE %)
  let cdePct = 0;
  if (especie === 'CAO') {
    cdePct = 91.2 - (1.43 * fbMS);
  } else {
    cdePct = 87.9 - (0.88 * fbMS);
  }
  cdePct = Math.min(Math.max(cdePct, 50), 95);

  // 4. Energia Digestível (ED em kcal/kg)
  const edKcalKg = ebKcalKg * (cdePct / 100);

  // 5. Energia Metabolizável (EM em kcal/kg de MN)
  let emKcalKg = 0;
  if (especie === 'CAO') {
    emKcalKg = edKcalKg - (1.04 * pbGkg);
  } else {
    emKcalKg = edKcalKg - (0.77 * pbGkg);
  }

  return {
    ennPct: Number(ennPct.toFixed(2)),
    ebKcalKg: Math.round(ebKcalKg),
    cdePct: Number(cdePct.toFixed(1)),
    edKcalKg: Math.round(edKcalKg),
    emKcalKg: Math.round(emKcalKg),
  };
}

