import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_POPULAR_STORES = [
  'Petlove',
  'Amazon',
  'Cobasi',
  'Mercado Livre',
  'Shopee',
  'Petz',
  'Polipet',
  'Magazine Luiza',
];

export async function GET() {
  try {
    // Busca nomes de lojas únicas já cadastradas no banco
    const existing = await prisma.affiliateLink.findMany({
      select: { store: true },
      distinct: ['store'],
    });

    const dbStores = existing.map((e) => e.store.trim()).filter(Boolean);

    // Mescla e remove duplicatas (case-insensitive)
    const storeMap = new Map<string, string>();

    for (const s of DEFAULT_POPULAR_STORES) {
      storeMap.set(s.toLowerCase(), s);
    }

    for (const s of dbStores) {
      if (!storeMap.has(s.toLowerCase())) {
        storeMap.set(s.toLowerCase(), s);
      }
    }

    const stores = Array.from(storeMap.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Erro ao buscar sugestões de lojas:', error);
    return NextResponse.json({ stores: DEFAULT_POPULAR_STORES });
  }
}
