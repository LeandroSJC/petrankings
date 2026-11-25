import prisma from '@/lib/prisma';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export interface ProductVisitMetrics {
  views: number;
  visitors: number;
}

export interface ProductAnalyticsResult {
  available: boolean;
  period: AnalyticsPeriod;
  metricsBySlug: Record<string, ProductVisitMetrics>;
  totalViews: number;
}

export interface TopVisitedProductItem {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  species: string;
  scoreTotal: number | null;
  legalCategory: string;
  views: number;
  visitors: number;
}

export interface TopVisitedProductsResult {
  available: boolean;
  period: AnalyticsPeriod;
  totalViews: number;
  items: TopVisitedProductItem[];
}

interface RawUmamiProductVisit {
  slug: string;
  views: number;
  visitors: number;
}

export function parseAnalyticsPeriod(raw?: string | null): AnalyticsPeriod {
  if (raw === '7d' || raw === '30d' || raw === '90d' || raw === 'all') {
    return raw;
  }
  return '30d';
}

function getDateFilterClause(period: AnalyticsPeriod): string {
  switch (period) {
    case '7d':
      return "AND created_at >= NOW() - INTERVAL '7 days'";
    case '30d':
      return "AND created_at >= NOW() - INTERVAL '30 days'";
    case '90d':
      return "AND created_at >= NOW() - INTERVAL '90 days'";
    case 'all':
      return '';
  }
}

/**
 * Agrega visitas (pageviews) e visitantes únicos por slug de produto
 * diretamente da tabela `website_event` do Umami mapeada via postgres_fdw.
 * Em ambiente local sem FDW, retorna fallback seguro (`available: false`).
 */
export async function getProductVisitsBySlug(
  period: AnalyticsPeriod = '30d'
): Promise<ProductAnalyticsResult> {
  try {
    const dateClause = getDateFilterClause(period);

    const rows = await prisma.$queryRawUnsafe<RawUmamiProductVisit[]>(`
      SELECT
        SPLIT_PART(REGEXP_REPLACE(url_path, '^/produto/', ''), '/', 1) AS slug,
        COUNT(1)::int AS views,
        COUNT(DISTINCT session_id)::int AS visitors
      FROM website_event
      WHERE event_type = 1
        AND url_path LIKE '/produto/%'
        ${dateClause}
      GROUP BY 1
      ORDER BY views DESC;
    `);

    const metricsBySlug: Record<string, ProductVisitMetrics> = {};
    let totalViews = 0;

    for (const row of rows) {
      const slug = row.slug?.trim();
      if (!slug) continue;

      const views = Number(row.views) || 0;
      const visitors = Number(row.visitors) || 0;

      if (metricsBySlug[slug]) {
        metricsBySlug[slug].views += views;
        metricsBySlug[slug].visitors += visitors;
      } else {
        metricsBySlug[slug] = { views, visitors };
      }
      totalViews += views;
    }

    return {
      available: true,
      period,
      metricsBySlug,
      totalViews,
    };
  } catch {
    return {
      available: false,
      period,
      metricsBySlug: {},
      totalViews: 0,
    };
  }
}

/**
 * Retorna os produtos cadastrados mais visitados no período informado,
 * cruzando os slugs do Umami com o catálogo oficial no PostgreSQL.
 */
export async function getTopVisitedProducts(
  period: AnalyticsPeriod = '30d',
  limit = 6
): Promise<TopVisitedProductsResult> {
  const analytics = await getProductVisitsBySlug(period);

  if (!analytics.available) {
    return {
      available: false,
      period,
      totalViews: 0,
      items: [],
    };
  }

  const rankedSlugs = Object.entries(analytics.metricsBySlug)
    .filter(([, m]) => m.views > 0)
    .sort((a, b) => b[1].views - a[1].views);

  if (rankedSlugs.length === 0) {
    return {
      available: true,
      period,
      totalViews: analytics.totalViews,
      items: [],
    };
  }

  // Busca margem extra de slugs para compensar eventuais URLs antigas ou não cadastradas
  const candidateSlugs = rankedSlugs.slice(0, limit * 3).map(([slug]) => slug);

  const products = await prisma.product.findMany({
    where: {
      slug: { in: candidateSlugs },
    },
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      species: true,
      scoreTotal: true,
      legalCategory: true,
    },
  });

  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const items: TopVisitedProductItem[] = [];

  for (const [slug, metrics] of rankedSlugs) {
    const product = productBySlug.get(slug);
    if (!product) continue;

    items.push({
      ...product,
      views: metrics.views,
      visitors: metrics.visitors,
    });

    if (items.length >= limit) break;
  }

  return {
    available: true,
    period,
    totalViews: analytics.totalViews,
    items,
  };
}
