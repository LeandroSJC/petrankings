---
name: nextjs-performance-seo
description: >-
  Optimizes Next.js web applications for maximum performance, Core Web Vitals (LCP, CLS, INP, FID),
  and search engine optimization (SEO, OpenGraph metadata, structured JSON-LD data, sitemaps).
  Use this skill when optimizing page load speed, bundle sizes, caching, image optimization, or SEO tags in Next.js.
---

# Next.js Performance & SEO Optimizer

This skill provides procedures and guidelines for auditing and optimizing Next.js (App Router) applications for search ranking, Core Web Vitals, and optimal bundle size.

## 1. Next.js Core Web Vitals Optimization

### A. Largest Contentful Paint (LCP)
- Use `next/image` for images with explicit `width`, `height`, and `priority` on above-the-fold hero images.
- Preload critical web fonts using `next/font` (e.g. `next/font/google`).
- Minimize render-blocking resources by leveraging React Server Components (RSC) to fetch data on the server.

### B. Cumulative Layout Shift (CLS)
- Always reserve layout dimensions for dynamic content, banners, and third-party widgets using aspect ratios (`aspect-ratio: 16/9`) or skeleton placeholders.
- Avoid inserting DOM elements above existing content after page load.

### C. Interaction to Next Paint (INP) & Bundle Size
- Use `next/dynamic` with `ssr: false` for heavy, client-only widgets (e.g. charts, rich text editors).
- Keep `"use client"` boundaries as low in the component tree as possible.
- Avoid large barrel file imports; import directly from subpaths when available.

## 2. Search Engine Optimization (SEO) & Metadata

### A. Dynamic & Static Metadata (App Router)
- Implement `generateMetadata()` or static `export const metadata: Metadata` on every route:
  ```tsx
  export const metadata: Metadata = {
    title: {
      template: '%s — PetRankings',
      default: 'PetRankings — Observatório Independente de Nutrição Pet no Brasil',
    },
    description: 'Análise técnica e determinística de alimentos para cães e gatos em Matéria Seca (MS) com base no Manual ABINPET.',
    openGraph: {
      title: 'PetRankings — Observatório Independente de Nutrição Pet no Brasil',
      description: 'Análise nutricional de alimentos oficiais para cães e gatos sob as diretrizes do MAPA e ABINPET.',
      url: 'https://petrankings.com.br',
      siteName: 'PetRankings',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'PetRankings Banner',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
  ```

### B. Page Title Hierarchy & Invariante 13 Compliance
- **Home**: `PetRankings — Observatório Independente de Nutrição Pet no Brasil`
- **Catálogo Geral**: `Catálogo Geral de Alimentos para Cães e Gatos — PetRankings`
- **Página de Produto**: `[Nome Comercial Completo] — Análise de Rótulo e Ficha Técnica | PetRankings`
- **Artigo / Estudo Técnico**: `[Título do Estudo em Sentence Case] — PetRankings`
- **Índice / Categoria**: `Rações para [Cães/Gatos] [Fase] — Avaliação Técnica | PetRankings`
- **Dietas Coadjuvantes**: `Alimentos Coadjuvantes & Dietas Veterinárias — PetRankings`

### C. Structured Data (JSON-LD)
- Add Schema.org structured data (e.g., `Product`, `ItemList`, `Review`, `BreadcrumbList`, `Organization`) via `<script type="application/ld+json">`.

### C. Sitemap & Robots
- Implement `app/sitemap.ts` and `app/robots.ts` for dynamic search crawler indexing.
- Validate sitemap entries against canonical tags using the automated validator [validate-sitemap-canonicals.ts](./scripts/validate-sitemap-canonicals.ts):
  ```bash
  npx tsx .agents/skills/nextjs-performance-seo/scripts/validate-sitemap-canonicals.ts
  ```

## 3. Performance & SEO Checklist

- [ ] Every page has unique `<title>` and `<meta name="description">`.
- [ ] Above-the-fold images use `next/image` with `priority`.
- [ ] Fonts are loaded via `next/font` with `display: 'swap'`.
- [ ] OpenGraph and Twitter card preview images are configured.
- [ ] Structured data (JSON-LD) validated for rich snippets in Google Search.
- [ ] Bundle analyzed for unused dependencies.
