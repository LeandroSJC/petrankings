---
name: admin-dashboard-engineer
description: >-
  Specialized engineering for the PetRankings administrative backoffice (/admin), including
  product catalog CRUD, Motor V5 score recalculation, manufacturer governance tickets (/admin/chamados),
  contact inbox triage (/admin/mensagens), slug redirects (ProductRedirect), and responsive data tables.
  Use this skill when modifying admin views, building backoffice tools, or streamlining catalog workflows.
---

# Admin Dashboard & Backoffice Engineer

This skill provides architecture guidelines and UI patterns for the **PetRankings** backoffice (`/admin`), aligned with the **Motor V5** deterministic nutritional evaluation architecture.

## 1. Backoffice Information Architecture (`/admin`)

- **`/admin` (Overview Dashboard):** Metrics for published products, coadjuvant items, open manufacturer tickets (`ManufacturerTicket`), and unread contact messages.
- **`/admin/produtos` (Product Catalog):** Filterable table by species, legal category, classification tier, publication status, and search query; quick links to dedicated create/edit pages.
- **`/admin/produtos/novo` & `/admin/produtos/[id]/editar`:** Dedicated form pages for guaranteed analysis (MN), top ingredients, labeling flags (GMO, antioxidants, meat claim), HTML/SHA-256 custody metadata, packshot upload, affiliate links (`AffiliateLink`), and automatic Motor V5 score calculation.
- **`/admin/chamados` (Canal do Fabricante):** Triage of `ManufacturerTicket` submissions (`ABERTO`, `EM_ANALISE`, `DEFERIDO`, `INDEFERIDO`), tracking 5-business-day `slaDeadline`, CNPJ/MAPA registration, batch updates, and technical rectification requests.
- **`/admin/mensagens` (Contact Inbox):** Status management (`nova`, `lida`, `arquivada`) and spam cleanup.

## 2. Dedicated Form Pages — Never Modals

> **CRITICAL PATTERN:** All creation and editing flows reside on dedicated routes (never modal dialogs) to prevent accidental dismissal and data loss.

Always attach a `beforeunload` guard (`isDirty`) on form pages so navigating away with unsaved edits prompts confirmation.

## 3. Product Commercial Naming Standard (Invariante 13)

- **Canonical Formula:** `[Marca Comercial] [Linha] [Espécie / Porte] [Fase de Vida / Especialidade] [Sabor / Claim Principal] [Formato se Úmido]`
  - Example: `Biofresh Cães Adultos Castrados Raças Médias Mix de Carnes`
- **Mandatory Exclusions:** Never start with `"Ração"` / `"Ração Seca"` / `"Ração Úmida"`; never include package weights (`15kg`, `85g`), trademark symbols (`®`, `™`), or duplicate brand names.
- **Diacritics & Plurals:** Preserve official Portuguese plural and accents (`Cães Adultos`, `Gatos Castrados`, `Raças Médias`, `Sênior`).
- **Duplicate Check & Redirects:** Use `/api/products/check-duplicate` before creating new products. When renaming an existing product's `slug`, automatically record a `ProductRedirect` entry (`sourceSlug -> targetSlug`) inside the same Prisma transaction.

## 4. Admin Quality Checklist

- [ ] All mutations verify `petrankings_admin_token` JWT server-side.
- [ ] Forms use dedicated routes with `beforeunload` unsaved-changes guard.
- [ ] Product commercial names comply with Invariante 13.
- [ ] Changing a product's guaranteed levels or ingredients triggers Motor V5 score recalculation (and keeps `ALIMENTO_COADJUVANTE` without competitive `scoreTotal`).
- [ ] `ManufacturerTicket` SLA deadlines and status transitions are clearly visible in `/admin/chamados`.
- [ ] Interface uses Vanilla CSS Design Tokens (zero Tailwind classes) and avoids prohibited terms ("Auditoria", "Perícia").
