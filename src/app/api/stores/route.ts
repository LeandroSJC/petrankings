import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Busca nomes únicos de lojas e varejistas já cadastrados no banco
    const existing = await prisma.affiliateLink.findMany({
      select: { store: true },
      distinct: ['store'],
    });

    const stores = Array.from(
      new Set(
        existing
          .map((e) => e.store?.trim())
          .filter((s): s is string => Boolean(s))
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Erro ao buscar sugestões de lojas cadastradas:', error);
    return NextResponse.json({ stores: [] });
  }
}
