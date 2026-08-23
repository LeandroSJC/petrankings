import { NextResponse } from 'next/server';

/**
 * Rota obrigatória do Google AdSense (/ads.txt).
 * Retorna a linha de autorização para rastreamento de anúncios programáticos.
 */
export async function GET() {
  const rawClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-2889031150261887';
  const publisherId = rawClientId.replace(/^ca-/, '');

  const content = `# PetRankings Google AdSense Authorized Digital Sellers
google.com, ${publisherId}, DIRECT, f08c47fec0942fa0
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
