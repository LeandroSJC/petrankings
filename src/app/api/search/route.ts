import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Expande variações com e sem acentos comuns em Português
function getSearchVariants(raw: string): string[] {
  const lower = raw.toLowerCase().trim();
  const variants = new Set<string>([lower]);

  // Normalização de acentos (NFD)
  const unaccented = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  variants.add(unaccented);

  // Mapeamentos específicos de termos populares do universo pet brasileiro
  const petTermsMap: Record<string, string[]> = {
    racao: ['ração', 'rações', 'racao'],
    ração: ['racao', 'rações'],
    racoes: ['rações', 'ração', 'racao'],
    rações: ['racoes', 'ração', 'racao'],
    caes: ['cães', 'cão', 'cao', 'caes'],
    cães: ['caes', 'cão', 'cao'],
    cao: ['cão', 'cães', 'caes'],
    cão: ['cao', 'cães', 'caes'],
    gatos: ['gato', 'gatas', 'felinos'],
    gato: ['gatos', 'felinos'],
    sache: ['sachê', 'saches', 'sachês'],
    sachê: ['sache', 'saches', 'sachês'],
    saches: ['sachês', 'sache', 'sachê'],
    sachês: ['saches', 'sache', 'sachê'],
    areia: ['areias', 'granulado', 'higienica', 'higiênica'],
    sanitaria: ['sanitária', 'sanitaria'],
    sanitária: ['sanitaria'],
    petisco: ['petiscos', 'snack', 'snacks'],
    filhote: ['filhotes', 'puppy', 'junior'],
    senior: ['sênior', 'idoso', 'mature'],
    sênior: ['senior', 'idoso'],
    castrado: ['castrados', 'esterilizado'],
    castrados: ['castrado', 'esterilizados'],
  };

  // Checa correspondência direta ou por palavras parciais
  for (const [key, list] of Object.entries(petTermsMap)) {
    if (lower.includes(key) || unaccented.includes(key)) {
      list.forEach((variant) => variants.add(variant));
    }
  }

  return Array.from(variants);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ rankings: [], products: [] });
    }

    const variants = getSearchVariants(query);

    // Condições OR dinâmicas para rankings
    const rankingOrConditions = variants.flatMap((v) => [
      { title: { contains: v, mode: 'insensitive' as const } },
      { productType: { contains: v, mode: 'insensitive' as const } },
      { description: { contains: v, mode: 'insensitive' as const } },
    ]);

    // Condições OR dinâmicas para produtos
    const productOrConditions = variants.flatMap((v) => [
      { title: { contains: v, mode: 'insensitive' as const } },
      { brand: { contains: v, mode: 'insensitive' as const } },
      { productType: { contains: v, mode: 'insensitive' as const } },
    ]);

    // Busca concorrente de rankings publicados e produtos no PostgreSQL
    const [rankings, products] = await Promise.all([
      prisma.ranking.findMany({
        where: {
          isPublished: true,
          OR: rankingOrConditions,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          species: true,
          productType: true,
          _count: {
            select: { products: true },
          },
        },
        take: 4,
      }),

      prisma.product.findMany({
        where: {
          OR: productOrConditions,
        },
        select: {
          id: true,
          title: true,
          brand: true,
          species: true,
          productType: true,
          imageUrl: true,
          averageRating: true,
          rankings: {
            where: {
              ranking: { isPublished: true },
            },
            select: {
              ranking: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
            take: 1,
          },
        },
        take: 4,
      }),
    ]);

    return NextResponse.json(
      {
        rankings,
        products,
        totalFound: rankings.length + products.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Erro na rota de busca instantânea:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a busca' },
      { status: 500 }
    );
  }
}
