---
name: content-caching-strategy
description: >-
  Implements Next.js App Router caching, ISR (Incremental Static Regeneration), unstable_cache for Prisma queries,
  revalidatePath for cache invalidation, and CDN-friendly response headers across PetRankings.
  Use this skill when optimizing page load performance, reducing database query load, configuring revalidation
  intervals for ranking pages, or troubleshooting stale data issues.
---

# Content Caching Strategy

This skill guides the caching architecture for PetRankings using Next.js App Router's multi-layered cache system, ensuring fast page loads while keeping ranking data fresh.

> **Next.js 16 changed the caching model.** Next.js 16 introduced **Cache Components** (`use cache`, `cacheLife`, `cacheTag`), which flips the old default: data fetching is now **dynamic by default**, and you opt into caching explicitly per function/component/route instead of caching being implicit and global. `unstable_cache` is now legacy — it still works and Next.js has not removed it, but new code should prefer `use cache`. Cache Components is **opt-in** (`cacheComponents: true` in `next.config.ts`) and requires the Node.js runtime (no `edge` runtime) and Next.js 16+. If PetRankings hasn't enabled that flag yet, the "Legacy pattern" examples below are what's actually running in production — use them, and treat the "Cache Components" examples as the target to migrate toward.

## 1. Caching Layer Overview

```
Request
  └── Next.js Router Cache (client-side, session)
       └── Full Route Cache (static pages, build-time)
            └── Data Cache (fetch() cache / unstable_cache)
                 └── Request Memoization (per-request deduplication)
                      └── PostgreSQL via Prisma
```

## 2. Ranking Pages — ISR with `revalidate`

Ranking pages (`/ranking/[slug]`) show data that changes only when an admin updates it.

**Legacy pattern (no `cacheComponents` flag / Next.js < 16):** use ISR to statically cache the page and revalidate periodically:

```typescript
// src/app/ranking/[slug]/page.tsx
export const revalidate = 3600; // Re-generate every 1 hour

// OR use on-demand revalidation (recommended — see Section 4)
export const dynamic = 'force-static';
```

**Cache Components pattern (Next.js 16+, `cacheComponents: true`):** with this flag, routes are dynamic by default, so `export const revalidate` / `dynamic = 'force-static'` no longer do anything — caching moves into the data-fetching function itself:

```typescript
// src/app/ranking/[slug]/page.tsx
import { getCachedRankingBySlug } from '@/lib/rankings'; // see section 3

export default async function RankingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ranking = await getCachedRankingBySlug(slug); // caching lives here, not on the page export
  // ...render ranking
}
```

## 3. Caching Prisma Queries

### Legacy pattern: `unstable_cache`

Use `unstable_cache` to cache expensive Prisma queries independently from page rendering. **This API is now legacy** (superseded by `use cache` in Next.js 16 — see below), but it still works and is the correct choice if `cacheComponents` isn't enabled:

```typescript
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

// Cached ranking list for the home page
export const getCachedPublishedRankings = unstable_cache(
  async (species?: string, productType?: string) => {
    return prisma.ranking.findMany({
      where: {
        isPublished: true,
        ...(species ? { species } : {}),
        ...(productType ? { productType } : {}),
      },
      orderBy: { dataUpdatedAt: 'desc' },
    });
  },
  ['published-rankings'],    // Cache key prefix
  {
    revalidate: 3600,        // 1 hour
    tags: ['rankings'],      // Tag for on-demand invalidation
  }
);

// Cached single ranking with products
export const getCachedRankingBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.ranking.findUnique({
      where: { slug, isPublished: true },
      include: { products: { include: { product: { include: { stores: true } } } } },
    });
  },
  ['ranking-by-slug'],
  { revalidate: 3600, tags: ['rankings'] }
);
```

### Current pattern: `use cache` + `cacheLife` + `cacheTag` (Next.js 16+)

Same two queries, migrated to Cache Components. The cache key is derived automatically from the function's arguments, so the manual key-parts array (`['published-rankings']`) is no longer needed:

```typescript
import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getCachedPublishedRankings(species?: string, productType?: string) {
  'use cache';
  cacheLife('hours');      // Named profile ~ equivalent to revalidate: 3600
  cacheTag('rankings');    // Same invalidation tag as before

  return prisma.ranking.findMany({
    where: {
      isPublished: true,
      ...(species ? { species } : {}),
      ...(productType ? { productType } : {}),
    },
    orderBy: { dataUpdatedAt: 'desc' },
  });
}

export async function getCachedRankingBySlug(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('rankings');
  cacheTag(`ranking-${slug}`); // A function can carry more than one tag — invalidate this one ranking alone if needed

  return prisma.ranking.findUnique({
    where: { slug, isPublished: true },
    include: { products: { include: { product: { include: { stores: true } } } } },
  });
}
```

> One difference to plan for: legacy `unstable_cache` (and the old `fetch` cache) persist across deployments; `use cache` entries are stored in memory by default and don't survive a deploy. This is rarely an issue for PetRankings' hourly-refreshed ranking data, but worth knowing if you were relying on cross-deploy persistence somewhere.

## 4. On-Demand Cache Invalidation (Recommended Pattern)

### Legacy pattern

Invalidate cache immediately after admin mutations using `revalidatePath` and `revalidateTag`:

```typescript
// src/app/api/rankings/[id]/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  // ... update ranking in DB ...
  const updated = await prisma.ranking.update({ where: { id }, data: body });

  // Invalidate the specific ranking page and the home page list
  revalidatePath(`/ranking/${updated.slug}`);
  revalidatePath('/');
  revalidateTag('rankings'); // Invalidates all unstable_cache with this tag

  return Response.json(updated);
}
```

### Cache Components pattern (Next.js 16+)

With `use cache`/`cacheTag` (section 3), invalidation is tag-based rather than path-based, and there are two functions depending on how fresh the result needs to be:

- **`updateTag`** — only callable from a Server Action. Invalidates synchronously, in the same request, so the user sees their own change immediately (read-your-writes). Use this for admin save actions triggered from a form.
- **`revalidateTag`** — callable from a Route Handler or Server Action. Marks the entry stale and regenerates it in the background on the next request — the current request may still see the old value. Use this from webhooks, cron jobs, or Route Handlers like the `PUT` example above.

```typescript
// src/app/api/rankings/[id]/route.ts — Route Handler, use revalidateTag (background refresh)
import { revalidateTag } from 'next/cache';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const updated = await prisma.ranking.update({ where: { id }, data: body });

  revalidateTag('rankings');
  revalidateTag(`ranking-${updated.slug}`);

  return Response.json(updated);
}
```

```typescript
// src/app/admin/actions.ts — Server Action, use updateTag (read-your-writes)
'use server';
import { updateTag } from 'next/cache';

export async function saveRankingFromAdminForm(id: string, data: RankingInput) {
  const updated = await prisma.ranking.update({ where: { id }, data });

  updateTag('rankings');
  updateTag(`ranking-${updated.slug}`);

  return updated;
}
```

Apply the same pattern in:
- `PUT /api/products/[id]` → after changing ratings or store data
- `POST /api/products` → new product added
- `DELETE /api/rankings/[id]` → ranking removed

## 5. Home Page — Aggressive Caching

The home page (`/`) lists all published rankings and rarely changes:

```typescript
// src/app/page.tsx
export const revalidate = 3600; // 1 hour background revalidation — legacy pattern
```

Under Cache Components, this comes for free once `getCachedPublishedRankings` (section 3) uses `'use cache'` + `cacheLife('hours')` — the page itself doesn't need a `revalidate` export, since the caching lives in the data function it calls.

## 6. Admin Pages — Always Dynamic

Admin pages must **never** be cached, as they show real-time data:

```typescript
// src/app/admin/produtos/page.tsx
export const dynamic = 'force-dynamic'; // legacy pattern
// OR at the top of the file:
export const revalidate = 0;
```

Under Cache Components, routes are **dynamic by default** — nothing is cached unless a function inside the route uses `'use cache'`. So once the flag is on, admin pages need no special export at all; just make sure nothing in the admin data-fetching path accidentally has `'use cache'` on it.

## 7. CDN Response Headers

Add cache-friendly headers to API routes that serve public data:

```typescript
// Public ranking API
return Response.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
});

// Admin API — never cache
return Response.json(data, {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },
});
```

## 8. Caching Quality Checklist

- [ ] **Determine which model is active first:** check `next.config.ts` for `cacheComponents: true`. If absent, PetRankings is on the legacy model — use `unstable_cache`, `export const revalidate`, and `revalidatePath`/`revalidateTag` as-is. If present, use `use cache` + `cacheLife`/`cacheTag` + `updateTag`/`revalidateTag` instead.
- [ ] Public ranking pages use `revalidate = 3600` (legacy) or a data function tagged with `'use cache'` + `cacheLife('hours')` (Cache Components).
- [ ] Admin pages use `dynamic = 'force-dynamic'` / `revalidate = 0` (legacy) — or, under Cache Components, simply have no `'use cache'` anywhere on their data path, since dynamic is already the default.
- [ ] After every admin mutation: `revalidatePath` + `revalidateTag` (legacy), or `updateTag` from a Server Action / `revalidateTag` from a Route Handler (Cache Components) — pick `updateTag` when the admin needs to see their own change immediately, `revalidateTag` when a background refresh is acceptable.
- [ ] Cache tags are specific enough to avoid over-invalidating: a per-slug tag (`ranking-${slug}`) alongside the broad `rankings` tag lets you invalidate one ranking without flushing the whole list.
- [ ] API routes serving public data include `Cache-Control: public, s-maxage=...` headers.
- [ ] API routes serving admin data include `Cache-Control: no-store` headers.
- [ ] If migrating to Cache Components: confirm no route relies on `edge` runtime (Cache Components requires Node.js) and that Next.js is 16+.
