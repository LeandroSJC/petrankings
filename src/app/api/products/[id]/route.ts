import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recalculateProductRating, checkProductDeletionSafety } from '@/lib/ranking-engine';
import { VALID_STORES, StoreKey } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stores: true,
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

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    return NextResponse.json({ error: 'Erro ao obter produto' }, { status: 500 });
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
    const { title, species, productType, brand, description, imageUrl, stores } = body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { stores: true, rankings: { include: { ranking: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Se a espécie ou tipo de produto mudar, verificar se os rankings atuais continuam compatíveis
    const targetSpecies = species || existing.species;
    const targetType = productType ? productType.trim() : existing.productType;

    for (const rp of existing.rankings) {
      if (
        rp.ranking.species !== targetSpecies ||
        rp.ranking.productType.toLowerCase() !== targetType.toLowerCase()
      ) {
        return NextResponse.json(
          {
            error: `Não é possível alterar a categoria para "${targetSpecies} - ${targetType}" pois o produto está vinculado ao ranking "${rp.ranking.title}". Remova o vínculo primeiro.`,
          },
          { status: 400 }
        );
      }
    }

    // Se foram enviadas lojas, validar e atualizar
    if (stores !== undefined) {
      const validStorePayloads: Array<{
        store: string;
        productUrl: string;
        affiliateUrl: string | null;
        rating: number | null;
        reviewCount: number | null;
      }> = [];

      if (Array.isArray(stores) && stores.length > 0) {
        const seenStores = new Set<string>();
        for (const st of stores) {
          if (!st || !st.store) continue;
          const productUrl = (st.productUrl || '').trim();
          // Ignorar linha em branco se não tiver nenhum dado preenchido
          if (!productUrl && !st.rating && !st.reviewCount && !st.affiliateUrl) {
            continue;
          }

          if (!VALID_STORES.includes(st.store as StoreKey)) {
            return NextResponse.json({ error: `Loja inválida: ${st.store}` }, { status: 400 });
          }
          if (seenStores.has(st.store)) {
            return NextResponse.json(
              { error: `A loja "${st.store}" foi informada mais de uma vez` },
              { status: 400 }
            );
          }
          seenStores.add(st.store);

          if (!productUrl) {
            return NextResponse.json(
              { error: `O endereço da página do produto é obrigatório para a loja ${st.store}` },
              { status: 400 }
            );
          }

          validStorePayloads.push({
            store: st.store,
            productUrl,
            affiliateUrl: st.affiliateUrl ? st.affiliateUrl.trim() : null,
            rating: st.rating !== undefined && st.rating !== null && st.rating !== '' && Number(st.rating) >= 0 && Number(st.rating) <= 5 ? Number(st.rating) : null,
            reviewCount: st.reviewCount !== undefined && st.reviewCount !== null && st.reviewCount !== '' && Number(st.reviewCount) >= 0 ? Number(st.reviewCount) : null,
          });
        }
      }

      // Remover lojas que não estão mais presentes
      const newStoreKeys = validStorePayloads.map((s) => s.store);
      await prisma.productStore.deleteMany({
        where: {
          productId: id,
          store: { notIn: newStoreKeys },
        },
      });

      // Upsert das lojas válidas enviadas
      for (const st of validStorePayloads) {
        await prisma.productStore.upsert({
          where: {
            productId_store: {
              productId: id,
              store: st.store,
            },
          },
          create: {
            productId: id,
            store: st.store,
            productUrl: st.productUrl,
            affiliateUrl: st.affiliateUrl,
            rating: st.rating,
            reviewCount: st.reviewCount,
          },
          update: {
            productUrl: st.productUrl,
            affiliateUrl: st.affiliateUrl,
            rating: st.rating,
            reviewCount: st.reviewCount,
          },
        });
      }
    }

    // Atualizar produto
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        species: targetSpecies,
        productType: targetType,
        brand: brand !== undefined ? (brand ? brand.trim() : null) : existing.brand,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        imageUrl: imageUrl !== undefined ? (imageUrl ? imageUrl.trim() : null) : existing.imageUrl,
      },
    });

    // Recalcular nota média
    await recalculateProductRating(id);

    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: { stores: true, rankings: { include: { ranking: true } } },
    });

    return NextResponse.json({ success: true, product: fullProduct });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
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

    // Proteção contra exclusão indevida (Seção 5.4)
    const safety = await checkProductDeletionSafety(id);
    if (!safety.canDelete) {
      return NextResponse.json(
        {
          error: `Este produto não pode ser excluído porque está vinculado a ${safety.linkedRankings.length} ranking(s): ${safety.linkedRankings.join(', ')}. Remova os vínculos primeiro.`,
          linkedRankings: safety.linkedRankings,
        },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
