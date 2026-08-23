import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { validateTaxonomyCompatibility } from '@/lib/ranking-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        rankings: {
          include: {
            ranking: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const linkedRankingIds = product.rankings.map((r) => r.rankingId);

    // Buscar rankings compatíveis que ainda não contêm o produto
    const allCompatibleRankings = await prisma.ranking.findMany({
      where: {
        species: product.species,
      },
      orderBy: { title: 'asc' },
    });

    const compatibleRankings = allCompatibleRankings.filter((rk) =>
      validateTaxonomyCompatibility(product.species, product.productType, rk.species, rk.productType)
    );

    const availableRankings = compatibleRankings.filter(
      (rk) => !linkedRankingIds.includes(rk.id)
    );

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        species: product.species,
        productType: product.productType,
      },
      linkedRankings: product.rankings.map((r) => r.ranking),
      availableRankings,
    });
  } catch (error) {
    console.error('Erro ao obter vínculos de ranking:', error);
    return NextResponse.json({ error: 'Erro ao obter vínculos de ranking' }, { status: 500 });
  }
}

export async function POST(
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
    const { rankingId, action } = body; // action: 'link' | 'unlink'

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const ranking = await prisma.ranking.findUnique({ where: { id: rankingId } });
    if (!ranking) {
      return NextResponse.json({ error: 'Ranking não encontrado' }, { status: 404 });
    }

    if (action === 'link') {
      // Validar compatibilidade
      if (
        !validateTaxonomyCompatibility(
          product.species,
          product.productType,
          ranking.species,
          ranking.productType
        )
      ) {
        return NextResponse.json(
          {
            error: `Incompatibilidade de categoria: O produto "${product.title}" (${product.species}/${product.productType}) não pode ser associado ao ranking "${ranking.title}" (${ranking.species}/${ranking.productType}).`,
          },
          { status: 400 }
        );
      }

      await prisma.rankingProduct.upsert({
        where: {
          rankingId_productId: {
            rankingId,
            productId: id,
          },
        },
        create: {
          rankingId,
          productId: id,
        },
        update: {},
      });

      // Atualizar data do ranking
      await prisma.ranking.update({
        where: { id: rankingId },
        data: { dataUpdatedAt: new Date() },
      });

      return NextResponse.json({ success: true, message: 'Produto vinculado ao ranking com sucesso' });
    } else if (action === 'unlink') {
      await prisma.rankingProduct.deleteMany({
        where: {
          rankingId,
          productId: id,
        },
      });

      // Atualizar data do ranking
      await prisma.ranking.update({
        where: { id: rankingId },
        data: { dataUpdatedAt: new Date() },
      });

      return NextResponse.json({ success: true, message: 'Vínculo removido com sucesso' });
    }

    return NextResponse.json({ error: 'Ação inválida. Use "link" ou "unlink"' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao gerenciar vínculo:', error);
    return NextResponse.json({ error: 'Erro ao gerenciar vínculo' }, { status: 500 });
  }
}
