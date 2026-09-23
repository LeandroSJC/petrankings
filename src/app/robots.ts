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
          '/llms.txt',
          '/indice/',
          '/produto/',
          '/coadjuvantes',
          '/fabricante',
          '/sobre',
          '/contato',
          '/politica-de-privacidade',
        ],
        disallow: ['/admin/', '/api/', '/fabricante?*'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
