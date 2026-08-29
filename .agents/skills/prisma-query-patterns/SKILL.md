---
name: prisma-query-patterns
description: >-
  Provides optimized Prisma ORM query patterns specific to the PetRankings data model, including
  performance indexes, pagination, transaction safety for rating propagation, and safe deletion checks.
  Use this skill when writing or optimizing Prisma queries, adding database indexes, implementing
  pagination in admin lists, or ensuring transactional consistency in multi-table updates.
---

# Prisma Query Patterns — PetRankings Specific

This skill provides production-ready Prisma query patterns tailored to the PetRankings schema, focusing on performance, transactional integrity, and business logic correctness.

## 1. Recommended Database Indexes

The current schema (`prisma/schema.prisma`) is missing indexes on frequently queried fields. Add these to improve filter performance:

```prisma
model Ranking {
  // ... existing fields ...
  @@index([species])
  @@index([isPublished])
  @@index([species, isPublished])       // Composite for filtered home page queries
  @@index([dataUpdatedAt])
}

model Product {
  // ... existing fields ...
  @@index([species])
  @@index([productType])
  @@index([species, productType])       // Composite for catalog filters
  @@index([averageRating])             // For sorted product lists
  @@index([ratingUpdatedAt])           // For "needs review" admin filters
}

model RankingProduct {
  // ... existing fields ...
  @@index([productId])                 // FK — Prisma does NOT auto-index foreign keys
  @@index([rankingId])                 // FK — required for the join queries in sections 3 and 4
}

model ProductStore {
  // ... existing fields ...
  @@index([productId])                 // FK — used by updateStoreRating's findMany in section 4
}
```

> ⚠️ **Prisma does not auto-index foreign key columns** (neither does Postgres by default). This is the single most common performance bug in Prisma apps — every `@relation` field that's queried or joined on (like `productId`, `rankingId` above) needs an explicit `@@index`. Audit `schema.prisma` for any FK column without a matching index whenever a new relation is added.

After adding indexes, run:
```bash
npx prisma db push       # Development (SQLite/PostgreSQL without migration history)
# OR
npx prisma migrate dev --name add_performance_indexes  # For tracked migrations
```

**Generator output convention:** pin the client output path and check it into git so types survive a `node_modules` wipe and AI coding tools (Claude Code, Cursor, etc.) can reason about types without needing to run `prisma generate` first:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}
```

## 2. Published Rankings for Home Page

```typescript
// Optimized query: only select fields needed for the card grid
export async function getPublishedRankings(species?: string, productType?: string) {
  return prisma.ranking.findMany({
    where: {
      isPublished: true,
      ...(species ? { species } : {}),
      ...(productType ? { productType } : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      species: true,
      productType: true,
      description: true,
      dataUpdatedAt: true,
      _count: { select: { products: true } },
    },
    orderBy: { dataUpdatedAt: 'desc' },
  });
}
```

## 3. Ranking Detail Page — Full Product Tree

```typescript
export async function getRankingWithProducts(slug: string) {
  return prisma.ranking.findUnique({
    where: { slug, isPublished: true },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              species: true,
              productType: true,
              brand: true,
              description: true,
              imageUrl: true,
              averageRating: true,
              ratingUpdatedAt: true,
              stores: {
                select: {
                  store: true,
                  productUrl: true,
                  affiliateUrl: true,
                  rating: true,
                  // reviewCount intentionally omitted — not shown publicly
                },
              },
            },
          },
        },
      },
    },
  });
}
```

## 4. Rating Propagation — Transactional Update

When a store rating changes, update the product average AND all linked rankings atomically:

```typescript
import prisma from '@/lib/prisma';
import { calculateAverage } from '@/lib/ranking-engine';

export async function updateStoreRating(
  productId: string,
  storeKey: string,
  rating: number | null,
  reviewCount: number | null
) {
  return prisma.$transaction(async (tx) => {
    // 1. Update the store rating
    await tx.productStore.update({
      where: { productId_store: { productId, store: storeKey } },
      data: { rating, reviewCount, updatedAt: new Date() },
    });

    // 2. Recalculate average from all stores of this product
    const allStores = await tx.productStore.findMany({
      where: { productId },
      select: { rating: true },
    });
    const validRatings = allStores
      .map((s) => s.rating)
      .filter((r): r is number => r !== null && r >= 0 && r <= 5);
    const newAverage = validRatings.length > 0
      ? Math.round((validRatings.reduce((a, b) => a + b, 0) / validRatings.length) * 100) / 100
      : null;

    // 3. Update the product average
    await tx.product.update({
      where: { id: productId },
      data: { averageRating: newAverage, ratingUpdatedAt: new Date() },
    });

    // 4. Propagate to all linked rankings
    const linkedRankings = await tx.rankingProduct.findMany({
      where: { productId },
      select: { rankingId: true },
    });
    if (linkedRankings.length > 0) {
      await tx.ranking.updateMany({
        where: { id: { in: linkedRankings.map((r) => r.rankingId) } },
        data: { dataUpdatedAt: new Date() },
      });
    }

    return { averageRating: newAverage };
  }, {
    maxWait: 5000,  // Max time to wait to acquire the transaction (ms)
    timeout: 10000, // Max time the transaction is allowed to run (ms)
  });
}
```

> Keep interactive transactions short — long-running transactions hurt performance and can cause deadlocks. If `updateStoreRating` ever needs to touch a high-volume `Ranking` set, consider batching the `updateMany` in section 4 outside the critical path (e.g. a queued job) rather than growing this transaction further.

## 5. Safe Product Deletion Check

```typescript
export async function checkProductDeletionSafety(productId: string) {
  const linkedRankings = await prisma.rankingProduct.findMany({
    where: { productId },
    include: { ranking: { select: { id: true, title: true, slug: true } } },
  });

  if (linkedRankings.length > 0) {
    return {
      canDelete: false,
      blockedBy: linkedRankings.map((r) => ({
        rankingId: r.ranking.id,
        title: r.ranking.title,
        slug: r.ranking.slug,
      })),
    };
  }
  return { canDelete: true, blockedBy: [] };
}
```

## 6. Admin Catalog Pagination

```typescript
export async function getProductsPage(
  page: number,
  pageSize: number = 20,
  filters: { species?: string; productType?: string; sort?: string }
) {
  const skip = (page - 1) * pageSize;

  const orderBy: Record<string, 'asc' | 'desc'> = {
    recent: { updatedAt: 'desc' },
    oldest: { updatedAt: 'asc' },
    'no-review': { ratingUpdatedAt: 'asc' },
    alpha: { title: 'asc' },
  }[filters.sort ?? 'recent'] ?? { updatedAt: 'desc' };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: {
        ...(filters.species ? { species: filters.species } : {}),
        ...(filters.productType ? { productType: filters.productType } : {}),
      },
      orderBy,
      skip,
      take: pageSize,
      include: { stores: true, _count: { select: { rankings: true } } },
    }),
    prisma.product.count({
      where: {
        ...(filters.species ? { species: filters.species } : {}),
        ...(filters.productType ? { productType: filters.productType } : {}),
      },
    }),
  ]);

  return { products, total, pages: Math.ceil(total / pageSize) };
}
```

> **Offset pagination trade-off:** `skip`/`take` is fine here because it gives page numbers, which the admin catalog UI needs, and catalog size is expected to stay in the thousands, not millions. For larger, ever-growing lists (or public-facing infinite scroll), prefer cursor-based pagination — it scales better because it uses an indexed column to find the starting position instead of traversing skipped rows:
>
> ```typescript
> export async function getProductsPageCursor(
>   pageSize: number = 20,
>   cursor?: string,
>   filters: { species?: string; productType?: string } = {}
> ) {
>   const products = await prisma.product.findMany({
>     take: pageSize,
>     ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
>     where: {
>       ...(filters.species ? { species: filters.species } : {}),
>       ...(filters.productType ? { productType: filters.productType } : {}),
>     },
>     orderBy: { id: 'asc' },
>     include: { stores: true, _count: { select: { rankings: true } } },
>   });
>   const nextCursor = products.length === pageSize ? products[products.length - 1].id : null;
>   return { products, nextCursor };
> }
> ```
>
> Use this pattern instead of `getProductsPage` if the admin catalog grows large enough that `.count()` or deep `skip` values start showing up as slow queries.

## 7. Query Pattern Quality Checklist

- [ ] Use `select` instead of `include` when only specific fields are needed.
- [ ] Multi-step mutations (rating update + product avg + ranking date) run inside `prisma.$transaction()` with explicit `maxWait`/`timeout`, kept as short as possible.
- [ ] Bulk writes (`createMany`, `updateMany`, `deleteMany`) are used instead of manual loops where possible — these already run atomically as a transaction, so they don't need to be wrapped in an extra `$transaction()`.
- [ ] Deletion routes call `checkProductDeletionSafety()` before `prisma.product.delete()`.
- [ ] Every foreign key column (`productId`, `rankingId`, and any future `@relation` field) has an explicit `@@index` — Prisma does not add these automatically.
- [ ] Offset pagination (`skip` + `take` with a concurrent `.count()`) is used for the bounded admin catalog; switch to cursor-based pagination (section 6) if the table grows large or `.count()` becomes slow.
- [ ] Performance indexes added for `species`, `productType`, `isPublished`, `averageRating`, and all FK columns.
- [ ] `reviewCount` is NOT returned to public-facing APIs (only `rating` is shown on store buttons).
- [ ] `generator client` pins an `output` path (e.g. `../src/generated/prisma`) that's checked into git.
