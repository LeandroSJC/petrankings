---
name: search-console-indexing-watchdog
description: >-
  Audits and optimizes Google Search Console (GSC) indexing status, resolves crawl issues, canonical
  conflicts, and accelerates indexation for PetRankings. Use this skill when diagnosing GSC coverage
  reports, resolving "Duplicate without user-selected canonical", "Page with redirect", "Discovered -
  currently not indexed", or submitting priority indexing requests.
---

# Google Search Console Indexing Watchdog

This skill guides diagnosis, root-cause resolution, and proactive monitoring for Google Search Console (GSC) indexation health, sitemap alignment, and crawl budget optimization across the PetRankings platform.

---

## 1. GSC Coverage Status Dictionary & Resolution Runbook

| GSC Status Code | Meaning | Root Cause in Next.js / PetRankings | Action / Resolution |
| :--- | :--- | :--- | :--- |
| **"Cópia sem página canônica selecionada pelo usuário"** | Google found multiple identical pages, but no `<link rel="canonical">` was declared. | Missing `alternates: { canonical: ... }` in page metadata, client components without metadata, or HTTP vs HTTPS / `www` vs non-`www` variations. | Add explicit canonical tags (`alternates: { canonical: '/rota' }`) and ensure `metadataBase` is defined in `layout.tsx`. |
| **"Página com redirecionamento"** | The crawled URL returned a `301` or `308` redirect instead of `200 OK`. | Trailing slash variations (`/sobre/` -> `/sobre`), HTTP -> HTTPS, or apex domain redirects. | **Normal behavior.** Verify that the destination URL is indexed and update all internal links to target the final destination directly without relying on redirects. |
| **"Detectada, mas não indexada no momento"** | Google discovered the URL in the sitemap or via links, but queued it without crawling yet. | Domain is new, low crawl budget, lack of internal linking signals, or server crawl throttled. | Accelerate crawl via GSC **"Solicitar Indexação"**, strengthen internal footer/header links, and ensure sitemap URLs match canonicals 100%. |
| **"Rastreada, mas não indexada no momento"** | Google crawled the page, but decided not to index it due to perceived low content density or duplicate value. | Empty rankings (0 products), stub pages, or generic auto-generated boilerplate. | Enrich ranking page with unique editorial insights, pros/cons, and at least 4-5 well-reviewed products. |
| **"Não encontrada (404)"** | The requested URL does not exist on the server. | Renamed ranking slug or deleted product. | Ensure `notFound()` or return a valid 404 page; remove dead URLs from `sitemap.ts`. |

---

## 2. Canonical Tag Architecture Protocol

Every public route in PetRankings MUST declare a self-referencing canonical URL:

1. **Root Layout (`src/app/layout.tsx`):**
   ```typescript
   export const metadata: Metadata = {
     metadataBase: new URL(SITE_URL),
     alternates: {
       canonical: '/',
     },
   };
   ```
2. **Dynamic Ranking Pages (`src/app/ranking/[slug]/page.tsx`):**
   ```typescript
   export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
     const { slug } = await params;
     const canonicalUrl = `${SITE_URL}/ranking/${slug}`;
     return {
       alternates: {
         canonical: canonicalUrl,
       },
     };
   }
   ```
3. **Static Institutional Pages (`/sobre`, `/contato`, `/politica-de-privacidade`):**
   ```typescript
   export const metadata: Metadata = {
     alternates: {
       canonical: '/sobre', // Next.js resolves against metadataBase
     },
   };
   ```

---

## 3. Crawl Budget & Indexation Velocity Optimization

For new editorial platforms with expanding product catalogs:

1. **No Orphan Pages:** Every ranking must be accessible within 2 clicks from the home page or via category filters.
2. **Clean Sitemap Generation:** The dynamic `sitemap.ts` must only output:
   - Status `200 OK` pages.
   - Rankings with `isPublished: true`.
   - URLs formatted with exact casing and no trailing slashes.
3. **Automated Sitemap Pre-flight:**
   Always run the validation script before submitting changes:
   ```bash
   npx tsx .agents/skills/nextjs-performance-seo/scripts/validate-sitemap-canonicals.ts
   ```

---

## 4. Reindexing & GSC Validation Procedure

When resolving indexation issues:

1. **Trigger GSC Fix Validation:**
   - In Search Console, navigate to **Indexação** > **Páginas**.
   - Select the resolved issue (e.g. *"Cópia sem página canônica"*).
   - Click **"Validar correção"** (Google prioritizes recrawling these URLs).
2. **Manual Priority Request:**
   - Use the top inspection bar (*"Inspecionar qualquer URL em..."*).
   - Click **"Testar o URL publicado"** to confirm live canonical detection.
   - Click **"Solicitar indexação"** for the Home page and updated ranking pages.
3. **Sitemap Ping:**
   - Verify `https://petrankings.com.br/sitemap.xml` in GSC **Sitemaps** and resubmit if new rankings were published.

---

## 5. Indexation Health Checklist

- [ ] All public routes export explicit `alternates: { canonical: ... }`.
- [ ] No Client Components (`'use client'`) used directly as root `page.tsx` without a Server Component metadata wrapper.
- [ ] `SITE_URL` environment variable has no trailing slash and uses `https://`.
- [ ] `robots.txt` correctly allows `/ranking/`, `/sobre`, `/contato` and blocks `/admin/` and `/api/`.
- [ ] Live URL inspection in GSC confirms: *"URL do Google é igual ao URL canônico declarado pelo usuário"*.
