import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://petrankings.com.br';

  // 1. Páginas estáticas principais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Rankings publicados dinâmicos
  try {
    const rankings = await prisma.ranking.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        dataUpdatedAt: true,
        updatedAt: true,
      },
    });

    const rankingRoutes: MetadataRoute.Sitemap = rankings.map((ranking) => ({
      url: `${siteUrl}/ranking/${ranking.slug}`,
      lastModified: ranking.dataUpdatedAt || ranking.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    return [...staticRoutes, ...rankingRoutes];
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
    return staticRoutes;
  }
}
