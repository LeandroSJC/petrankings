---
name: devops-deployment-expert
description: >-
  Procedures and configurations for deploying Next.js applications to production platforms (Vercel, Docker, VPS, Railway),
  managing environment variables, setting up CI/CD workflows, and configuring database connections.
  Use this skill when preparing production builds, configuring Docker/Dockerfile, setting up GitHub Actions,
  or troubleshooting deployment and hosting issues.
---

# DevOps & Production Deployment Specialist

This skill provides deployment runbooks, CI/CD pipelines, containerization, and production environment management for the PetRankings Next.js application.

## 1. Database Configuration

The project uses **PostgreSQL** in all environments (development and production). The `prisma/schema.prisma` uses `provider = "postgresql"`.

```bash
# Required environment variable
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

For local development, you can use a hosted PostgreSQL (Neon, Supabase free tier) or Docker:
```bash
docker run --name petrankings-pg -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
```

## 2. Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Always | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Always | Min 32 chars, random string for JWT signing |
| `NEXT_PUBLIC_SITE_URL` | ✅ Always | Full URL (e.g. `https://petrankings.com.br`) |
| `ALLOW_ADMIN_IN_PRODUCTION` | ⚠️ Optional | Set to `"true"` to expose `/admin` routes in production. By default, admin is blocked on production deployments. |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Optional | Google AdSense publisher ID |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | Optional | Ad unit slot IDs |

> **IMPORTANT:** The middleware blocks all `/admin/*` routes in production by default (returns 404). To enable admin access in production, set `ALLOW_ADMIN_IN_PRODUCTION=true` in the hosting environment.

## 3. Production Build & Optimization Workflow

Before triggering a production deployment, ensure the build process compiles cleanly:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Typecheck without emitting files
npx tsc --noEmit

# 3. Production bundle build
npm run build
```

The `package.json` `build` script already runs `prisma generate && next build`.

## 4. Database Migrations in Production

```bash
# Apply pending migrations to production database
npx prisma migrate deploy

# Seed initial admin user (if needed)
npx tsx prisma/seed.ts
```

## 5. Deployment Targets

### Option A: Vercel (Recommended for Next.js)
1. Link repository to Vercel.
2. Set Environment Variables in Project Settings (see Section 2).
3. Build Command: `prisma generate && next build` *(already in package.json)*
4. Output Directory: `.next`
5. Add PostgreSQL add-on (Vercel Postgres, Neon, or Supabase).

### Option B: Docker / Self-Hosted VPS
- Use a multi-stage `Dockerfile` with Node.js Alpine base image:
  - Stage 1: `deps` (install `node_modules`).
  - Stage 2: `builder` (`prisma generate && npm run build`).
  - Stage 3: `runner` (run `node server.js` with standalone Next.js output).

### Option C: Railway / Render
1. Connect GitHub repository.
2. Set all required env vars.
3. Start command: `npx prisma migrate deploy && npm run start`

## 6. GitHub Actions CI/CD Pipeline Template

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npm run build
      - name: Run migrations
        run: npx prisma migrate deploy
```

## 7. Deployment Verification Checklist

- [ ] All required environment variables configured in hosting dashboard.
- [ ] `DATABASE_URL` points to production PostgreSQL (not local).
- [ ] `npx prisma migrate deploy` ran successfully against production DB.
- [ ] SSL certificate active (`https://`).
- [ ] Dynamic sitemap (`/sitemap.xml`) and `robots.txt` accessible to search engines.
- [ ] Admin authentication and database transactions verified in live environment.
- [ ] `ALLOW_ADMIN_IN_PRODUCTION` set intentionally (defaults to blocked).
