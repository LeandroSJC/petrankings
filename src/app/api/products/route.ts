import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recalculateProductRating } from '@/lib/ranking-engine';
import { VALID_STORES, validateStoreUrl, StoreKey } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const species = searchParams.get('species');
    const productType = searchParams.get('productType');
    const sort = searchParams.get('sort') || 'recent'; // recent | oldest | unreviewed | name
    const q = searchParams.get('q');

    const where: Record<string, unknown> = {};

    if (species && species !== 'todos') {
      where.species = species;
    }

    if (productType && productType !== 'todos') {
      where.productType = productType;
    }

    if (q && q.trim()) {
      where.OR = [
        { title: { contains: q.trim() } },
        { brand: { contains: q.trim() } },
        { productType: { contains: q.trim() } },
      ];
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        stores: true,
        rankings: {
          include: {
            ranking: true,
          },
        },
      },
    });

    // Ordenação conforme Seção 7.2
    products = products.sort((a, b) => {
      if (sort === 'name') {
        return a.title.localeCompare(b.title, 'pt-BR');
      }

      if (sort === 'unreviewed') {
        const aHasReview = a.ratingUpdatedAt !== null;
        const bHasReview = b.ratingUpdatedAt !== null;
        if (!aHasReview && bHasReview) return -1;
        if (aHasReview && !bHasReview) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sort === 'oldest') {
        const aDate = a.ratingUpdatedAt ? new Date(a.ratingUpdatedAt).getTime() : 0;
        const bDate = b.ratingUpdatedAt ? new Date(b.ratingUpdatedAt).getTime() : 0;
        return aDate - bDate;
      }

      // 'recent' (default)
      const aDate = a.ratingUpdatedAt ? new Date(a.ratingUpdatedAt).getTime() : new Date(a.createdAt).getTime();
      const bDate = b.ratingUpdatedAt ? new Date(b.ratingUpdatedAt).getTime() : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    // Calcular quantos itens precisam de revisão (>30 dias ou sem revisão)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const needsReviewCount = products.filter(
      (p) => !p.ratingUpdatedAt || new Date(p.ratingUpdatedAt) < thirtyDaysAgo
    ).length;

    return NextResponse.json({
      products,
      totalCount: products.length,
      needsReviewCount,
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await req.json();
    const { title, species, productType, brand, description, imageUrl, stores } = body;

    // Validações Seção 4.3 e 7.3
    if (!title || title.trim().length < 3 || title.trim().length > 220) {
      return NextResponse.json(
        { error: 'O título do produto deve conter entre 3 e 220 caracteres' },
        { status: 400 }
      );
    }

    if (!species || !['caes', 'gatos'].includes(species)) {
      return NextResponse.json(
        { error: 'A espécie deve ser "caes" ou "gatos"' },
        { status: 400 }
      );
    }

    if (!productType || productType.trim().length < 2 || productType.trim().length > 120) {
      return NextResponse.json(
        { error: 'O tipo de produto deve conter entre 2 e 120 caracteres' },
        { status: 400 }
      );
    }

    if (brand && brand.length > 120) {
      return NextResponse.json(
        { error: 'A marca pode ter no máximo 120 caracteres' },
        { status: 400 }
      );
    }

    if (description && description.length > 3000) {
      return NextResponse.json(
        { error: 'A descrição pode ter no máximo 3.000 caracteres' },
        { status: 400 }
      );
    }

    if (!Array.isArray(stores) || stores.length === 0) {
      return NextResponse.json(
        { error: 'O produto deve possuir ao menos uma loja vinculada' },
        { status: 400 }
      );
    }

    // Verificar unicidade de lojas por produto
    const seenStores = new Set<string>();
    for (const st of stores) {
      if (!VALID_STORES.includes(st.store as StoreKey)) {
        return NextResponse.json(
          { error: `Loja inválida: ${st.store}` },
          { status: 400 }
        );
      }
      if (seenStores.has(st.store)) {
        return NextResponse.json(
          { error: `A loja "${st.store}" foi informada mais de uma vez` },
          { status: 400 }
        );
      }
      seenStores.add(st.store);

      if (!st.productUrl || typeof st.productUrl !== 'string') {
        return NextResponse.json(
          { error: `O endereço da página do produto é obrigatório para a loja ${st.store}` },
          { status: 400 }
        );
      }
    }

    // Criar o produto
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        species,
        productType: productType.trim(),
        brand: brand ? brand.trim() : null,
        description: description ? description.trim() : null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        stores: {
          create: stores.map((s: { store: string; productUrl: string; affiliateUrl?: string; rating?: number; reviewCount?: number }) => ({
            store: s.store,
            productUrl: s.productUrl.trim(),
            affiliateUrl: s.affiliateUrl ? s.affiliateUrl.trim() : null,
            rating: s.rating !== undefined && s.rating !== null && s.rating >= 0 && s.rating <= 5 ? Number(s.rating) : null,
            reviewCount: s.reviewCount !== undefined && s.reviewCount !== null && s.reviewCount >= 0 ? Number(s.reviewCount) : null,
          })),
        },
      },
    });

    // Calcular nota média inicial
    await recalculateProductRating(product.id);

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { stores: true, rankings: true },
    });

    return NextResponse.json({ success: true, product: fullProduct });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
