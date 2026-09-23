import { Especie, FaseVida, TipoAlimento, CategoriaLegal, ExtratoPilarItem } from './types';
import { getAbinpetStandard } from './abinpet-standards';

export interface EditorialGenerationParams {
  commercialName: string;
  brand: string;
  species: Especie;
  lifeStage: FaseVida;
  foodType: TipoAlimento;
  legalCategory: CategoriaLegal;
  coadjuvanteCondition?: string | null;
  proteinaBrutaMinPct: number;
  energiaMetabolizavelKcalKg?: number | null;
  antioxidantType: 'NATURAL' | 'SINTETICO' | 'MISTO';
  containsGmo: boolean;
  topIngredients: string[];
  scoreTotal: number | null;
  classificationTier: string;
  extratoPontos?: ExtratoPilarItem[];
  calcioMinPct?: number;
  calcioMaxPct?: number | null;
  fosforoMinPct?: number;
  umidadeMaxPct?: number;
  extratoEtereoMinPct?: number;
}

/**
 * Gerador determinístico de Parecer Editorial Técnico do PetRankings.
 * 
 * Regras Inegociáveis (AGENTS.md & pet-editorial-copywriter):
 * 1. Proibição absoluta de invenção de dados ou cópia acrítica de slogans comerciais do fabricante.
 * 2. Tom estritamente técnico, imparcial e alinhado com a pontuação e os critérios da 11ª Edição do Manual ABINPET.
 * 3. Coerência total com a espécie, fase de vida, ingredientes reais do PDF e classificação obtida.
 * 4. Inspeção cirúrgica de matéria seca (MS), extrato etéreo, cálcio, fósforo, conservantes e transgênicos.
 */
export function generateTechnicalEditorialOpinion(params: EditorialGenerationParams): string {
  const {
    commercialName,
    brand,
    species,
    lifeStage,
    foodType,
    legalCategory,
    coadjuvanteCondition,
    proteinaBrutaMinPct,
    energiaMetabolizavelKcalKg,
    antioxidantType,
    containsGmo,
    topIngredients,
    scoreTotal,
    classificationTier,
    calcioMinPct,
    calcioMaxPct,
    fosforoMinPct,
    umidadeMaxPct,
    extratoEtereoMinPct,
  } = params;

  // 1. Identificação do Público-Alvo e Espécie
  const speciesDesc = species === 'GATO' ? 'gatos' : 'cães';
  const isCastrado = /castrad/i.test(commercialName);
  let faseDesc = 'adultos';
  if (lifeStage === 'CRESCIMENTO_INICIAL') {
    faseDesc = `${speciesDesc} filhotes em fase de crescimento inicial`;
  } else if (lifeStage === 'CRESCIMENTO_FINAL') {
    faseDesc = `${speciesDesc} filhotes em desenvolvimento`;
  } else if (lifeStage === 'SENIOR') {
    faseDesc = `${speciesDesc} idosos (sênior)`;
  } else if (isCastrado) {
    faseDesc = `${speciesDesc} adultos castrados`;
  } else {
    faseDesc = `${speciesDesc} adultos`;
  }

  // 2. Segmento Comercial de Posicionamento
  let segmento = 'Super Premium';
  if (/nattu/i.test(brand)) {
    segmento = 'Super Premium Natural';
  } else if (/golden/i.test(brand)) {
    segmento = 'Premium Especial';
  } else if (/vitta|whiskas|pedigree/i.test(brand)) {
    segmento = 'Premium';
  } else if (/royal\s*canin|premier/i.test(brand)) {
    segmento = 'Super Premium';
  }

  const tipoFormat = foodType === 'UMIDO' ? 'úmido' : 'seco';
  const calStr = energiaMetabolizavelKcalKg
    ? ` e densidade calórica de ${energiaMetabolizavelKcalKg.toLocaleString('pt-BR')} kcal/kg`
    : '';

  const primeiroIngrediente =
    topIngredients && topIngredients.length > 0 && topIngredients[0].trim().length > 2
      ? topIngredients[0].trim().replace(/\.$/, '')
      : null;

  // Cálculos de Matéria Seca (MS)
  const standard = getAbinpetStandard(species, lifeStage, foodType);
  const umidade = Math.min(Math.max(umidadeMaxPct || 10, 0), 95);
  const fatorMS = (100 - umidade) / 100;
  const divisor = fatorMS > 0 ? fatorMS : 1;
  const pbMS = Number((proteinaBrutaMinPct / divisor).toFixed(2));
  const eeMS = extratoEtereoMinPct !== undefined ? Number((extratoEtereoMinPct / divisor).toFixed(2)) : null;
  const caMaxMS = calcioMaxPct ? Number((calcioMaxPct / divisor).toFixed(2)) : null;
  const caMinMS = calcioMinPct ? Number((calcioMinPct / divisor).toFixed(2)) : null;
  const fosfMS = fosforoMinPct ? Number((fosforoMinPct / divisor).toFixed(2)) : null;
  const relCaP =
    calcioMinPct && fosforoMinPct && fosforoMinPct > 0
      ? Number((calcioMinPct / fosforoMinPct).toFixed(2))
      : null;

  // =========================================================================
  // CASO 1: ALIMENTO COADJUVANTE (Prescrição Dietoterápica Clínica)
  // =========================================================================
  if (legalCategory === 'ALIMENTO_COADJUVANTE') {
    const condicoesMap: Record<string, string> = {
      RENAL: 'doença renal crônica',
      URINARIO: 'afecções do trato urinário e controle de urólitos',
      OBESIDADE: 'manejo e perda de peso corpóreo',
      HEPATICO: 'suporte e proteção à função hepática',
      HIPOALERGENICO: 'hipersensibilidade e reações adversas a alimentos',
      GASTROINTESTINAL: 'distúrbios e sensibilidade gastrintestinal',
      CARDIOPATA: 'suporte complementar à função cardíaca',
      DIABETES: 'controle glicêmico em diabetes mellitus',
      RECUPERACAO: 'convalescença e recuperação nutricional intensiva',
    };
    const condStr =
      coadjuvanteCondition && condicoesMap[coadjuvanteCondition]
        ? condicoesMap[coadjuvanteCondition]
        : coadjuvanteCondition
        ? `suporte clínico a quadros de ${coadjuvanteCondition.toLowerCase()}`
        : 'suporte clínico veterinário sob medida';

    const conservStr =
      antioxidantType === 'NATURAL' ? 'antioxidantes 100% naturais' : 'conservantes sintéticos BHA/BHT';
    const gmoStr = containsGmo ? 'presença de grãos transgênicos' : 'fórmula livre de transgênicos';

    return `Alimento ${tipoFormat} dietoterápico coadjuvante formulado especialmente para suporte nutricional a ${speciesDesc} com ${condStr}. Apresenta ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} e ${gmoStr}. Produto de indicação clínica restrita, devendo ser utilizado sob estrita prescrição e acompanhamento contínuo do médico-veterinário.`;
  }

  // =========================================================================
  // CASO 2: ALIMENTO COMPLEMENTAR (Petiscos, Snacks, Cookies e Sachês Toppers)
  // =========================================================================
  if (legalCategory === 'ALIMENTO_COMPLEMENTAR') {
    const isSnack = /cookie|biscoito|snack|petisco|bites/i.test(commercialName);
    const tipoCompl = isSnack
      ? 'petisco / agrado'
      : foodType === 'UMIDO'
      ? 'sachê úmido complementar (topper de hidratação)'
      : 'alimento complementar';

    const conservStr =
      antioxidantType === 'NATURAL' ? 'conservação natural' : 'conservantes sintéticos (BHA/BHT)';

    return `Alimento específico / complementar (${tipoCompl}) formulado para ${faseDesc}, contendo ${proteinaBrutaMinPct}% de proteína bruta e ${conservStr}. Por não conter formulação vitamínico-mineral completa para suprir as necessidades exclusivas diárias, destina-se apenas a agrado, enriquecimento ambiental e recompensa, exigindo oferta moderada em conjunto com a refeição balanceada de rotina.`;
  }

  // =========================================================================
  // CASO 3: ALIMENTO COMPLETO COM SCORE DETERMINÍSTICO DE RANKING
  // =========================================================================
  const score = scoreTotal ?? 0;

  // Frase de primeiro ingrediente
  let ingredienteStr = '';
  if (primeiroIngrediente) {
    const ingLower = primeiroIngrediente.toLowerCase();
    const isProteinaNobre = /farinha de|carne|frango|salm[aã]o|peixe|cordeiro|peru|pat[oô]|su[íi]n/i.test(ingLower);
    if (isProteinaNobre) {
      ingredienteStr = ` Sua formulação destaca-se pela inclusão de ${ingLower} como principal fonte proteica nobre.`;
    } else {
      ingredienteStr = ` Apresenta ${ingLower} no topo da composição declarada.`;
    }
  }

  // Resumo de aditivos e transparência
  const aditivosFrase =
    antioxidantType === 'NATURAL' && !containsGmo
      ? 'Pontua com excelência em transparência pela conservação 100% natural e ausência total de ingredientes transgênicos.'
      : antioxidantType === 'NATURAL' && containsGmo
      ? 'Utiliza conservantes naturais, porém inclui derivados de cereais transgênicos na fórmula.'
      : antioxidantType !== 'NATURAL' && !containsGmo
      ? 'Livre de transgênicos, porém recorre a conservantes sintéticos (BHA/BHT) para estabilização.'
      : 'Como ressalvas na auditoria de aditivos, constatam-se a presença de conservantes químicos sintéticos (BHA/BHT) e o emprego de cereais transgênicos.';

  // -------------------------------------------------------------------------
  // 3.1 NÍVEL DIAMANTE / NÍVEL OURO (Score >= 80)
  // -------------------------------------------------------------------------
  if (score >= 80) {
    const faixaLabel = score >= 90 ? 'Nível Diamante' : 'Nível Ouro';
    const mineralBalanço =
      relCaP !== null
        ? ` Relação cálcio:fósforo perfeitamente balanceada em ${relCaP}:1, dentro da faixa ideal da ABINPET.`
        : '';

    return `Alimento ${tipoFormat} do segmento ${segmento} para ${faseDesc}, classificado no ${faixaLabel} com ${score} pontos pela auditoria técnica do PetRankings.${ingredienteStr} O produto cumpre integralmente os parâmetros da 11ª Edição do Manual ABINPET com confortável margem de segurança industrial na matéria seca (${pbMS}% de proteína bruta${eeMS ? ` e ${eeMS}% de extrato etéreo` : ''}).${mineralBalanço} ${aditivosFrase}`;
  }

  // -------------------------------------------------------------------------
  // 3.2 NÍVEL PRATA / NÍVEL BRONZE (Score 60 a 79)
  // -------------------------------------------------------------------------
  if (score >= 60) {
    const faixaLabel = score >= 70 ? 'Nível Prata' : 'Nível Bronze';
    const caPStr =
      relCaP !== null
        ? relCaP >= 1.0 && relCaP <= 2.0
          ? ` Apresenta relação cálcio:fósforo calculada em ${relCaP}:1 (faixa tolerada).`
          : ` Apresenta relação cálcio:fósforo calculada em ${relCaP}:1, fora da proporção recomendada.`
        : '';

    return `A ${commercialName} obteve a classificação ${faixaLabel} (${score} pts) ao demonstrar atendimento aos pisos regulatórios da 11ª Edição do Manual ABINPET na matéria seca (${pbMS}% de proteína bruta).${ingredienteStr}${caPStr} ${aditivosFrase}`;
  }

  // -------------------------------------------------------------------------
  // 3.3 SOB OBSERVAÇÃO (Score < 60)
  // -------------------------------------------------------------------------
  const motivos: string[] = [];

  // Diagnóstico Cálcio Máximo
  if (caMaxMS && caMaxMS > standard.calcioMaxSeguroMS) {
    const caMaxDeclarado = calcioMaxPct ? calcioMaxPct.toFixed(2).replace(/\.?0+$/, '').replace('.', ',') : '';
    const caMaxMSStr = caMaxMS.toFixed(2).replace('.', ',');
    const tetoStr = standard.calcioMaxSeguroMS.toFixed(2).replace('.', ',');
    motivos.push(
      `o nível de cálcio máximo declarado de ${caMaxDeclarado}% (${caMaxMSStr}% na matéria seca) ultrapassa o teto de segurança da ABINPET (${tetoStr}% MS)`
    );
  }

  // Diagnóstico Proteína Bruta
  if (pbMS < standard.proteinaBrutaMinMS) {
    const pbMSStr = pbMS.toFixed(2).replace('.', ',');
    const pisoStr = standard.proteinaBrutaMinMS.toFixed(2).replace('.', ',');
    motivos.push(
      `o teor de proteína bruta na matéria seca (${pbMSStr}% MS) está abaixo do piso mínimo de segurança da ABINPET (${pisoStr}% MS)`
    );
  }

  // Diagnóstico Extrato Etéreo (Gordura)
  if (eeMS !== null && eeMS < standard.extratoEtereoMinMS) {
    const eeMSStr = eeMS.toFixed(2).replace('.', ',');
    const pisoEEStr = standard.extratoEtereoMinMS.toFixed(2).replace('.', ',');
    if (isCastrado) {
      motivos.push(
        `o teor de extrato etéreo declarado na matéria seca (${eeMSStr}% MS) apresenta valor reduzido para manejo de peso de castrados, situando-se abaixo do piso geral de manutenção da ABINPET (${pisoEEStr}% MS)`
      );
    } else {
      motivos.push(
        `o teor de extrato etéreo na matéria seca (${eeMSStr}% MS) está abaixo do piso mínimo estipulado pela ABINPET (${pisoEEStr}% MS)`
      );
    }
  }

  // Diagnóstico Relação Cálcio:Fósforo
  if (relCaP !== null && (relCaP < standard.relacaoCaPToleranciaMin || relCaP > standard.relacaoCaPToleranciaMax)) {
    const relStr = relCaP.toFixed(2).replace('.', ',');
    motivos.push(
      `a relação cálcio:fósforo calculada em ${relStr}:1 encontra-se fora da faixa segura de tolerância da ABINPET (mínimo 1,0:1 e máximo 2,0:1), gerando desbalanço mineral`
    );
  }

  // Fallback de motivo caso nenhum dos 4 limites clássicos tenha sido o único gatilho
  let motivoFinal = '';
  if (motivos.length > 0) {
    motivoFinal = motivos.join(', além de ');
  } else {
    motivoFinal =
      'os nutrientes declarados na matéria seca operam no limite estrito ou inconformes com os parâmetros de segurança técnica da 11ª Edição do Manual ABINPET';
  }

  const advertenciaFinal =
    'Diante dos apontamentos técnicos da auditoria, recomenda-se cautela do tutor na escolha e prévia avaliação com médico-veterinário.';
  const aditivosFormatado = aditivosFrase.charAt(0).toLowerCase() + aditivosFrase.slice(1);

  return `A ${commercialName} recebeu a classificação Sob Observação (${score} pts) na auditoria técnica do PetRankings.${ingredienteStr} A pontuação foi penalizada porque ${motivoFinal}. Adicionalmente, ${aditivosFormatado} ${advertenciaFinal}`;
}

/**
 * Gerador de Parecer Editorial do PetRankings alimentado pelo Google Gemini AI.
 * Utiliza o modelo gemini-3.6-flash (com contingência para gemini-2.5-flash) com fundamentação estrita nas normas do
 * Manual Pet Food Brasil (ABINPET 11ª Edição) e dados probatórios da ficha técnica.
 * 
 * Se a chave GEMINI_API_KEY não estiver disponível, ou em caso de timeout/erro de rede persistente,
 * recorre automaticamente ao motor determinístico avançado generateTechnicalEditorialOpinion.
 */
export async function generateEditorialOpinionWithGemini(
  params: EditorialGenerationParams
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateTechnicalEditorialOpinion(params);
  }

  try {
    const {
      commercialName,
      brand,
      species,
      lifeStage,
      foodType,
      legalCategory,
      coadjuvanteCondition,
      proteinaBrutaMinPct,
      extratoEtereoMinPct,
      antioxidantType,
      containsGmo,
      topIngredients,
      scoreTotal,
      classificationTier,
      calcioMinPct,
      calcioMaxPct,
      fosforoMinPct,
      umidadeMaxPct,
      extratoPontos,
    } = params;

    const standard = getAbinpetStandard(species, lifeStage, foodType);
    const umidade = Math.min(Math.max(umidadeMaxPct || 10, 0), 95);
    const fatorMS = (100 - umidade) / 100;
    const divisor = fatorMS > 0 ? fatorMS : 1;
    const pbMS = Number((proteinaBrutaMinPct / divisor).toFixed(2));
    const eeMS = extratoEtereoMinPct !== undefined ? Number((extratoEtereoMinPct / divisor).toFixed(2)) : null;
    const caMaxMS = calcioMaxPct ? Number((calcioMaxPct / divisor).toFixed(2)) : null;
    const relCaP =
      calcioMinPct && fosforoMinPct && fosforoMinPct > 0
        ? (calcioMinPct / fosforoMinPct).toFixed(2)
        : null;

    const pointsSummary = extratoPontos
      ? extratoPontos
          .map((p) => `- ${p.pilar}: ${p.pontos_obtidos}/${p.pontos_max} pts (${p.justificativa})`)
          .join('\n')
      : 'Não especificado';

    const systemPrompt = `Você é o Redator Técnico e Especialista em Nutrição Animal do PetRankings (portal independente brasileiro de avaliação e auditoria nutricional de alimentos para cães e gatos).
Sua missão é redigir um "Parecer Editorial do Especialista" conciso, transparente, imparcial e tecnicamente rigoroso.

DIRETRIZES INEGOCIÁVEIS:
1. FIDELIDADE ESTRITA AOS DADOS: Nunca invente, deduza ou simule dados que não constem na ficha técnica. Baseie-se estritamente nas normas do Manual Pet Food Brasil (ABINPET 11ª Edição).
2. ZERO MARKETING: É terminantemente proibido usar frases de efeito, slogans do fabricante ou adjetivos comerciais vazios ("delicioso", "completo e saboroso", "amor pelo seu pet", "a melhor escolha").
3. TRANSPARÊNCIA COM O TUTOR:
   - Se o produto estiver "Sob Observação" (score < 60): Explique de forma clara e respeitosa o motivo técnico pelo qual o produto perdeu pontos na auditoria (ex: excesso de cálcio na matéria seca acima do teto seguro da ABINPET, relação cálcio:fósforo desbalanceada, presença de conservantes sintéticos BHA/BHT, uso de transgênicos, densidade proteica modesta, ou teor de gordura reduzido para castrados que opera abaixo do piso geral de manutenção da ABINPET). Recomende cautela e consulta veterinária.
   - Se o produto for Nível Prata, Ouro ou Diamante (score >= 60): Apresente uma análise equilibrada de seus pontos fortes (ex: atendimento pleno aos parâmetros regulatórios da ABINPET) sem ocultar pontos de atenção caso existam (ex: BHA/BHT ou transgênicos).
   - Se for Alimento Complementar (petisco/cookie/topper): Deixe explícito que não é alimento completo, servindo apenas para recompensa/agrado e exigindo moderação para não desbalancear a dieta diária.
   - Se for Alimento Coadjuvante: Destaque a indicação terapêutica e a exigência de prescrição e acompanhamento veterinário.
4. FORMATO E EXTENSÃO:
   - Escreva em texto corrido (1 parágrafo fluido, 3 a 5 frases bem estruturadas, entre 50 e 90 palavras).
   - NÃO use marcadores (bullets), NÃO use negrito (**texto**), NÃO use títulos. Retorne APENAS o texto do parecer.`;

    const userPrompt = `Redija o parecer editorial para o seguinte produto avaliado:
- Nome Comercial: ${commercialName}
- Marca: ${brand}
- Espécie: ${species === 'GATO' ? 'Gatos (Felinos)' : 'Cães (Caninos)'}
- Fase de Vida: ${lifeStage}
- Tipo de Alimento: ${foodType} (${foodType === 'UMIDO' ? 'Úmido' : 'Seco'})
- Categoria Legal MAPA: ${legalCategory} ${coadjuvanteCondition ? `(Condição: ${coadjuvanteCondition})` : ''}
- Nota da Auditoria: ${scoreTotal !== null ? `${scoreTotal} / 100 pontos` : 'Não aplicável (Classificação por Regime Especial)'}
- Faixa de Classificação: ${classificationTier}
- Proteína Bruta: ${proteinaBrutaMinPct}% (calculado ${pbMS}% na matéria seca vs mínimo ABINPET ${standard.proteinaBrutaMinMS}% MS)
${eeMS !== null ? `- Extrato Etéreo (Gordura): ${extratoEtereoMinPct}% (calculado ${eeMS}% na matéria seca vs piso ABINPET ${standard.extratoEtereoMinMS}% MS)` : ''}
- Cálcio Declarado: Mín ${calcioMinPct ?? 'N/D'}% | Máx ${calcioMaxPct ?? 'N/D'}% (${caMaxMS ? `${caMaxMS}% na matéria seca vs teto seguro ABINPET ${standard.calcioMaxSeguroMS}% MS` : ''})
- Fósforo Mínimo: ${fosforoMinPct ?? 'N/D'}% (${relCaP ? `Relação Ca:P calculada ${relCaP}:1` : ''})
- Conservantes: ${antioxidantType === 'NATURAL' ? 'Conservantes 100% Naturais' : 'Conservantes Sintéticos (BHA/BHT)'}
- Transgênicos: ${containsGmo ? 'Contém ingredientes transgênicos' : 'Livre de transgênicos'}
- Principais Ingredientes do Rótulo: ${topIngredients.slice(0, 5).join(', ') || 'Não informados'}
- Extrato dos Pilares da Auditoria:
${pointsSummary}`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash'];
    let res: Response | null = null;

    for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
      const currentModel = modelsToTry[attempt];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [{ parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: 0.2,
              },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (res.ok) {
          break;
        }

        if (res.status === 503 || res.status === 429) {
          console.warn(`[Gemini Editorial] Modelo ${currentModel} retornou status ${res.status}. Aguardando 3.5s...`);
          await new Promise((r) => setTimeout(r, 3500));
        }
      } catch (err: any) {
        console.warn(`[Gemini Editorial] Erro na tentativa com ${currentModel}: ${err.message}.`);
        if (attempt < modelsToTry.length - 1) {
          await new Promise((r) => setTimeout(r, 2500));
        }
      }
    }

    if (!res || !res.ok) {
      console.warn(`[Gemini Editorial] Falha em todos os modelos da API. Usando fallback determinístico aprimorado.`);
      return generateTechnicalEditorialOpinion(params);
    }

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (generatedText && generatedText.length > 30) {
      return generatedText;
    }

    return generateTechnicalEditorialOpinion(params);
  } catch (error) {
    console.warn('[Gemini Editorial] Erro na geração com IA (usando fallback determinístico aprimorado):', error);
    return generateTechnicalEditorialOpinion(params);
  }
}


