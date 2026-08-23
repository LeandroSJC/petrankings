import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://petrankings.com.br';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/ranking/', '/sobre', '/contato'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
