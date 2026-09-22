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
}

/**
 * Gerador determinístico de Parecer Editorial Técnico do PetRankings.
 * 
 * Regras Inegociáveis (AGENTS.md & pet-editorial-copywriter):
 * 1. Proibição absoluta de invenção de dados ou cópia acrítica de slogans comerciais do fabricante.
 * 2. Tom estritamente técnico, imparcial e alinhado com a pontuação e os critérios da 11ª Edição do Manual ABINPET.
 * 3. Coerência total com a espécie, fase de vida, ingredientes reais do PDF e classificação obtida.
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
  } = params;

  // 1. Identificação do Público-Alvo e Espécie
  const speciesDesc = species === 'GATO' ? 'gatos' : 'cães';
  let faseDesc = 'adultos';
  if (lifeStage === 'CRESCIMENTO_INICIAL') {
    faseDesc = `${speciesDesc} filhotes em fase de crescimento`;
  } else if (lifeStage === 'CRESCIMENTO_FINAL') {
    faseDesc = `${speciesDesc} filhotes em fase de desenvolvimento`;
  } else if (lifeStage === 'SENIOR') {
    faseDesc = `${speciesDesc} idosos / sênior`;
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
  const conservStr =
    antioxidantType === 'NATURAL' ? 'conservantes 100% naturais' : 'antioxidantes sintéticos (BHA/BHT)';
  const gmoStr = containsGmo ? 'presença de cereais transgênicos' : 'fórmula livre de transgênicos';

  const primeiroIngrediente =
    topIngredients && topIngredients.length > 0 && topIngredients[0].trim().length > 2
      ? topIngredients[0].trim().replace(/\.$/, '')
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

    return `Alimento ${tipoFormat} dietoterápico coadjuvante formulado especialmente para suporte nutricional a ${speciesDesc} com ${condStr}. Formulado com ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} e ${gmoStr}. Produto de indicação específica, de uso sob estrita orientação e acompanhamento médico-veterinário.`;
  }

  // =========================================================================
  // CASO 2: ALIMENTO COMPLEMENTAR (Petiscos, Snacks, Cookies e Sachês Toppers)
  // =========================================================================
  if (legalCategory === 'ALIMENTO_COMPLEMENTAR') {
    const isSnack = /cookie|biscoito|snack|petisco|bites/i.test(commercialName);
    const tipoCompl = isSnack
      ? 'petisco / cookie'
      : foodType === 'UMIDO'
      ? 'sachê úmido complementar (topper)'
      : 'alimento complementar';

    return `Alimento específico / complementar (${tipoCompl}) para ${faseDesc}, formulado com ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} e ${gmoStr}. Por não conter formulação vitamínico-mineral completa para uso exclusivo, destina-se a agrado, recompensa e enriquecimento, devendo ser oferecido em conjunto com a alimentação balanceada habitual.`;
  }

  // =========================================================================
  // CASO 3: ALIMENTO COMPLETO COM SCORE DETERMINÍSTICO DE RANKING
  // =========================================================================
  const score = scoreTotal ?? 0;

  // 3.1 NÍVEL DIAMANTE / NÍVEL OURO (Score >= 80)
  if (score >= 80) {
    const faixaLabel = score >= 90 ? 'Nível Diamante' : 'Nível Ouro';
    const baseProteicaStr = primeiroIngrediente
      ? ` Destaca-se pela inclusão de ${primeiroIngrediente.toLowerCase()} como primeiro ingrediente nutritivo,`
      : '';

    return `Alimento ${tipoFormat} do segmento ${segmento} para ${faseDesc}.${baseProteicaStr} formulado com ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} e ${gmoStr}. Avaliado com classificação ${faixaLabel} (${score} pts), demonstrando alta densidade nutricional e atendimento pleno aos parâmetros do Manual Pet Food Brasil (ABINPET 11ª Edição) com margem de segurança técnica na matéria seca.`;
  }

  // 3.2 NÍVEL PRATA / NÍVEL BRONZE (Score 60 a 79)
  if (score >= 60) {
    const faixaLabel = score >= 70 ? 'Nível Prata' : 'Nível Bronze';
    const baseProteicaStr = primeiroIngrediente
      ? ` com ${primeiroIngrediente.toLowerCase()} no topo da lista de ingredientes,`
      : '';

    return `Alimento ${tipoFormat} do segmento ${segmento} para ${faseDesc},${baseProteicaStr} formulado com ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} e ${gmoStr}. Avaliado com classificação ${faixaLabel} (${score} pts), cumprindo os níveis de garantia regulatórios da 11ª Edição do Manual ABINPET para manutenção básica.`;
  }

  // 3.3 SOB OBSERVAÇÃO (Score < 60)
  const standard = getAbinpetStandard(species, lifeStage, foodType);
  const umidade = Math.min(Math.max(umidadeMaxPct || 10, 0), 95);
  const fatorMS = (100 - umidade) / 100;
  const divisor = fatorMS > 0 ? fatorMS : 1;
  const caMaxMS = calcioMaxPct ? Number((calcioMaxPct / divisor).toFixed(2)) : null;
  const pbMS = Number((proteinaBrutaMinPct / divisor).toFixed(2));

  let motivoObservacao =
    'os nutrientes essenciais declarados em matéria seca não atingem os parâmetros ou margens de segurança recomendados pela ABINPET';

  if (caMaxMS && caMaxMS > standard.calcioMaxSeguroMS) {
    const caMaxStr = calcioMaxPct ? calcioMaxPct.toFixed(2).replace(/\.?0+$/, '').replace('.', ',') : '';
    const caMaxMSStr = caMaxMS.toFixed(2).replace('.', ',');
    motivoObservacao = `o nível de cálcio máximo declarado de ${caMaxStr}% (${caMaxMSStr}% na matéria seca) ultrapassa o teto de segurança da 11ª Edição do Manual ABINPET (limite seguro de ${standard.calcioMaxSeguroMS.toFixed(2).replace('.', ',')}% MS para ${species === 'GATO' ? 'felinos' : 'caninos'} em ${lifeStage === 'CRESCIMENTO_INICIAL' ? 'crescimento' : 'manutenção'})`;
  } else if (pbMS < standard.proteinaBrutaMinMS) {
    const pbMSStr = pbMS.toFixed(2).replace('.', ',');
    motivoObservacao = `a proteína bruta declarada na matéria seca (${pbMSStr}% MS) está abaixo do piso mínimo de segurança da ABINPET (${standard.proteinaBrutaMinMS.toFixed(2).replace('.', ',')}% MS)`;
  } else if (fosforoMinPct && calcioMinPct && (calcioMinPct / fosforoMinPct < 1.0 || calcioMinPct / fosforoMinPct > 2.0)) {
    motivoObservacao = `a relação cálcio:fósforo calculada (${(calcioMinPct / fosforoMinPct).toFixed(2).replace('.', ',')}:1) encontra-se fora dos parâmetros de segurança da ABINPET`;
  }

  const baseProteicaStr = primeiroIngrediente
    ? ` formulado com ${primeiroIngrediente.toLowerCase()} como base proteica,`
    : ' formulado com';

  return `Alimento ${tipoFormat} do segmento ${segmento} para ${faseDesc},${baseProteicaStr} ${proteinaBrutaMinPct}% de proteína bruta${calStr}, ${conservStr} e ${gmoStr}. Classificado Sob Observação (${score} pts) pela auditoria técnica do PetRankings: ${motivoObservacao}. Recomenda-se cautela do tutor e orientação do médico-veterinário.`;
}

/**
 * Gerador de Parecer Editorial do PetRankings alimentado pelo Google Gemini AI.
 * Utiliza o modelo gemini-3.6-flash com fundamentação estrita nas normas do
 * Manual Pet Food Brasil (ABINPET 11ª Edição) e dados probatórios da ficha técnica.
 * 
 * Se a chave GEMINI_API_KEY não estiver disponível, ou em caso de timeout/erro de rede,
 * recorre automaticamente ao motor determinístico generateTechnicalEditorialOpinion.
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
   - Se o produto estiver "Sob Observação" (score < 60): Explique de forma clara e respeitosa o motivo técnico pelo qual o produto perdeu pontos na auditoria (ex: excesso de cálcio na matéria seca acima do teto seguro da ABINPET, relação cálcio:fósforo desbalanceada, presença de conservantes sintéticos BHA/BHT, uso de transgênicos, densidade proteica modesta). Recomende cautela e consulta veterinária.
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
- Cálcio Declarado: Mín ${calcioMinPct ?? 'N/D'}% | Máx ${calcioMaxPct ?? 'N/D'}% (${caMaxMS ? `${caMaxMS}% na matéria seca vs teto seguro ABINPET ${standard.calcioMaxSeguroMS}% MS` : ''})
- Fósforo Mínimo: ${fosforoMinPct ?? 'N/D'}% (${relCaP ? `Relação Ca:P calculada ${relCaP}:1` : ''})
- Conservantes: ${antioxidantType === 'NATURAL' ? 'Conservantes 100% Naturais' : 'Conservantes Sintéticos (BHA/BHT)'}
- Transgênicos: ${containsGmo ? 'Contém ingredientes transgênicos' : 'Livre de transgênicos'}
- Principais Ingredientes do Rótulo: ${topIngredients.slice(0, 5).join(', ') || 'Não informados'}
- Extrato dos Pilares da Auditoria:
${pointsSummary}`;

    let res: Response | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
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

        if ((res.status === 503 || res.status === 429) && attempt < 2) {
          console.warn(`[Gemini Editorial] Status ${res.status} na tentativa ${attempt}. Aguardando 2.5s para retry...`);
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
      } catch (err: any) {
        if (attempt < 2) {
          console.warn(`[Gemini Editorial] Erro transitório na tentativa ${attempt}: ${err.message}. Tentando novamente...`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
      }
    }

    if (!res || !res.ok) {
      console.warn(`[Gemini Editorial] Falha na API (${res?.status} ${res?.statusText}). Usando fallback determinístico.`);
      return generateTechnicalEditorialOpinion(params);
    }

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (generatedText && generatedText.length > 30) {
      return generatedText;
    }

    return generateTechnicalEditorialOpinion(params);
  } catch (error) {
    console.warn('[Gemini Editorial] Erro na geração com IA (usando fallback):', error);
    return generateTechnicalEditorialOpinion(params);
  }
}

