import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sortRankingProducts } from '@/lib/ranking-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const isAdmin = session?.role === 'admin';

    // Permite busca por ID ou por Slug
    const ranking = await prisma.ranking.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                stores: true,
              },
            },
          },
        },
      },
    });

    if (!ranking) {
      return NextResponse.json({ error: 'Ranking não encontrado' }, { status: 404 });
    }

    if (!ranking.isPublished && !isAdmin) {
      return NextResponse.json({ error: 'Ranking não disponível' }, { status: 404 });
    }

    // Extrair os produtos e ordenar dinamicamente pelas regras da Seção 5.2
    const rawProducts = ranking.products.map((rp) => rp.product);
    const sortedProducts = sortRankingProducts(rawProducts);

    return NextResponse.json({
      ranking: {
        id: ranking.id,
        slug: ranking.slug,
        title: ranking.title,
        species: ranking.species,
        productType: ranking.productType,
        description: ranking.description,
        isPublished: ranking.isPublished,
        dataUpdatedAt: ranking.dataUpdatedAt,
        createdAt: ranking.createdAt,
        products: sortedProducts,
      },
    });
  } catch (error) {
    console.error('Erro ao obter ranking:', error);
    return NextResponse.json({ error: 'Erro ao obter ranking' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, species, productType, description, isPublished } = body;

    const existing = await prisma.ranking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Ranking não encontrado' }, { status: 404 });
    }

    if (title && (title.trim().length < 3 || title.trim().length > 180)) {
      return NextResponse.json(
        { error: 'O título deve conter entre 3 e 180 caracteres' },
        { status: 400 }
      );
    }

    if (species && !['caes', 'gatos'].includes(species)) {
      return NextResponse.json(
        { error: 'A espécie deve ser "caes" ou "gatos"' },
        { status: 400 }
      );
    }

    if (productType && (productType.trim().length < 2 || productType.trim().length > 120)) {
      return NextResponse.json(
        { error: 'O tipo de produto deve conter entre 2 e 120 caracteres' },
        { status: 400 }
      );
    }

    const updated = await prisma.ranking.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        species: species || existing.species,
        productType: productType ? productType.trim() : existing.productType,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : existing.isPublished,
      },
    });

    return NextResponse.json({ success: true, ranking: updated });
  } catch (error) {
    console.error('Erro ao atualizar ranking:', error);
    return NextResponse.json({ error: 'Erro ao atualizar ranking' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.ranking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Ranking não encontrado' }, { status: 404 });
    }

    // Excluir ranking: remove os vínculos (cascade no RankingProduct) e preserva os produtos
    await prisma.ranking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Ranking excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ranking:', error);
    return NextResponse.json({ error: 'Erro ao excluir ranking' }, { status: 500 });
  }
}
