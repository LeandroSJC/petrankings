import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recalculateProductRating } from '@/lib/ranking-engine';

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
    const { reviews } = body; // Array de { storeId or storeKey, rating, reviewCount }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { stores: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    if (!Array.isArray(reviews)) {
      return NextResponse.json({ error: 'Formato de avaliações inválido' }, { status: 400 });
    }

    for (const item of reviews) {
      const storeRecord = product.stores.find(
        (s) => s.id === item.storeId || s.store === item.store
      );

      if (storeRecord) {
        let ratingValue: number | null = null;
        if (item.rating !== null && item.rating !== undefined && item.rating !== '') {
          const parsed = parseFloat(item.rating);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
            ratingValue = Math.round(parsed * 10) / 10;
          }
        }

        let reviewCountValue: number | null = null;
        if (item.reviewCount !== null && item.reviewCount !== undefined && item.reviewCount !== '') {
          const parsed = parseInt(item.reviewCount, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            reviewCountValue = parsed;
          }
        }

        await prisma.productStore.update({
          where: { id: storeRecord.id },
          data: {
            rating: ratingValue,
            reviewCount: reviewCountValue,
          },
        });
      }
    }

    // Recalcular média e propagar para todos os rankings vinculados (Seção 5.3)
    const updatedProduct = await recalculateProductRating(id);

    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        stores: true,
        rankings: {
          include: { ranking: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Avaliações atualizadas com sucesso e propagadas para os rankings!',
      product: fullProduct,
    });
  } catch (error) {
    console.error('Erro ao salvar avaliações:', error);
    return NextResponse.json({ error: 'Erro ao salvar avaliações' }, { status: 500 });
  }
}
