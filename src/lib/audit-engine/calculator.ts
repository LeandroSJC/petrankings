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
const CARNE_E_OSSOS_REGEX = /farinha\s+de\s+(?:carne\s+e\s+ossos?|ossos?|subprodutos)/i;
const PALATABILIZANTE_REGEX = /^(?:hidrolisado\s+de\s+(?:f[ií]gado|aves|su[ií]no|frango)|palatabilizante|digest)\b/i;
const CMS_OU_CARCACA_REGEX = /(?:carne\s+mecanicamente\s+separada|\bcms\b|carca[cç]a|pesco[çc]o|cabe[cç]a\s+de\s+frango)/i;
const LIPIDEOS_FUNCIONAIS_NOBRES_REGEX = /(?:[óo]leo\s+de\s+(?:peixe|salm[aã]o|linha[cç]a|frango)|gordura\s+de\s+frango)/i;
const EXTENSORES_VEGETAIS_UMIDO_REGEX = /(?:gl[uú]ten\s+de\s+trigo|prote[íi]na\s+(?:concentrada|isolada)\s+de\s+soja|amido|dextrose|farinha\s+de\s+trigo)/i;
const ADITIVOS_CORANTES_ACUCARES_REGEX = /(?:corante|caramelo|dextrose|xarope|a[cç][uú]car|sacarose|glicose)/i;

const PROTEINAS_NOBRES_REGEX =
  /(farinha\s+de\s+(?:v[ií]sceras|frango|aves|peixe|salm[aã]o|cordeiro|peru|su[ií]no|torresmo|til[aá]pia|bacalhau|truta|pato))|(torresmo)|(plasma(\s+sangu[ií]neo)?(\s+desidratado)?)|(albumina(\s+de\s+ovo)?)|(prote[ií]na\s+(?:hidrolisada|isolada|concentrada)?\s*(?:de|animal)?\s*(?:su[ií]no|frango|aves|peixe|carne|salm[aã]o|soro|leite))|((?<!aroma\s+(?:de\s+)?|sabor\s+(?:de\s+)?)\bcarne\b)|(\b(?:fil[eé]|peito|peda[cç]os?|iscas?|lombinho)\s+de\s+[a-zÀ-ÿ]+)|(ovo\s+(?:em\s+p[oó]|desidratado|integral)?)|((?<![óo]leo\s+de\s+|gordura\s+de\s+|aroma\s+(?:de\s+)?|sabor\s+(?:de\s+)?)\b(?:til[aá]pia|peixe|peixes|peixe-branco|salm[aã]o|atum|sardinha|arenque|bacalhau|truta)\b)/i;

const PROTEINAS_ANIMAIS_REGEX =
  /(farinha\s+de\s+(?:v[ií]sceras|carne|frango|aves|peixe|salm[aã]o|cordeiro|peru|su[ií]no|torresmo|til[aá]pia|bacalhau|truta|pato|bovino))|(torresmo)|(plasma(\s+sangu[ií]neo)?(\s+desidratado)?)|(albumina(\s+de\s+ovo)?)|(prote[ií]na\s+(?:hidrolisada|isolada|concentrada)?\s*(?:de|animal)?\s*(?:su[ií]no|frango|aves|peixe|carne|salm[aã]o|soro|leite))|(hidrolisado\s+de\s+(?:f[ií]gado|v[ií]sceras|frango|aves|peixe|su[ií]no|bovino|carne))|((?<!aroma\s+(?:de\s+)?|sabor\s+(?:de\s+)?)\bcarne\b)|(\b(?:fil[eé]|peito|peda[cç]os?|iscas?|lombinho|carca[cç]a|pesco[çc]o|dorso|moela|pulm[aã]o|rim|cora[cç][aã]o|f[ií]gado|mi[uú]dos|v[ií]sceras)\s+de\s+[a-zÀ-ÿ]+)|(ovo\s+(?:em\s+p[oó]|desidratado|integral)?)|((?<![óo]leo\s+de\s+|gordura\s+de\s+|aroma\s+(?:de\s+)?|sabor\s+(?:de\s+)?)\b(?:til[aá]pia|peixe|peixes|peixe-branco|salm[aã]o|atum|sardinha|arenque|bacalhau|truta|merluza|pescada|linguado|anchova|cavala|camar[aã]o|caranguejo|siri|lula|polvo|marisco|mexilh[aã]o)\b)/i;

const CARBOIDRATOS_NOBRES_REGEX =
  /(arroz|quirera\s+de\s+arroz|arroz\s+integral|aveia|cevada|batata|batata-doce|mandioca|farinha\s+de\s+mandioca|lentilha|ervilha)/i;

const VEGETAIS_FARELOS_SECUNDARIOS_REGEX =
  /(milho|farelo\s+de\s+soja|farelo\s+de\s+trigo|gl[uú]ten\s+de\s+milho|subprodutos|casca\s+de\s+soja)/i;

/** Veículos líquidos de cocção e hidratação de alimentos úmidos (IN MAPA 30/2009) */
const VEICULO_LIQUIDO_REGEX = /^(água|agua|caldo)\b/i;

/** Converte níveis de garantia de Matéria Natural (MN) para Matéria Seca (MS) */
export function calcularNutrientesMS(garantias: GarantiasMN): NutrientesMS {
  const umidade = Math.min(Math.max(garantias.umidadeMaxPct ?? 10, 0), 95);
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
  rotulagem: RotulagemAnaliseInput,
  foodTypeParam?: 'SECO' | 'UMIDO'
): AnaliseScoreResult {
  const foodType = foodTypeParam || rotulagem.foodType || 'SECO';
  const isLight =
    rotulagem.isLightOuControlePeso ??
    (rotulagem.nomeComercial
      ? /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(
          rotulagem.nomeComercial
        )
      : false);
  const standard = getAbinpetStandard(especie, faseVida, foodType, isLight);
  const ms = calcularNutrientesMS(garantias);
  const extrato: ExtratoPilarItem[] = [];

  // =========================================================================
  // PILAR 1: Conformidade Bromatológica em Matéria Seca (40 pontos)
  // Ancoragem: Manual ABINPET 11ª Ed., IN MAPA nº 34/2008 e FEDIAF 2025
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
      foodType === 'UMIDO'
        ? 'Nutrientes essenciais em Matéria Seca abaixo do piso ou acima do teto de segurança da ABINPET / FEDIAF / MAPA.'
        : 'Nutrientes essenciais em Matéria Seca abaixo do piso ou acima do teto de segurança da ABINPET / MAPA.';
  } else {
    // 1. Base por Densidade Proteica e Lipídica
    let basePontos = 20;
    if (ms.proteinaBrutaPct >= standard.proteinaBrutaSuperPremiumMS && ms.extratoEtereoPct >= standard.extratoEtereoMargemSegurancaMS) {
      basePontos = 40; // Super Premium / Alta Performance
    } else if (ms.proteinaBrutaPct >= standard.proteinaBrutaMargemSegurancaMS && ms.extratoEtereoPct >= standard.extratoEtereoMargemSegurancaMS) {
      basePontos = 30; // Manutenção Básica / Perfil Regular
    } else {
      basePontos = 20; // Piso estrito de manutenção legal
    }

    // 2. Penalidades Bromatológicas (Cinzas e Limítrofes)
    let penalidades = 0;
    const notasPenalidades: string[] = [];
    const umidade = garantias.umidadeMaxPct ?? (foodType === 'UMIDO' ? 82 : 10);
    const divisor = (100 - umidade) / 100;
    const mineralMS = Number(((garantias.materiaMineralMaxPct ?? 0) / (divisor > 0 ? divisor : 1)).toFixed(2));

    // Excesso de Cinzas / Matéria Mineral conforme IN MAPA nº 34/2008 e FEDIAF 2025
    if (mineralMS > standard.materiaMineralTetoSeguroMS) {
      penalidades += 10;
      notasPenalidades.push(`Cinzas elevadas (${mineralMS}% MS > ${standard.materiaMineralTetoSeguroMS}% máx) indicando fração óssea excessiva (-10)`);
    } else if (mineralMS > standard.materiaMineralNobreLowAshMS) {
      penalidades += 5;
      notasPenalidades.push(`Cinzas moderadas (${mineralMS}% MS fora do padrão Low Ash <= ${standard.materiaMineralNobreLowAshMS}%) (-5)`);
    }

    // Cálcio máximo na faixa limítrofe do teto seguro (>= 92% do teto)
    if (ms.calcioMaxPct && ms.calcioMaxPct >= standard.calcioMaxSeguroMS * 0.92) {
      penalidades += 5;
      notasPenalidades.push(`Cálcio máximo (${ms.calcioMaxPct}% MS) na faixa limítrofe do teto toxicológico (-5)`);
    }

    // Alerta de Sódio em animais seniores (WALTHAM / NRC 2006)
    if (faseVida === 'SENIOR' && ms.sodioMinPct != null && ms.sodioMinPct > 0.50) {
      penalidades += 5;
      notasPenalidades.push(`Sódio (${ms.sodioMinPct}% MS) elevado para nutrição de animais idosos (-5)`);
    }

    pilar1Pontos = Math.max(basePontos - penalidades, 15);

    if (penalidades === 0) {
      pilar1Justificativa = isLight
        ? 'Todos os nutrientes essenciais atendem com margem técnica de segurança aos parâmetros da ABINPET e diretrizes FEDIAF/NRC para dietas de controle calórico em MS.'
        : foodType === 'UMIDO'
        ? 'Todos os nutrientes (Proteína Bruta, Extrato Etéreo, Cálcio e Fósforo) atendem aos parâmetros ABINPET e diretrizes FEDIAF/NRC para alimentos úmidos com margem técnica de segurança na MS.'
        : `Excelente adequação bromatológica na Matéria Seca (PB: ${ms.proteinaBrutaPct}% MS, Cinzas: ${mineralMS}% MS).`;
    } else {
      pilar1Justificativa = `Base proteica (${basePontos} pts) com ajustes bromatológicos: ${notasPenalidades.join('; ')}.`;
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
  // Ancoragem: Manual ABINPET Tabela 2 e FEDIAF 2025
  // =========================================================================
  const fosforoBase = garantias.fosforoMinPct > 0 ? garantias.fosforoMinPct : 0.01;
  const relacaoCaPMin = Number((garantias.calcioMinPct / fosforoBase).toFixed(2));
  const relacaoCaPMax = garantias.calcioMaxPct ? Number((garantias.calcioMaxPct / fosforoBase).toFixed(2)) : relacaoCaPMin;

  let pilar2Pontos = 0;
  let pilar2Justificativa = '';

  const ideal = relacaoCaPMin >= standard.relacaoCaPIdealMin && relacaoCaPMin <= standard.relacaoCaPIdealMax;
  const tolerancia = relacaoCaPMin >= standard.relacaoCaPToleranciaMin && relacaoCaPMin <= standard.relacaoCaPToleranciaMax;

  if (ideal && relacaoCaPMax <= standard.relacaoCaPToleranciaMax) {
    pilar2Pontos = 20;
    pilar2Justificativa = `Relação Ca:P ideal calculada em ${relacaoCaPMin}:1 (faixa de segurança: ${standard.relacaoCaPIdealMin}:1 a ${standard.relacaoCaPIdealMax}:1) estável até o teto declarado (${relacaoCaPMax}:1).`;
  } else if (ideal && relacaoCaPMax > standard.relacaoCaPToleranciaMax) {
    pilar2Pontos = 10;
    pilar2Justificativa = `Relação Ca:P no piso de ${relacaoCaPMin}:1 atende, porém a amplitude máxima declarada de cálcio pode atingir até ${relacaoCaPMax}:1 com risco de desbalanço.`;
  } else if (tolerancia) {
    pilar2Pontos = 10;
    pilar2Justificativa = `Relação Ca:P calculada em ${relacaoCaPMin}:1 (faixa aceitável de tolerância: 1,0:1 até 2,0:1).`;
  } else {
    pilar2Pontos = 0;
    pilar2Justificativa = `Relação Ca:P calculada em ${relacaoCaPMin}:1 (desbalanceada com risco nutricional: < 1,0:1 ou > 2,0:1).`;
  }

  extrato.push({
    pilar: 'Balanço Ca:P',
    pontos_obtidos: pilar2Pontos,
    pontos_max: 20,
    justificativa: pilar2Justificativa,
  });

  // =========================================================================
  // PILAR 3: Qualidade Declarada dos Ingredientes Principais (25 pontos)
  // Ancoragem: IN MAPA nº 22/2009 (ordem decrescente) e IN MAPA nº 34/2008 (farinhas)
  // =========================================================================
  let pilar3Pontos = 0;

  // Em alimentos úmidos, a água/caldo é veículo físico obrigatório de cocção (IN MAPA 30/2009).
  // Filtramos os veículos líquidos para avaliar os 2 primeiros ingredientes nutritivos reais.
  const ingredientesParaAnalise = foodType === 'UMIDO'
    ? rotulagem.topIngredientes.filter((ing) => !VEICULO_LIQUIDO_REGEX.test(ing.trim()))
    : rotulagem.topIngredientes;

  const ing1 = ingredientesParaAnalise[0] || '';
  const ing2 = ingredientesParaAnalise[1] || '';

  const prefixoUmido = foodType === 'UMIDO' ? ' (desconsiderando a água de cocção exigida pelo MAPA)' : '';

  // 1º Ingrediente Nutritivo
  const ing1IsCMS = CMS_OU_CARCACA_REGEX.test(ing1);
  const ing1IsNobre = PROTEINAS_NOBRES_REGEX.test(ing1) && !CARNE_E_OSSOS_REGEX.test(ing1) && !ing1IsCMS;
  const ing1IsCarneOssos = CARNE_E_OSSOS_REGEX.test(ing1);
  const ing1IsOutraAnimal = PROTEINAS_ANIMAIS_REGEX.test(ing1) || ing1IsCMS;

  let ing1Texto = '';
  if (ing1IsNobre) {
    pilar3Pontos += 15;
    ing1Texto = `1º ingrediente nutritivo${prefixoUmido} é proteína cárnea nobre de alta digestibilidade (${ing1}) (+15)`;
  } else if (ing1IsCarneOssos) {
    pilar3Pontos += 8;
    ing1Texto = `1º ingrediente nutritivo${prefixoUmido} é proteína animal com alta fração óssea/cinzas (${ing1}) (+8)`;
  } else if (ing1IsCMS) {
    pilar3Pontos += 10;
    ing1Texto = `1º ingrediente nutritivo${prefixoUmido} é carne mecanicamente separada (CMS/carcaça) de menor valor biológico (${ing1}) (+10)`;
  } else if (ing1IsOutraAnimal) {
    pilar3Pontos += 10;
    ing1Texto = `1º ingrediente nutritivo${prefixoUmido} é proteína animal de aproveitamento intermediário (${ing1}) (+10)`;
  } else {
    const isVegetal = VEGETAIS_FARELOS_SECUNDARIOS_REGEX.test(ing1);
    ing1Texto = isVegetal
      ? `1º ingrediente nutritivo${prefixoUmido} de origem vegetal ou farelos secundários (${ing1}) (+0)`
      : `1º ingrediente nutritivo${prefixoUmido} não cárneo (${ing1}) (+0)`;
  }

  // 2º Ingrediente Nutritivo
  const ing2IsCMS = CMS_OU_CARCACA_REGEX.test(ing2);
  const ing2IsNobre = PROTEINAS_NOBRES_REGEX.test(ing2) && !CARNE_E_OSSOS_REGEX.test(ing2) && !PALATABILIZANTE_REGEX.test(ing2) && !ing2IsCMS;
  const ing2IsCarbNobre = CARBOIDRATOS_NOBRES_REGEX.test(ing2);
  const ing2IsLipideoNobre = LIPIDEOS_FUNCIONAIS_NOBRES_REGEX.test(ing2);
  const ing2IsPalatabilizante = PALATABILIZANTE_REGEX.test(ing2);
  const ing2IsCarneOssos = CARNE_E_OSSOS_REGEX.test(ing2);
  const ing2IsOutraAnimal = PROTEINAS_ANIMAIS_REGEX.test(ing2) || ing2IsCMS;

  let ing2Texto = '';
  if (ing2IsNobre) {
    pilar3Pontos += 10;
    ing2Texto = `2º ingrediente nutritivo é fonte proteica animal nobre (${ing2}) (+10)`;
  } else if (ing2IsCarbNobre) {
    pilar3Pontos += 10;
    ing2Texto = `2º ingrediente nutritivo é carboidrato nobre de alta digestibilidade (${ing2}) (+10)`;
  } else if (ing2IsLipideoNobre) {
    pilar3Pontos += 10;
    ing2Texto = `2º ingrediente nutritivo é fonte lipídica nobre e ácidos graxos essenciais (${ing2}) (+10)`;
  } else if (ing2IsPalatabilizante) {
    pilar3Pontos += 4;
    ing2Texto = `2º ingrediente (${ing2}) é aditivo sensorial/palatabilizante (1% a 2%) sem volume estrutural de massa proteica (+4)`;
  } else if (ing2IsCarneOssos) {
    pilar3Pontos += 5;
    ing2Texto = `2º ingrediente é proteína com alta fração óssea (${ing2}) (+5)`;
  } else if (ing2IsCMS) {
    pilar3Pontos += 7;
    ing2Texto = `2º ingrediente é carne mecanicamente separada (CMS/carcaça) (+7)`;
  } else if (ing2IsOutraAnimal) {
    pilar3Pontos += 7;
    ing2Texto = `2º ingrediente é fonte proteica animal secundária (${ing2}) (+7)`;
  } else {
    ing2Texto = `2º ingrediente nutritivo (${ing2 || 'não declarado'}) de menor aproveitamento biológico (+0)`;
  }

  // Detecção de Fracionamento de Grãos ("Splitting de Ingredientes" - IN MAPA nº 22/2009)
  const top5 = ingredientesParaAnalise.slice(0, 5);
  const milhoFractions = top5.filter((ing) => /milho|gl[uú]ten\s+de\s+milho|quirera\s+de\s+milho/i.test(ing)).length;
  const trigoFractions = top5.filter((ing) => /trigo|farelo\s+de\s+trigo|farinha\s+de\s+trigo/i.test(ing)).length;
  const sojaFractions = top5.filter((ing) => /soja|farelo\s+de\s+soja|casca\s+de\s+soja/i.test(ing)).length;

  let splittingTexto = '';
  if (milhoFractions >= 2 || trigoFractions >= 2 || sojaFractions >= 2) {
    pilar3Pontos = Math.max(pilar3Pontos - 3, 0);
    splittingTexto = '; Detecção de fracionamento de grãos (splitting) entre os 5 primeiros ingredientes (-3)';
  }

  // Detecção de Extensores Vegetais em Alimentos Úmidos (pedaços reconstituídos TVP)
  let extensoresTexto = '';
  if (foodType === 'UMIDO') {
    const top8 = ingredientesParaAnalise.slice(0, 8);
    const extensores = top8.filter((ing) => EXTENSORES_VEGETAIS_UMIDO_REGEX.test(ing));
    if (extensores.length >= 1) {
      pilar3Pontos = Math.max(pilar3Pontos - 5, 0);
      extensoresTexto = `; Detecção de extensores/aglutinantes vegetais (${extensores.slice(0, 2).join(', ')}) caracterizando pedaços reconstituídos (-5)`;
    }
  }

  extrato.push({
    pilar: 'Ingredientes Principais',
    pontos_obtidos: pilar3Pontos,
    pontos_max: 25,
    justificativa: `${ing1Texto}; ${ing2Texto}${splittingTexto}${extensoresTexto}.`,
  });

  // =========================================================================
  // PILAR 4: Transparência, Conservantes e Atributos Funcionais (15 pontos)
  // Ancoragem: Decreto nº 4.680/2003 (OGM), IN MAPA nº 110/2020 e Portaria MJ nº 2.658/2003
  // =========================================================================
  let pilar4Pontos = 0;
  const justificativasPilar4: string[] = [];

  // 1. Conservantes Naturais (+5)
  const temCoranteOuAcucarEmUmido =
    foodType === 'UMIDO' &&
    rotulagem.topIngredientes.some((ing) => ADITIVOS_CORANTES_ACUCARES_REGEX.test(ing));

  if (rotulagem.antioxidanteTipo === 'NATURAL' && !temCoranteOuAcucarEmUmido) {
    pilar4Pontos += 5;
    justificativasPilar4.push('Conservantes 100% naturais sem BHA/BHT (+5)');
  } else if (temCoranteOuAcucarEmUmido) {
    justificativasPilar4.push('Alimento úmido com presença declarada de corantes (caramelo) ou açúcares (+0)');
  } else {
    justificativasPilar4.push('Uso de conservantes sintéticos BHA/BHT (+0)');
  }

  // 2. Livre de Transgênicos (+5) - Decreto Federal nº 4.680/2003
  const isLivreGmo = rotulagem.containsGmo === false;
  if (isLivreGmo) {
    pilar4Pontos += 5;
    justificativasPilar4.push('Fórmula livre de transgênicos sem o símbolo triangular "T" (+5)');
  } else {
    justificativasPilar4.push('Presença declarada de ingredientes transgênicos (+0)');
  }

  // 3. Ômega-3 Funcional ou Prebióticos (+5)
  const PREBIOTICOS_REGEX =
    /(parede\s+celular\s+de\s+levedura|mananoligossacar[ií]deo|frutooligossacar[ií]deo|\bmos\b|\bfos\b|inulina|beta-?glucan)/i;
  const temPrebioticoNosIngredientes = rotulagem.topIngredientes.some((ing) => PREBIOTICOS_REGEX.test(ing));

  const temOmegaGarantido =
    garantias.omega3MinPct !== undefined &&
    garantias.omega3MinPct !== null &&
    (foodType === 'UMIDO'
      ? garantias.omega3MinPct >= 0.015 || (ms.omega3MinPct != null && ms.omega3MinPct >= 0.1)
      : garantias.omega3MinPct >= 0.2);

  const temOmegaOuPrebiotico =
    rotulagem.omega3OuPrebioticosGarantidos ||
    temOmegaGarantido ||
    temPrebioticoNosIngredientes;

  if (temOmegaOuPrebiotico) {
    pilar4Pontos += 5;
    justificativasPilar4.push('Inclusão garantida de Ômega-3 funcional ou prebióticos (+5)');
  } else {
    justificativasPilar4.push('Sem garantia expressa de Ômega-3 funcional ou prebióticos (+0)');
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
      'Apresenta inconsistências nas informações do rótulo, excesso de matéria mineral ou parâmetros limítrofes na literatura científica.';
  }

  return {
    scoreTotal,
    classificacaoFaixa,
    faixaNomeFormatado,
    extratoPontos: extrato,
    nutrientesMS: ms,
    relacaoCaP: relacaoCaPMin,
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
  const umidade = Math.min(Math.max(umidadeMaxPct ?? 10, 0), 95);
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
  } else if (especie === 'GATO') {
    cdePct = 87.9 - (0.88 * fbMS);
  } else {
    // CAO_E_GATO: média ponderada fisiológica de digestibilidade
    cdePct = ((91.2 - (1.43 * fbMS)) + (87.9 - (0.88 * fbMS))) / 2;
  }
  cdePct = Math.min(Math.max(cdePct, 50), 95);

  // 4. Energia Digestível (ED em kcal/kg)
  const edKcalKg = ebKcalKg * (cdePct / 100);

  // 5. Energia Metabolizável (EM em kcal/kg de MN)
  let emKcalKg = 0;
  if (especie === 'CAO') {
    emKcalKg = edKcalKg - (1.04 * pbGkg);
  } else if (especie === 'GATO') {
    emKcalKg = edKcalKg - (0.77 * pbGkg);
  } else {
    // CAO_E_GATO: média de perda energética urinária
    emKcalKg = edKcalKg - (0.905 * pbGkg);
  }

  return {
    ennPct: Number(ennPct.toFixed(2)),
    ebKcalKg: Math.round(ebKcalKg),
    cdePct: Number(cdePct.toFixed(1)),
    edKcalKg: Math.round(edKcalKg),
    emKcalKg: Math.round(emKcalKg),
  };
}

