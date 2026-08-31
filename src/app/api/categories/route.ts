import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [products, rankings] = await Promise.all([
      prisma.product.findMany({
        select: { species: true, productType: true },
      }),
      prisma.ranking.findMany({
        select: { species: true, productType: true },
      }),
    ]);

    const caesCategories = new Map<string, string>();
    const gatosCategories = new Map<string, string>();

    const processItem = (species: string, productType: string | null | undefined) => {
      if (!productType) return;
      const trimmed = productType.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();

      if (species === 'gatos') {
        if (!gatosCategories.has(key)) {
          gatosCategories.set(key, trimmed);
        }
      } else {
        // default caes
        if (!caesCategories.has(key)) {
          caesCategories.set(key, trimmed);
        }
      }
    };

    products.forEach((p) => processItem(p.species, p.productType));
    rankings.forEach((r) => processItem(r.species, r.productType));

    const caes = Array.from(caesCategories.values()).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
    const gatos = Array.from(gatosCategories.values()).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );

    const allMap = new Map<string, string>();
    [...caes, ...gatos].forEach((item) => {
      const key = item.toLowerCase();
      if (!allMap.has(key)) {
        allMap.set(key, item);
      }
    });
    const all = Array.from(allMap.values()).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );

    return NextResponse.json({
      caes,
      gatos,
      all,
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}
