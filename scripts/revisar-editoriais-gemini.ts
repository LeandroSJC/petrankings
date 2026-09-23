import prisma from '../src/lib/prisma';
import { getAbinpetStandard } from '../src/lib/audit-engine/abinpet-standards';
import { Especie, FaseVida, TipoAlimento } from '../src/lib/audit-engine/types';

const DETERMINISTIC_REGEX = /(?:Alimento (?:seco|úmido) do segmento|Alimento dietoterápico coadjuvante formulado especialmente|Alimento específico \/ complementar|ao demonstrar atendimento aos pisos regulatórios|demonstrando alta densidade nutricional e atendimento pleno aos parâmetros do Manual Pet Food Brasil|Classificado Sob Observação \(|na auditoria técnica do PetRankings\..*A pontuação foi penalizada porque)/i;

async function runEditorialRevision() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ ERRO CRÍTICO: Variável GEMINI_API_KEY não encontrada no ambiente (.env).');
    process.exit(1);
  }

  console.log('🔍 Identificando produtos com parecer editorial determinístico (não gerados pelo Gemini)...');

  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      species: true,
      lifeStage: true,
      foodType: true,
      legalCategory: true,
      coadjuvanteCondition: true,
      crudeProteinMinPct: true,
      etherExtractMinPct: true,
      calciumMinPct: true,
      calciumMaxPct: true,
      phosphorusMinPct: true,
      moistureMaxPct: true,
      antioxidantType: true,
      containsGmo: true,
      topIngredients: true,
      scoreTotal: true,
      classificationTier: true,
      scoreBreakdown: true,
      editorialOpinion: true,
    },
    orderBy: { id: 'asc' },
  });

  const targetProducts = allProducts.filter((p) => {
    if (!p.editorialOpinion || p.editorialOpinion.trim().length === 0) return true;
    return DETERMINISTIC_REGEX.test(p.editorialOpinion);
  });

  console.log(`📊 Total de produtos no banco: ${allProducts.length}`);
  console.log(`🎯 Produtos para revisão pelo Gemini: ${targetProducts.length}`);

  if (targetProducts.length === 0) {
    console.log('✅ Nenhum produto pendente de revisão pelo Gemini!');
    return;
  }

  const model = 'gemini-3.6-flash';
  let successCount = 0;
  let stoppedDueToDenial = false;
  let stopReason = '';

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

  for (let i = 0; i < targetProducts.length; i++) {
    const product = targetProducts[i];
    const currentIndex = i + 1;
    const total = targetProducts.length;

    console.log(`\n[${currentIndex}/${total}] Processando: "${product.commercialName}" (${product.slug})...`);

    // 1. Processar ingredientes
    let topIngredientsList: string[] = [];
    try {
      topIngredientsList = JSON.parse(product.topIngredients);
    } catch {
      topIngredientsList = product.topIngredients.split(',').map((s) => s.trim());
    }

    // 2. Cálculos de Matéria Seca (MS)
    const standard = getAbinpetStandard(
      product.species as Especie,
      product.lifeStage as FaseVida,
      product.foodType as TipoAlimento
    );

    const umidade = Math.min(Math.max(product.moistureMaxPct || 10, 0), 95);
    const fatorMS = (100 - umidade) / 100;
    const divisor = fatorMS > 0 ? fatorMS : 1;
    const pbMS = Number((product.crudeProteinMinPct / divisor).toFixed(2));
    const eeMS = product.etherExtractMinPct !== undefined ? Number((product.etherExtractMinPct / divisor).toFixed(2)) : null;
    const caMaxMS = product.calciumMaxPct ? Number((product.calciumMaxPct / divisor).toFixed(2)) : null;
    const relCaP =
      product.calciumMinPct && product.phosphorusMinPct && product.phosphorusMinPct > 0
        ? (product.calciumMinPct / product.phosphorusMinPct).toFixed(2)
        : null;

    const pointsSummary = Array.isArray(product.scoreBreakdown)
      ? (product.scoreBreakdown as any[])
          .map((p) => `- ${p.pilar}: ${p.pontos_obtidos}/${p.pontos_max} pts (${p.justificativa})`)
          .join('\n')
      : 'Não especificado';

    const userPrompt = `Redija o parecer editorial para o seguinte produto avaliado:
- Nome Comercial: ${product.commercialName}
- Marca: ${product.brand}
- Espécie: ${product.species === 'GATO' ? 'Gatos (Felinos)' : 'Cães (Caninos)'}
- Fase de Vida: ${product.lifeStage}
- Tipo de Alimento: ${product.foodType} (${product.foodType === 'UMIDO' ? 'Úmido' : 'Seco'})
- Categoria Legal MAPA: ${product.legalCategory} ${product.coadjuvanteCondition ? `(Condição: ${product.coadjuvanteCondition})` : ''}
- Nota da Auditoria: ${product.scoreTotal !== null ? `${product.scoreTotal} / 100 pontos` : 'Não aplicável (Classificação por Regime Especial)'}
- Faixa de Classificação: ${product.classificationTier}
- Proteína Bruta: ${product.crudeProteinMinPct}% (calculado ${pbMS}% na matéria seca vs mínimo ABINPET ${standard.proteinaBrutaMinMS}% MS)
${eeMS !== null ? `- Extrato Etéreo (Gordura): ${product.etherExtractMinPct}% (calculado ${eeMS}% na matéria seca vs piso ABINPET ${standard.extratoEtereoMinMS}% MS)` : ''}
- Cálcio Declarado: Mín ${product.calciumMinPct ?? 'N/D'}% | Máx ${product.calciumMaxPct ?? 'N/D'}% (${caMaxMS ? `${caMaxMS}% na matéria seca vs teto seguro ABINPET ${standard.calcioMaxSeguroMS}% MS` : ''})
- Fósforo Mínimo: ${product.phosphorusMinPct ?? 'N/D'}% (${relCaP ? `Relação Ca:P calculada ${relCaP}:1` : ''})
- Conservantes: ${product.antioxidantType === 'NATURAL' ? 'Conservantes 100% Naturais' : 'Conservantes Sintéticos (BHA/BHT)'}
- Transgênicos: ${product.containsGmo ? 'Contém ingredientes transgênicos' : 'Livre de transgênicos'}
- Principais Ingredientes do Rótulo: ${topIngredientsList.slice(0, 5).join(', ') || 'Não informados'}
- Extrato dos Pilares da Auditoria:
${pointsSummary}`;

    try {
      const modelsToAttempt = ['gemini-3.6-flash', 'gemini-3.5-flash'];
      let res: Response | null = null;
      let lastErrorText = '';

      for (const m of modelsToAttempt) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: userPrompt }] }],
              generationConfig: { temperature: 0.2 },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (res.ok) {
          break;
        }

        // Se for 429 (cota/rate limit) ou 403 (proibido), para imediatamente sem tentar outro modelo
        if (res.status === 429 || res.status === 403) {
          lastErrorText = await res.text();
          break;
        }

        if (res.status === 503) {
          lastErrorText = await res.text();
          console.warn(`   ⚠️ Modelo ${m} temporariamente ocupado (503). Tentando modelo alternativo...`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        lastErrorText = await res.text();
      }

      // Verificação estrita de Negação de Serviço
      if (!res || !res.ok) {
        const status = res?.status ?? 500;
        stoppedDueToDenial = true;
        stopReason = `Código HTTP ${status} - Resposta da API: ${lastErrorText.slice(0, 200)}`;
        console.warn(`\n🛑 [INTERRUPÇÃO MANDATÓRIA] O Gemini negou serviço (${status}):`);
        console.warn(`   ${stopReason}`);
        console.warn(`   Parando o processo imediatamente conforme instrução do usuário.`);
        break;
      }

      const data = await res.json();
      let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!generatedText || generatedText.length < 30) {
        console.warn(`⚠️ Texto gerado vazio ou muito curto. Pulando...`);
        continue;
      }

      // Limpeza de possíveis formatações residuais em negrito
      generatedText = generatedText.replace(/\*\*/g, '').trim();

      // Salvar imediatamente no banco de dados
      await prisma.product.update({
        where: { id: product.id },
        data: {
          editorialOpinion: generatedText,
          updatedAt: new Date(),
        },
      });

      successCount++;
      console.log(`✅ [${successCount} atualizados] Texto gerado e salvo:`);
      console.log(`   "${generatedText.slice(0, 100)}..."`);

      // Pausa estratégica de 4 segundos entre requisições para evitar rate limit
      if (i < targetProducts.length - 1) {
        await new Promise((r) => setTimeout(r, 4000));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn(`⚠️ Timeout na requisição.`);
      } else {
        console.warn(`⚠️ Erro de rede ou chamada:`, err.message);
      }
      stoppedDueToDenial = true;
      stopReason = `Exceção na chamada de rede: ${err.message}`;
      console.warn(`🛑 Parando o processo devido a erro de conexão.`);
      break;
    }
  }

  console.log('\n==================================================');
  console.log('📋 RELATÓRIO FINAL DA REVISÃO EDITORIAL:');
  console.log(`- Produtos revisados e salvos nesta execução: ${successCount}`);
  console.log(`- Processo parou por negação de serviço? ${stoppedDueToDenial ? 'SIM' : 'NÃO (Concluído com êxito)'}`);
  if (stoppedDueToDenial) {
    console.log(`- Motivo da parada: ${stopReason}`);
  }
  console.log('==================================================\n');
}

runEditorialRevision()
  .catch((e) => {
    console.error('Erro no script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
