import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { getSession, verifySessionToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

/**
 * Endpoint administrativo para extração automática e enriquecimento de produtos
 * utilizando Web Scraping com Cheerio e Google Gemini AI (Google AI Pro).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificação de Permissão Administrativa
    let session = null;
    try {
      session = await getSession();
    } catch {
      const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
      if (token) {
        session = await verifySessionToken(token);
      }
    }

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
      return NextResponse.json(
        { error: 'Por favor, informe uma URL válida iniciando com http:// ou https://' },
        { status: 400 }
      );
    }

    const targetUrl = url.trim();

    // 2. Requisição HTTP para a página do fabricante ou loja
    let html = '';
    let isBlockedByAntiBot = false;
    let antiBotReason = '';

    // Atalho inteligente: se o domínio possui Cloudflare obrigatório (ex: premierpet.com.br),
    // pula direto para o renderizador sem desperdiçar tempo tentando fetch direto fadado a 403
    const isKnownProtectedDomain = /(premierpet\.com\.br)/i.test(targetUrl);

    if (isKnownProtectedDomain) {
      isBlockedByAntiBot = true;
      antiBotReason = 'Cloudflare obrigatório detectado pelo domínio';
    } else {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(3500), // Timeout rápido de 3.5s para não atrasar se o site travar
        });

        if (!response.ok) {
          isBlockedByAntiBot = true;
          antiBotReason = `Status HTTP ${response.status}`;
        } else {
          html = await response.text();
          if (
            html.includes('challenges.cloudflare.com') ||
            html.includes('<title>Just a moment...</title>') ||
            html.includes('cf-mitigated')
          ) {
            isBlockedByAntiBot = true;
            antiBotReason = 'Cloudflare Turnstile';
          }
        }
      } catch (fetchErr: unknown) {
        const msg = fetchErr instanceof Error ? fetchErr.message : 'Timeout ou erro de conexão';
        isBlockedByAntiBot = true;
        antiBotReason = msg;
      }
    }

    // Fallback: Se o fetch direto foi bloqueado por Cloudflare, renderiza via Jina AI Reader (Chromium em nuvem gratuito)
    let renderedMarkdown = '';
    let isRenderedByJina = false;

    if (isBlockedByAntiBot) {
      try {
        const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
          headers: {
            'User-Agent': 'PetRankings/1.0',
            Accept: 'text/plain',
            'X-Timeout': '16',
            'X-Wait-For-Selector': 'body',
          },
          signal: AbortSignal.timeout(20000), // 20s timeout para resolução do Turnstile no Chromium
        });

        if (jinaRes.ok) {
          const text = await jinaRes.text();
          if (
            text &&
            text.trim().length > 200 &&
            !text.includes('Just a moment...') &&
            !text.includes('Target URL returned error 403: Forbidden')
          ) {
            renderedMarkdown = text;
            isRenderedByJina = true;
            isBlockedByAntiBot = false; // Bloqueio superado com sucesso pelo renderizador!
          }
        }
      } catch (jinaErr) {
        console.warn('Tentativa de renderização via Jina Reader falhou:', jinaErr);
      }
    }

    // Se mesmo com a renderização em nuvem o site continuar inacessível, aborta com aviso claro
    if (isBlockedByAntiBot) {
      return NextResponse.json(
        {
          error:
            'A página informada possui proteção rigorosa contra acessos automáticos (Cloudflare/Anti-bot) e não pôde ser lida. Nenhuma informação foi alterada no formulário. Por favor, tente o link correspondente em uma loja parceira (como Petlove, Cobasi ou Amazon) ou preencha manualmente.',
        },
        { status: 400 }
      );
    }

    let rawTitle = '';
    let rawDescription = '';
    let rawImageUrl = '';
    let rawBrand = '';
    let cleanBodyText = '';
    let jsonLdData: Record<string, unknown> | null = null;

    if (isRenderedByJina) {
      // 3A. Extração a partir do conteúdo renderizado pelo navegador Chromium
      const h2Match = renderedMarkdown.match(/^##\s+(.+)$/im);
      if (h2Match && !/onde comprar|produtos relacionados|newsletter|contato|redes sociais/i.test(h2Match[1])) {
        rawTitle = h2Match[1].trim();
      } else {
        const titleMatch = renderedMarkdown.match(/^Title:\s*(.+)$/im);
        if (titleMatch) {
          rawTitle = titleMatch[1].replace(/\|.*$/g, '').trim();
        }
      }

      // Extrai todas as imagens e seleciona a imagem principal da embalagem
      const allImgMatches = Array.from(
        renderedMarkdown.matchAll(
          /!\[(.*?)\]\((https?:\/\/[^\s\)]+?\.(?:webp|png|jpg|jpeg)[^\s\)]*)\)/gi
        )
      ).map((m) => ({ alt: m[1], url: m[2] }));

      const productImages = allImgMatches.filter(
        (item) =>
          !/bandeira|flag|logo|icon|selo|arrow|placeholder|avatar|badge|banner|baner|\/10kg|pesquisa|search|barra|unlimited_elements/i.test(
            item.url + ' ' + item.alt
          )
      );

      if (productImages.length > 0) {
        rawImageUrl = productImages[0].url;
      } else if (allImgMatches.length > 0) {
        rawImageUrl = allImgMatches[0].url;
      }

      cleanBodyText = renderedMarkdown
        .replace(/!\[.*?\]\(.*?\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000);
    } else {
      // 3B. Extração normal com Cheerio a partir do HTML cru
      if (!html || html.trim().length < 200) {
        return NextResponse.json(
          {
            error:
              'Não foi possível obter o conteúdo da página deste produto. Nenhuma informação foi alterada no formulário.',
          },
          { status: 400 }
        );
      }

      const $ = cheerio.load(html);

      rawTitle =
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim() ||
        $('h1').first().text().trim() ||
        '';

      rawDescription =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        '';

      rawImageUrl =
        $('meta[property="og:image:secure_url"]').attr('content') ||
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('img[itemprop="image"]').attr('src') ||
        '';

      if (rawImageUrl && !rawImageUrl.startsWith('http')) {
        try {
          rawImageUrl = new URL(rawImageUrl, targetUrl).toString();
        } catch {
          // mantém como está
        }
      }

      rawBrand =
        $('meta[property="product:brand"]').attr('content') ||
        $('meta[name="brand"]').attr('content') ||
        '';

      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const text = $(el).html();
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed['@type'] === 'Product' || parsed['@type'] === 'IndividualProduct') {
              jsonLdData = parsed;
            } else if (Array.isArray(parsed)) {
              const found = parsed.find((p) => p['@type'] === 'Product');
              if (found) jsonLdData = found;
            }
          }
        } catch {
          // json malformado ignorado
        }
      });

      $('script, style, noscript, svg, nav, footer, header').remove();
      cleanBodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);
    }

    // Dedução de marca pelo domínio caso não tenha vindo explícito
    if (!rawBrand) {
      if (targetUrl.includes('whiskas')) rawBrand = 'Whiskas';
      else if (targetUrl.includes('premierpet')) rawBrand = 'PremieR Pet';
      else if (targetUrl.includes('royalcanin')) rawBrand = 'Royal Canin';
      else if (targetUrl.includes('purina')) rawBrand = 'Purina';
      else if (targetUrl.includes('farmina')) rawBrand = 'Farmina';
      else if (targetUrl.includes('zeedog')) rawBrand = 'Zee.Dog';
      else if (targetUrl.includes('golden')) rawBrand = 'Golden';
      else if (targetUrl.includes('origens')) rawBrand = 'Origens';
      else if (targetUrl.includes('chocat') || targetUrl.includes('pipicat')) rawBrand = 'Pipicat';
    }

    // Identificação de loja parceira conhecida pela URL
    let detectedStore: { store: string; productUrl: string } | null = null;
    if (/amazon\.com\.br/i.test(targetUrl)) {
      detectedStore = { store: 'amazon', productUrl: targetUrl };
    } else if (/mercadolivre\.com\.br/i.test(targetUrl)) {
      detectedStore = { store: 'mercadolivre', productUrl: targetUrl };
    } else if (/petlove\.com\.br/i.test(targetUrl)) {
      detectedStore = { store: 'petlove', productUrl: targetUrl };
    } else if (/cobasi\.com\.br/i.test(targetUrl)) {
      detectedStore = { store: 'cobasi', productUrl: targetUrl };
    } else if (/shopee\.com\.br/i.test(targetUrl)) {
      detectedStore = { store: 'shopee', productUrl: targetUrl };
    }

    // 4. Enriquecimento via Google Gemini AI
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    // Metadados brutos padrão para fallback
    const fallbackData = {
      title: rawTitle.slice(0, 100) || 'Produto Pet',
      brand: rawBrand || '',
      species: /gato|felin/i.test(rawTitle + cleanBodyText) ? 'gatos' : 'caes',
      productType: /petisco/i.test(rawTitle)
        ? 'Petisco'
        : /areia/i.test(rawTitle)
        ? 'Areia sanitária'
        : 'Ração seca',
      imageUrl: rawImageUrl,
      description: rawDescription || cleanBodyText.slice(0, 280),
      detectedStore: detectedStore ? detectedStore.store : null,
      store: detectedStore,
    };

    if (!geminiApiKey) {
      // Fallback normal de metadados brutos caso chave da IA não esteja configurada
      return NextResponse.json({
        success: true,
        source: 'metadata_only',
        aiWarning: true,
        warning: 'Aviso: Chave GEMINI_API_KEY não configurada no .env. Dados básicos preenchidos via metadados brutos da página.',
        title: fallbackData.title,
        brand: fallbackData.brand,
        species: fallbackData.species,
        productType: fallbackData.productType,
        imageUrl: fallbackData.imageUrl,
        description: fallbackData.description,
        detectedStore: fallbackData.detectedStore,
        data: fallbackData,
      });
    }

    try {
      // Inicializa o SDK oficial do Google GenAI
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const prompt = `Você é um redator sênior especialista em e-commerce pet e engenharia de catálogo do PetRankings (portal brasileiro de comparações de produtos para cães e gatos).

Analise os dados reais extraídos desta página de produto:
- URL de Origem: ${targetUrl}
- Título Detectado: ${rawTitle}
- Meta Descrição: ${rawDescription}
- Imagem Detectada: ${rawImageUrl}
- Marca Detectada: ${rawBrand}
- JSON-LD estruturado: ${jsonLdData ? JSON.stringify(jsonLdData).slice(0, 1500) : 'Nenhum'}
- Conteúdo textual da página: ${cleanBodyText.slice(0, 5000)}

Responda EXCLUSIVAMENTE em formato JSON com o seguinte formato:
{
  "title": string,
  "brand": string,
  "species": "caes" | "gatos",
  "productType": string,
  "imageUrl": string,
  "description": string
}

Diretrizes Obrigatórias de Qualidade e SEO:
1. "title" (máx 70 caracteres):
   - Estrutura: [Tipo de Produto] [Marca] [Linha/Diferencial Principal] [Peso/Tamanho se houver].
   - Exemplo: "Petisco Whiskas Pelo Saudável para Gatos Adultos 40g"
2. "brand": Nome exato da marca fabricante (ex: Whiskas, Royal Canin, PremieR Pet, Farmina, Purina, Zee.Dog).
3. "species": Estritamente "caes" ou "gatos".
4. "productType": Categoria principal em português (ex: "Petisco", "Ração seca", "Ração úmida", "Areia sanitária", "Brinquedo", "Higiene").
5. "imageUrl": URL absoluta da imagem principal do produto (${rawImageUrl || 'vazio'}).
6. "description" (45 a 60 palavras / 250 a 320 caracteres):
   - Frase 1: O que é o produto, marca fabricante e indicação (porte, fase da vida ou necessidade).
   - Frase 2: 2 a 3 benefícios ou diferenciais concretos e objetivos (ex: textura crocante, pele e pelagem brilhante, nutrientes essenciais).
   - Frase 3: Variações de sabores ou tamanhos disponíveis, se houver.
   - Tom: Neutro, informativo e acolhedor para tutores. Não faça alegações veterinárias de cura e não use clichês publicitários.`;

      let responseText = '';
      const candidateModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.5-flash'];
      const failedModelNames: string[] = [];

      for (const model of candidateModels) {
        try {
          const geminiResponse = await ai.models.generateContent({
            model,
            contents: prompt,
          });
          responseText = geminiResponse.text?.trim() || '';
          if (responseText) break;
        } catch (mErr: unknown) {
          failedModelNames.push(model);
          console.warn(`Tentativa com ${model} falhou, tentando próximo modelo:`, mErr);
        }
      }

      if (!responseText) {
        throw new Error(
          `Nenhum modelo de IA (${candidateModels.join(', ')}) respondeu no momento.`
        );
      }

      // Limpa possíveis blocos ```json ... ``` do markdown
      const cleanedJsonText = responseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();

      let parsedData: {
        title?: string;
        brand?: string;
        species?: string;
        productType?: string;
        imageUrl?: string;
        description?: string;
      } = {};

      try {
        parsedData = JSON.parse(cleanedJsonText);
      } catch {
        // Tenta encontrar o primeiro objeto {...} no texto
        const match = cleanedJsonText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedData = JSON.parse(match[0]);
          } catch {
            console.error('Falha ao parsear JSON retornado pelo Gemini:', responseText);
          }
        }
      }

      const finalProduct = {
        title: parsedData.title || fallbackData.title,
        brand: parsedData.brand || fallbackData.brand,
        species: parsedData.species === 'gatos' ? 'gatos' : fallbackData.species,
        productType: parsedData.productType || fallbackData.productType,
        imageUrl: parsedData.imageUrl || fallbackData.imageUrl,
        description: parsedData.description || fallbackData.description,
        detectedStore: detectedStore ? detectedStore.store : null,
        store: detectedStore,
      };

      return NextResponse.json({
        success: true,
        source: 'gemini_ai',
        warning: isRenderedByJina
          ? 'Página protegida por Cloudflare renderizada com sucesso via navegador na nuvem! Dados e foto oficial extraídos.'
          : undefined,
        title: finalProduct.title,
        brand: finalProduct.brand,
        species: finalProduct.species,
        productType: finalProduct.productType,
        imageUrl: finalProduct.imageUrl,
        description: finalProduct.description,
        detectedStore: finalProduct.detectedStore,
        data: finalProduct,
      });
    } catch (aiErr: unknown) {
      const errorMsg = aiErr instanceof Error ? aiErr.message : 'Erro ao consultar os modelos de IA';
      console.warn('Aviso Gemini (usando fallback de metadados):', errorMsg);

      // Se a IA falhar (ex: modelos temporariamente sobrecarregados, cota ou indisponibilidade), NÃO trava o usuário:
      // Retorna os metadados brutos e a foto oficial com aviso explícito e transparente!
      return NextResponse.json({
        success: true,
        source: 'metadata_fallback',
        aiWarning: true,
        warning:
          'Aviso de IA: Nenhum modelo de inteligência artificial (Gemini) respondeu no momento (devido a alta demanda ou instabilidade temporária na API). Os campos básicos e a foto oficial foram preenchidos a partir dos dados reais da página para você não perder tempo.',
        title: fallbackData.title,
        brand: fallbackData.brand,
        species: fallbackData.species,
        productType: fallbackData.productType,
        imageUrl: fallbackData.imageUrl,
        description: fallbackData.description,
        detectedStore: fallbackData.detectedStore,
        data: fallbackData,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno durante a extração';
    console.error('Erro geral na extração:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
