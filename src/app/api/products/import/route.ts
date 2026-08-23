import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recalculateProductRating, validateTaxonomyCompatibility } from '@/lib/ranking-engine';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto enviado para importação' }, { status: 400 });
    }

    if (products.length > 500) {
      return NextResponse.json({ error: 'O limite máximo por lote é de 500 produtos.' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Carregar rankings existentes para mapear por título e slug
    const allRankings = await prisma.ranking.findMany({
      select: { id: true, title: true, slug: true, species: true, productType: true },
    });

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      const rowNum = i + 1;

      try {
        const title = (item.titulo || item.title || '').trim();
        const rawSpecies = (item.especie || item.species || '').trim().toLowerCase();
        const species = rawSpecies === 'gatos' || rawSpecies === 'gato' || rawSpecies === 'cat' ? 'gatos' : 'caes';
        const productType = (item.tipo_produto || item.productType || item.tipo || '').trim();
        const brand = (item.marca || item.brand || '').trim() || null;
        const description = (item.descricao || item.description || '').trim() || null;
        const imageUrl = (item.url_imagem || item.imageUrl || item.imagem || '').trim() || null;
        const id = (item.id || '').trim();

        if (!title || title.length < 2) {
          errors.push(`Linha ${rowNum}: Título do produto é obrigatório.`);
          continue;
        }

        if (!productType || productType.length < 2) {
          errors.push(`Linha ${rowNum} (${title}): Tipo de produto é obrigatório.`);
          continue;
        }

        // Buscar se o produto já existe por ID ou por Título idêntico
        let existingProduct = null;
        if (id) {
          existingProduct = await prisma.product.findUnique({ where: { id } });
        }
        if (!existingProduct) {
          existingProduct = await prisma.product.findFirst({
            where: { title: { equals: title } },
          });
        }

        let savedProduct;
        if (existingProduct) {
          savedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              title,
              species,
              productType,
              brand,
              description,
              ...(imageUrl ? { imageUrl } : {}),
            },
          });
          updatedCount++;
        } else {
          savedProduct = await prisma.product.create({
            data: {
              title,
              species,
              productType,
              brand,
              description,
              imageUrl,
            },
          });
          createdCount++;
        }

        // Processar Lojas
        const storeConfigs = [
          {
            key: 'amazon',
            url: item.amazon_url || item.amazonUrl,
            rating: item.amazon_nota || item.amazonRating,
            reviewCount: item.amazon_avaliacoes || item.amazonReviewCount,
          },
          {
            key: 'petlove',
            url: item.petlove_url || item.petloveUrl,
            rating: item.petlove_nota || item.petloveRating,
            reviewCount: item.petlove_avaliacoes || item.petloveReviewCount,
          },
          {
            key: 'cobasi',
            url: item.cobasi_url || item.cobasiUrl,
            rating: item.cobasi_nota || item.cobasiRating,
            reviewCount: item.cobasi_avaliacoes || item.cobasiReviewCount,
          },
          {
            key: 'mercadolivre',
            url: item.mercadolivre_url || item.mercadolivreUrl,
            rating: item.mercadolivre_nota || item.mercadolivreRating,
            reviewCount: item.mercadolivre_avaliacoes || item.mercadolivreReviewCount,
          },
          {
            key: 'shopee',
            url: item.shopee_url || item.shopeeUrl,
            rating: item.shopee_nota || item.shopeeRating,
            reviewCount: item.shopee_avaliacoes || item.shopeeReviewCount,
          },
        ];

        for (const sc of storeConfigs) {
          const rawUrl = (sc.url || '').trim();
          if (rawUrl) {
            const parsedRating = sc.rating !== undefined && sc.rating !== '' ? parseFloat(String(sc.rating)) : null;
            const parsedCount = sc.reviewCount !== undefined && sc.reviewCount !== '' ? parseInt(String(sc.reviewCount), 10) : null;

            const validRating = parsedRating !== null && !isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5 ? parsedRating : null;
            const validCount = parsedCount !== null && !isNaN(parsedCount) && parsedCount >= 0 ? parsedCount : null;

            await prisma.productStore.upsert({
              where: {
                productId_store: {
                  productId: savedProduct.id,
                  store: sc.key,
                },
              },
              create: {
                productId: savedProduct.id,
                store: sc.key,
                productUrl: rawUrl,
                rating: validRating,
                reviewCount: validCount,
              },
              update: {
                productUrl: rawUrl,
                rating: validRating,
                reviewCount: validCount,
              },
            });
          }
        }

        // Vincular aos rankings informados (separados por ponto-e-vírgula ;)
        const rawRankings = (item.rankings_vinculados || item.rankings || '').trim();
        if (rawRankings) {
          const rankingNames = rawRankings.split(/[;,]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
          for (const rName of rankingNames) {
            const matchedRanking = allRankings.find(
              (r) => r.title.toLowerCase() === rName || r.slug.toLowerCase() === rName
            );

            if (matchedRanking) {
              if (validateTaxonomyCompatibility(species, productType, matchedRanking.species, matchedRanking.productType)) {
                await prisma.rankingProduct.upsert({
                  where: {
                    rankingId_productId: {
                      rankingId: matchedRanking.id,
                      productId: savedProduct.id,
                    },
                  },
                  create: {
                    rankingId: matchedRanking.id,
                    productId: savedProduct.id,
                  },
                  update: {},
                });
              }
            }
          }
        }

        // Recalcular média e propagar datas
        await recalculateProductRating(savedProduct.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        errors.push(`Linha ${rowNum}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: products.length,
      created: createdCount,
      updated: updatedCount,
      errors,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao processar importação';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
