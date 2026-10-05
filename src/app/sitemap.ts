import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/utils';
import { getAllGuides } from '@/lib/content/guides';

// Força execução dinâmica em tempo de execução para evitar que o build (com banco dummy)
// gere um sitemap estático de 21 páginas. O cache de 1 hora é gerenciado via unstable_cache.
export const dynamic = 'force-dynamic';

const getCachedSitemapProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  },
  ['sitemap-products-list'],
  {
    revalidate: 3600, // Cache de 1 hora
    tags: ['sitemap', 'products'],
  }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = SITE_URL;

  // 1. Páginas estáticas, catálogo e categorias oficiais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/catalogo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/comparar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
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

  // 2. Guias e Estudos
  const guides = getAllGuides();
  const guideRoutes: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${siteUrl}/guias/${g.slug}`,
    lastModified: new Date(g.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 3. Produtos analisados dinâmicos com proteção anti-regressão de SEO
  try {
    const products = await getCachedSitemapProducts();

    // Em produção, se a consulta retornar 0 produtos de forma anômala, abortamos
    // para evitar que o Google Search Console desindexe o catálogo inteiro
    if (products.length === 0 && process.env.NODE_ENV === 'production') {
      throw new Error(
        '[Sitemap] Consulta retornou 0 produtos em produção. Abortando para preservar integridade no Google Search Console.'
      );
    }

    const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${siteUrl}/produto/${prod.slug}`,
      lastModified: prod.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...guideRoutes, ...productRoutes];
  } catch (error) {
    console.error('[Sitemap] Erro crítico ao buscar produtos para o sitemap XML:', error);
    // Em produção, nunca retorne sitemap incompleto/mutilado com 200 OK.
    // Lançar o erro força o Next.js a manter o cache válido anterior ou responder 5xx,
    // garantindo que o Googlebot NÃO remova as URLs descobertas da SERP.
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return [...staticRoutes, ...guideRoutes];
  }
}
