import { NextResponse } from 'next/server';
import { getAllGuides } from '@/lib/content/guides';
import { SITE_URL } from '@/lib/utils';

export const revalidate = 3600; // Cache de 1 hora

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const siteUrl = SITE_URL.replace(/\/$/, '');
  const guides = getAllGuides();

  const latestBuildDate = guides.length > 0
    ? new Date(guides[0].updatedAt + 'T12:00:00Z').toUTCString()
    : new Date().toUTCString();

  const itemsXml = guides
    .map((guide) => {
      const guideUrl = `${siteUrl}/guias/${guide.slug}`;
      const pubDate = new Date(guide.publishedAt + 'T12:00:00Z').toUTCString();
      const imageUrl = guide.coverImageUrl.startsWith('http')
        ? guide.coverImageUrl
        : `${siteUrl}${guide.coverImageUrl}`;

      return `    <item>
      <title>${escapeXml(guide.title)}</title>
      <link>${guideUrl}</link>
      <guid isPermaLink="true">${guideUrl}</guid>
      <description>${escapeXml(guide.summary || guide.subtitle)}</description>
      <category>${escapeXml(guide.cluster)}</category>
      <category>${escapeXml(guide.speciesTarget)}</category>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${escapeXml(guide.author.name)}</dc:creator>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(imageUrl)}" type="image/webp" length="0" />
    </item>`;
    })
    .join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>PetRankings — Estudos Bromatológicos e Guias Técnicos</title>
    <link>${siteUrl}/guias</link>
    <description>Observatório independente de nutrição pet no Brasil: duelos de marcas, análises bromatológicas em Matéria Seca (MS) e confronto de rótulos com base na ABINPET e MAPA.</description>
    <language>pt-BR</language>
    <lastBuildDate>${latestBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
