---
name: devops-deployment-expert
description: >-
  Procedures and configurations for deploying Next.js applications to production platforms (Vercel, Docker, VPS, Railway),
  managing environment variables, setting up CI/CD workflows, and migrating SQLite to PostgreSQL in production.
  Use this skill when preparing production builds, configuring Docker/Dockerfile, setting up GitHub Actions,
  or troubleshooting deployment and hosting issues.
---

# DevOps & Production Deployment Specialist

This skill provides deployment runbooks, CI/CD pipelines, containerization, and production environment management for the PetRankings Next.js application.

## 1. Production Build & Optimization Workflow

Before triggering a production deployment, ensure the build process compiles cleanly:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Typecheck without emitting files
npx tsc --noEmit

# 3. Production bundle build
npm run build
```

## 2. Deployment Targets

### Option A: Vercel / Netlify (Recommended for Next.js)
1. Link repository to Vercel.
2. Set Environment Variables in Project Settings:
   - `DATABASE_URL`: Connection string to hosted PostgreSQL (e.g. Supabase, Neon, or Railway PostgreSQL).
   - `JWT_SECRET`: Secure random 32+ character string.
   - `NEXT_PUBLIC_SITE_URL`: `https://petrankings.com.br`
3. Build Command: `prisma generate && next build`
4. Output Directory: `.next`

### Option B: Docker / Self-Hosted VPS
- Use a multi-stage `Dockerfile` with Node.js Alpine base image:
  - Stage 1: `deps` (install `node_modules`).
  - Stage 2: `builder` (`prisma generate && npm run build`).
  - Stage 3: `runner` (run `node server.js` with standalone Next.js output).

## 3. Database Migration in Production (SQLite ➔ PostgreSQL)

1. When deploying to serverless/edge environments (like Vercel), local SQLite files are ephemeral. Use a managed PostgreSQL instance (Supabase, Neon, AWS RDS, Railway).
2. Run database migrations as part of the deployment pipeline:
   ```bash
   npx prisma migrate deploy
   ```

## 4. GitHub Actions CI/CD Pipeline Template

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
```

## 5. Deployment Verification Checklist

- [ ] All required environment variables configured in hosting dashboard.
- [ ] Database migrations deployed and accessible.
- [ ] SSL certificate active (`https://`).
- [ ] Dynamic sitemap (`/sitemap.xml`) and `robots.txt` accessible to search engines.
- [ ] Admin authentication and database transactions verified in live environment.
