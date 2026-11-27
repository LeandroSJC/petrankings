---
name: prisma-database-architect
description: >-
  Expert guidance for Prisma ORM 6.4 and PostgreSQL 16 data modeling, schema migrations, query
  optimization, indexes, pagination, referential integrity, and transactional consistency across
  PetRankings. Use this skill whenever editing prisma/schema.prisma, running migrations, writing
  seed scripts, optimizing Prisma queries, or preparing database production changes.
---

# Prisma & PostgreSQL Architecture Specialist

This skill unifies data modeling, schema evolution, query performance, and transaction safety for **PetRankings** on **PostgreSQL 16 + Prisma ORM 6.4**.

## 1. Current Data Model (`prisma/schema.prisma`)

Primary models in production:
- **`User`**: Admin/curador accounts (`id`, `email`, `passwordHash`, `role`, `lastLoginAt`).
- **`Product`**: Core catalog entity with taxonomy (`legalCategory`, `species`, `lifeStage`, `breedSize`, `foodType`, `coadjuvanteCondition`), HTML/SHA-256 custody (`sourceUrl`, `sourceArchiveUrl`, `sourceDocumentUrl`, `frontLabelImageUrl`, `labelCollectionDate`), guaranteed analysis levels (MN), labeling flags (`meatClaimType`, `containsGmo`, `antioxidantType`, `topIngredients`), and Motor V5 evaluation fields (`scoreTotal`, `classificationTier`, `scoreBreakdown`, `calculatedAt`).
- **`AffiliateLink`**: Partner store offers linked to `Product` (`onDelete: Cascade`, `@@unique([productId, store])`).
- **`ManufacturerTicket`**: Canal do Fabricante governance tickets (`ticketNumber`, `productId`, `cnpj`, `mapaRegistration`, `requestType`, `status`, `slaDeadline`), `onDelete: SetNull`.
- **`ProductRedirect`**: Canonical 301 slug redirects (`sourceSlug` -> `targetSlug`) to preserve SEO when product slugs change.
- **`ContactMessage` & `ContactRateLimit`**: Public contact inbox and DB-backed anti-spam rate limiting.
- **`AdminOtp`**: Time-limited email OTP codes for admin authentication.

## 2. Schema & Migration Conventions

- **Primary Keys:** Always `String @id @default(cuid())`.
- **Timestamps:** Include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- **PostgreSQL Only:** Standardized across local tunnel (`npm run tunel` on port `5433`) and Oracle Cloud VPS Docker container (`petrankings-postgres`).
- **Migrations & Sync:**
  - `npx prisma generate` after any schema edit.
  - `npx prisma migrate dev --name <migration_name>` for versioned schema evolution.
  - `npx prisma migrate deploy` in production (never run destructive `db push --force-reset` against prod).

## 3. Query Patterns & Performance

- **Use Existing Indexes:** Leverage composite indexes on `Product` (`[isPublished, species, legalCategory]`, `[isPublished, species, lifeStage]`, `[scoreTotal]`, `[classificationTier]`) and `ManufacturerTicket` (`[status, slaDeadline]`, `[cnpj]`).
- **Avoid Overfetching:** Always use `select` on catalog lists and index pages; reserve full `scoreBreakdown` / `editorialOpinion` fetches for `/produto/[slug]` and `/comparar`.
- **Pagination:** Always paginate admin tables (`/admin/produtos`, `/admin/chamados`, `/admin/mensagens`) with `take` / `skip` or cursor pagination + parallel `prisma.$transaction([findMany, count])`.
- **Transactional Atomicity:** Wrap multi-table updates (e.g., slug rename + `ProductRedirect` creation, or product update + `AffiliateLink` replacement) inside `prisma.$transaction(...)`.
- **Safe Slug Changes:** Whenever changing `Product.slug`, insert a `ProductRedirect` record mapping `oldSlug -> newSlug` in the same transaction so Google indexation and backlinks never break.

## 4. Pre-Flight Checklist

- [ ] No destructive migration or broad `DELETE` without `WHERE`.
- [ ] New filter/sort columns backed by appropriate `@@index`.
- [ ] All callers of modified fields checked across `src/` and `scripts/`.
- [ ] Multi-step writes wrapped in `prisma.$transaction`.
