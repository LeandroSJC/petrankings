import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/utils';

export const revalidate = 3600; // Revalida o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = SITE_URL;

  // 1. Páginas estáticas e categorias oficiais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/indice/caes-adultos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/indice/caes-filhotes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/indice/gatos-adultos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/indice/gatos-filhotes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/coadjuvantes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/fabricante`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Produtos analisados dinâmicos
  try {
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${siteUrl}/produto/${prod.slug}`,
      lastModified: prod.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
    return staticRoutes;
  }
}
