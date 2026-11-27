---
name: product-ingestion-custody
description: >-
  Governs the official product ingestion and HTML/SHA-256 evidence custody pipeline in PetRankings:
  Playwright/Cheerio scraping of manufacturer pages, HTML custody snapshots with SHA-256 hashes,
  Wayback Machine archiving, packshot normalization with sharp, SSH tunnel management, duplicate
  detection, and batch scripts (cadastrar:url, cadastrar-produtos, auditar:imagens). Use this skill
  whenever registering products from URLs, fixing scrapers/parsers, or verifying product images/custody.
---

# Product Ingestion & HTML/SHA-256 Custody Pipeline

This skill documents the end-to-end ingestion and evidence custody workflow of **PetRankings**, anchored in [ADR 0001](file:///d:/Projetos/PetRankings/.agents/adr/0001-custodia-documental-html-sha256.md) and Invariante 6 (strict fidelity to official manufacturer labeling, zero fabricated data).

## 1. Core Scripts & Entry Points

| Command | Script | Purpose |
| :--- | :--- | :--- |
| `npm run cadastrar:url` | `scripts/cadastrar-por-url.ts` | Single-URL ingestion via Playwright/Cheerio + HTML custody + Motor V5 score |
| `npm run cadastrar-produtos` | `scripts/cadastrar-com-tunel.ts` | Opens SSH tunnel automatically and runs batch ingestion (`produtos_cadastro/urls_cadastro.txt`) |
| `npm run cadastrar-produtos:direto` | `scripts/cadastrar-produtos.ts` | Direct batch ingestion when SSH tunnel (`npm run tunel`) is already open on port `5433` |
| `npm run auditar:imagens` | `scripts/auditar-e-reparar-imagens.ts` | Verifies and repairs broken or missing product packshots in `public/uploads/` |

## 2. Pipeline Architecture

1. **SSH Tunnel (`ensureTunnelOpen`):** Checks `127.0.0.1:5433`; if closed, spawns `ssh -L 5433:127.0.0.1:5432 -N petrankings-vps` and closes cleanly on exit.
2. **Official Page Acquisition:** Uses Playwright (`chromium`, headless, `pt-BR`) or cached HTML (`scratch/`) to fetch the official manufacturer product page (`sourceUrl`).
3. **HTML Custody & SHA-256 Hash:** Saves the raw HTML snapshot under `public/uploads/` (never indexed thanks to `X-Robots-Tag: noindex, nofollow` in `next.config.mjs`) and records `sourceDocumentUrl`, `labelCollectionDate`, and optional `sourceArchiveUrl` (Wayback Machine).
4. **Deterministic Parsing (`src/lib/html-product-parser`):** Extracts guaranteed analysis levels (MN), top ingredients in descending order, GMO declarations, and antioxidant type directly from the official HTML.
   - **Zero Fabrication Rule:** Any nutrient not explicitly declared by the manufacturer MUST remain `null` (never estimated or defaulted).
5. **Packshot Processing (`sharp`):** Downloads the official product packaging image, strips EXIF, trims borders, and saves optimized WebP under `public/uploads/` (`frontLabelImageUrl`). Prefix a URL with `*` in `urls_cadastro.txt` to prefer the 2nd image, or pass `--skip-images` to skip download.
6. **Motor V5 Scoring (`src/lib/audit-engine`):** Computes `scoreTotal` (0–100), `classificationTier`, `scoreBreakdown`, and editorial opinion — keeping `ALIMENTO_COADJUVANTE` products without a competitive score (`scoreTotal: null`).

## 3. Data Integrity & Naming Rules

- **Commercial Name (`commercialName`):** Follow Invariante 13 (`[Marca] [Linha] [Espécie/Porte] [Fase/Especialidade] [Sabor]`, no `"Ração"` prefix, no weights `15kg`/`85g`, no `®`/`™`).
- **Duplicate Prevention:** Always check slug and commercial name uniqueness before inserting; if renaming an existing product slug, register a `ProductRedirect` record.
- **No PDFs:** Custody is standardized strictly on official HTML + SHA-256 (never reintroduce PDF dependencies).

## 4. Verification Checklist

- [ ] `sourceUrl` points to the exact official manufacturer page (or verified retail ficha when applicable).
- [ ] HTML snapshot saved under `public/uploads/` and excluded from Google indexing.
- [ ] Undeclared nutritional fields remain `null` (zero invention).
- [ ] Packshot image loads cleanly and passes `npm run auditar:imagens`.
- [ ] `ALIMENTO_COADJUVANTE` products have `scoreTotal: null`.
