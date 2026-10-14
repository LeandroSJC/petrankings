import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { ComparisonPreset, POPULAR_COMPARISON_PRESETS } from '@/lib/comparator';

interface RawUmamiComparisonEvent {
  url_query: string;
  total: number;
}

/**
 * Busca os duelos mais acessados com base nos dados reais do Umami Analytics.
 * Opera com cache inteligente (unstable_cache de 6 horas) e validação cruzada no catálogo.
 * Aplica fallback transparente para POPULAR_COMPARISON_PRESETS em dev local ou baixo volume.
 */
export const getPopularComparisonPresets = unstable_cache(
  async (): Promise<ComparisonPreset[]> => {
    try {
      // 1. Consulta analítica na tabela do Umami (mapeada no PostgreSQL via postgres_fdw)
      const events = await prisma.$queryRawUnsafe<RawUmamiComparisonEvent[]>(`
        SELECT url_query, count(1)::int as total
        FROM website_event
        WHERE url_path = '/comparar'
          AND url_query LIKE '%p1=%'
          AND url_query LIKE '%p2=%'
        GROUP BY url_query
        ORDER BY count(1) DESC
        LIMIT 15;
      `);

      if (!events || events.length === 0) {
        return POPULAR_COMPARISON_PRESETS;
      }

      // 2. Extrai e desduplica os pares de slugs (garante ordem simétrica A vs B == B vs A)
      const pairs: Array<{ p1: string; p2: string; total: number }> = [];
      const seenPairs = new Set<string>();

      for (const ev of events) {
        try {
          const params = new URLSearchParams(ev.url_query);
          const p1 = params.get('p1')?.trim();
          const p2 = params.get('p2')?.trim();

          if (p1 && p2 && p1 !== p2) {
            const pairKey = [p1, p2].sort().join('::');
            if (!seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              pairs.push({ p1, p2, total: Number(ev.total) });
            }
          }
        } catch {
          // Ignora strings de query malformadas
        }
      }

      if (pairs.length === 0) {
        return POPULAR_COMPARISON_PRESETS;
      }

      // 3. Validação cruzada no catálogo oficial (confere se ambos os produtos existem e estão publicados)
      const allSlugs = Array.from(new Set(pairs.flatMap((p) => [p.p1, p.p2])));
      const products = await prisma.product.findMany({
        where: {
          slug: { in: allSlugs },
          isPublished: true,
        },
        select: {
          slug: true,
          commercialName: true,
          brand: true,
          species: true,
        },
      });

      const productMap = new Map(products.map((p) => [p.slug, p]));
      const dynamicPresets: ComparisonPreset[] = [];

      for (const pair of pairs) {
        const prod1 = productMap.get(pair.p1);
        const prod2 = productMap.get(pair.p2);

        // Ambos devem existir, estar publicados e pertencer à mesma espécie (coerência zootécnica)
        if (prod1 && prod2 && prod1.species === prod2.species) {
          const title =
            prod1.brand.toLowerCase() !== prod2.brand.toLowerCase()
              ? `${prod1.brand} vs ${prod2.brand}`
              : `${prod1.commercialName.split(' ')[0]} ${prod1.commercialName.split(' ')[1] || ''} vs ${prod2.commercialName.split(' ')[0]} ${prod2.commercialName.split(' ')[1] || ''}`.trim();

          dynamicPresets.push({
            id: `analytics-${prod1.slug}-vs-${prod2.slug}`,
            title,
            tag: `${prod1.species === 'CAO' ? 'Cães' : 'Gatos'} • Duelo Mais Buscado`,
            species: prod1.species as 'CAO' | 'GATO',
            p1: prod1.slug,
            p2: prod2.slug,
            description: `Confronto nutricional em alta procura entre ${prod1.commercialName} e ${prod2.commercialName}.`,
          });
        }

        if (dynamicPresets.length >= 4) break;
      }

      // 4. Se obteve pelo menos 2 duelos analíticos válidos, complementa até 4 com os presets curados
      if (dynamicPresets.length >= 2) {
        const existingKeys = new Set(
          dynamicPresets.map((dp) => [dp.p1, dp.p2].sort().join('::'))
        );

        for (const fallback of POPULAR_COMPARISON_PRESETS) {
          const key = [fallback.p1, fallback.p2].sort().join('::');
          if (!existingKeys.has(key) && dynamicPresets.length < 4) {
            dynamicPresets.push(fallback);
          }
        }

        return dynamicPresets;
      }

      // Se houver menos de 2 duelos analíticos com volume suficiente, usa os presets de referência
      return POPULAR_COMPARISON_PRESETS;
    } catch {
      // Fallback transparente e resiliente para dev local (onde não há Umami) ou falha de rede
      return POPULAR_COMPARISON_PRESETS;
    }
  },
  ['popular-comparisons-analytics'],
  {
    revalidate: 21600, // 6 horas
    tags: ['comparisons', 'analytics'],
  }
);
