import prisma from './prisma';

/**
 * Calcula a nota média de um produto com base nas lojas vinculadas com notas válidas (0.0 a 5.0).
 * Arredonda para 2 casas decimais.
 * Atualiza o produto e propaga a data de atualização para todos os rankings vinculados.
 */
export async function recalculateProductRating(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      stores: true,
      rankings: {
        include: { ranking: true },
      },
    },
  });

  if (!product) {
    throw new Error('Produto não encontrado');
  }

  // 1. Filtrar lojas com nota válida (entre 0 e 5) e Total de Avaliações maior que 0
  const validStores = product.stores.filter(
    (s) =>
      s.reviewCount !== null &&
      s.reviewCount !== undefined &&
      s.reviewCount > 0 &&
      s.rating !== null &&
      s.rating !== undefined &&
      s.rating >= 0 &&
      s.rating <= 5
  );

  let averageRating: number | null = null;
  if (validStores.length > 0) {
    const sum = validStores.reduce((acc, curr) => acc + (curr.rating as number), 0);
    const avg = sum / validStores.length;
    averageRating = Math.round(avg * 100) / 100;
  }

  const now = new Date();

  // Atualizar o produto
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating,
      ratingUpdatedAt: now,
    },
  });

  // Propagação (5.3): atualizar dataUpdatedAt de todos os rankings que contêm este produto
  const rankingIds = product.rankings.map((r) => r.rankingId);
  if (rankingIds.length > 0) {
    await prisma.ranking.updateMany({
      where: { id: { in: rankingIds } },
      data: { dataUpdatedAt: now },
    });
  }

  return updatedProduct;
}

/**
 * Ordena os produtos de um ranking estritamente de acordo com as regras da Seção 5.2:
 * 1. Produtos avaliados primeiro (com média válida), depois não avaliados.
 * 2. Maior nota média (DESC).
 * 3. Maior soma da quantidade de avaliações nas lojas (DESC).
 * 4. Produto mais antigo no catálogo (createdAt ASC).
 * 5. Menor ID (ASC) para estabilidade determinística.
 */
export function sortRankingProducts<T extends {
  id: string;
  averageRating: number | null;
  createdAt: Date;
  stores?: Array<{ reviewCount: number | null }>;
}>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const aHasRating = a.averageRating !== null && a.averageRating !== undefined;
    const bHasRating = b.averageRating !== null && b.averageRating !== undefined;

    // Produtos com nota vêm antes dos sem nota
    if (aHasRating && !bHasRating) return -1;
    if (!aHasRating && bHasRating) return 1;

    if (aHasRating && bHasRating) {
      // 1. Maior nota média
      if (b.averageRating! !== a.averageRating!) {
        return b.averageRating! - a.averageRating!;
      }
    }

    // 2. Maior soma das quantidades de avaliações
    const aSumReviews = (a.stores || []).reduce((acc, s) => acc + (s.reviewCount || 0), 0);
    const bSumReviews = (b.stores || []).reduce((acc, s) => acc + (s.reviewCount || 0), 0);
    if (bSumReviews !== aSumReviews) {
      return bSumReviews - aSumReviews;
    }

    // 3. Mais antigo no catálogo
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // 4. Identificador menor
    return a.id.localeCompare(b.id);
  });
}

/**
 * Validação de compatibilidade taxonômica (Seção 3.1):
 * Um produto só pode pertencer a rankings da mesma espécie e mesmo tipo de produto.
 */
export function validateTaxonomyCompatibility(
  productSpecies: string,
  productType: string,
  rankingSpecies: string,
  rankingType: string
): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  return norm(productSpecies) === norm(rankingSpecies) && norm(productType) === norm(rankingType);
}

/**
 * Proteção contra exclusão indevida (Seção 5.4):
 * Um produto com participação ativa em rankings não pode ser excluído.
 * Retorna { canDelete: boolean, linkedRankings: string[] }
 */
export async function checkProductDeletionSafety(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      rankings: {
        include: { ranking: true },
      },
    },
  });

  if (!product) {
    throw new Error('Produto não encontrado');
  }

  const linkedRankings = product.rankings.map((r) => r.ranking.title);
  return {
    canDelete: linkedRankings.length === 0,
    linkedRankings,
  };
}
