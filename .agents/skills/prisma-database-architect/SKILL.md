---
name: prisma-database-architect
description: >-
  Expert guidance for Prisma ORM data modeling, database schema migrations, query optimization,
  referential integrity, transactional consistency, and SQLite/PostgreSQL transitions.
  Use this skill whenever editing prisma/schema.prisma, running migrations, writing seed scripts,
  optimizing database queries, or preparing database production deployment.
---

# Prisma & Database Architecture Specialist

This skill guides the database lifecycle, data modeling, performance tuning, and schema evolution for the PetRankings project using Prisma ORM.

## 1. Data Modeling & Schema Conventions (`prisma/schema.prisma`)

- **Primary Keys & Identifiers**: Use standard `cuid()` identifiers (`@id @default(cuid())`) for scalability and URL stability.
- **Timestamps**: Always include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on all primary entities.
- **Referential Actions**:
  - Use `onDelete: Cascade` for dependent leaf nodes (e.g. `ProductStore` when a `Product` is deleted).
  - Use `onDelete: Restrict` on critical associations (e.g. `RankingProduct` to prevent accidental product deletion while actively referenced in a published ranking).
- **Indexing & Uniqueness**: Define composite unique indexes with `@@unique([fieldA, fieldB])` for relation join tables and store credentials.

## 2. Calculation & Rating Propagation Engine

When modifying product ratings or linked store reviews:
1. Filter out invalid/null ratings (keep strictly ratings between `0.0` and `5.0`).
2. Calculate the arithmetic average, rounded to 2 decimal places.
3. Update `averageRating` and `ratingUpdatedAt` on the `Product`.
4. Propagate `dataUpdatedAt: new Date()` to all `Ranking` records containing this product.

## 3. Database Migration Workflow

### Local Development (SQLite):
```bash
# Apply schema changes during development
npx prisma db push

# Generate updated client types
npx prisma generate

# Populate database with default seeds
npx prisma db seed # or npx tsx prisma/seed.ts
```

### Production Transition (PostgreSQL / Supabase / Neon):
1. Switch `provider = "postgresql"` in `prisma/schema.prisma`.
2. Configure `DATABASE_URL` and `DIRECT_URL` (for connection pooling / PgBouncer).
3. Generate formal SQL migrations with `npx prisma migrate dev --name <migration_name>`.
4. Deploy migrations in production CI/CD with `npx prisma migrate deploy`.

## 4. Query Optimization & Safety Checklist

- [ ] Select only necessary fields on large lists to avoid overfetching.
- [ ] Use `include` thoughtfully; avoid deep recursive nested includes.
- [ ] Verify referential integrity safety before running delete operations (`checkProductDeletionSafety`).
- [ ] Execute multi-table updates inside `prisma.$transaction([...])` to ensure ACID atomicity.
