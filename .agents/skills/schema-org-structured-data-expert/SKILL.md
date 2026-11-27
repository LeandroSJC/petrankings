---
name: schema-org-structured-data-expert
description: >-
  Architects and implements Schema.org JSON-LD structured data, Rich Snippets, and Google Discover
  enhancements across PetRankings (/produto/[slug], /indice/[categoria], /guias/[slug], /coadjuvantes).
  Specializes in Product, ItemList, Article/TechArticle, FAQPage, BreadcrumbList, and Organization schemas.
  Use this skill when implementing or checking JSON-LD markup or fixing Search Console structured data warnings.
---

# Schema.org Structured Data & Rich Snippets Expert

This skill governs Schema.org JSON-LD markup across **PetRankings**, strictly aligned with the current V5 routes and editorial policies (no fabricated store ratings or `AggregateRating`).

## 1. Structured Data Blueprint by Route

### A. Product Dossier (`/produto/[slug]`)
Emit `Product` + `BreadcrumbList`. Include `name` (canonical commercial name without `"Ração"` prefix), `brand`, `image`, `category`, `description`, and factual `additionalProperty` entries for guaranteed analysis (e.g., Proteína Bruta MS, Razão Ca:P, Conservantes).
- **Important:** Do **not** fabricate `AggregateRating` or consumer review counts. If referencing the PetRankings technical score, model it explicitly as an editorial `Review` (`author: Organization PetRankings`, `reviewRating: { ratingValue, bestRating: 100, worstRating: 0 }`) and omit competitive rating on `ALIMENTO_COADJUVANTE`.

### B. Index & Category Pages (`/indice/[categoria]`, `/catalogo`)
Emit `ItemList` with ordered `ListItem` entries (`position`, `url`, `name`) pointing to canonical `/produto/[slug]` URLs, plus `BreadcrumbList`.

### C. Studies & Technical Guides (`/guias/[slug]`)
Emit `Article` (or `TechArticle`) + `BreadcrumbList`:
- `headline`: Sentence Case bimember title (Invariante 12).
- `author`: `{ "@type": "Organization", "name": "Equipe de Curadoria Técnica — PetRankings" }` (Invariante 10 — never invent individual authors).
- `publisher`: `Organization` (`PetRankings`, logo URL, `https://petrankings.com.br`).
- `datePublished` and `dateModified` in ISO 8601.
- `image`: Absolute URL (`1200x630` cover image, `>= 1200px` wide for Google Discover eligibility).

### D. Institutional & FAQ Pages (`/`, `/sobre`)
Emit `Organization` / `WebSite` (with `SearchAction` pointing to `/catalogo?q={search_term_string}`) and `FAQPage` strictly matching visible Q&A content on the page.

## 2. Implementation & Validation Rules

- Always serialize JSON-LD safely (escape `</script>` or `<` as `\u003c`).
- Every URL in JSON-LD must be absolute (`https://petrankings.com.br/...`) with no trailing slash inconsistency.
- Never include properties that are not visibly represented on the rendered page (Google Spam Policy compliance).
- Never use prohibited terms ("Auditoria", "Perícia") in JSON-LD `description` or `headline` fields.

## 3. Verification Checklist

- [ ] JSON-LD parses cleanly with zero syntax errors.
- [ ] All URLs are absolute and match the page's `<link rel="canonical">`.
- [ ] `Article` covers are `1200x630` for Google Discover eligibility.
- [ ] No fabricated `AggregateRating`, `Offer` prices, or fictional individual authors.
- [ ] Product names follow Invariante 13 (no `"Ração"` prefix, no weights).
