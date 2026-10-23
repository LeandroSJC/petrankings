import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/catalogo',
          '/comparar',
          '/guias',
          '/guias/',
          '/indice/',
          '/produto/',
          '/coadjuvantes',
          '/fabricante',
          '/sobre',
          '/contato',
          '/politica-de-privacidade',
          '/calculadora',
          '/llms.txt',
        ],
        disallow: [
          '/admin/',
          '/admin',
          '/api/',
          '/bastidores',
          '/gerenciar',
          '/fabricante?*',
          '/uploads/*.html',
          '/uploads/ficha_*',
          '/uploads/raw_ficha_*',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
