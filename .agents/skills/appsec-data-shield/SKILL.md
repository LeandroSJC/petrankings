---
name: appsec-data-shield
description: >-
  Audits and enforces application security, secret leakage prevention, HTTP security headers,
  OWASP Top 10 compliance, input sanitization, rate-limiting, and defensive programming across PetRankings.
  Use this skill when auditing data privacy, inspecting .env/secrets protection, configuring security headers
  (CSP, HSTS, X-Frame-Options), hardening API endpoints, or mitigating injection and leakage risks.
---

# Application Security & Data Leak Shield (AppSec)

This skill enforces enterprise-grade application security standards, OWASP compliance, and zero-leakage policies across the PetRankings codebase.

## 1. Secret & Sensitive Data Leakage Prevention

### A. Environment Variable Classification
- **Public Variables (`NEXT_PUBLIC_*`)**:
  - ONLY allowed for non-sensitive identifiers (e.g. `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`).
  - **CRITICAL**: NEVER prefix `JWT_SECRET`, database connection strings, passwords, private keys, or API tokens with `NEXT_PUBLIC_`.
- **Private Variables**:
  - `DATABASE_URL`, `JWT_SECRET`, `SMTP_PASSWORD`, `ADMIN_SECRET_KEY` must remain strictly server-side.

### B. Git Ignore & Repository Sanitization (`.gitignore`)
The repository must permanently ignore:
- `.env`, `.env.local`, `.env.production`, `.env.*.local`
- SQLite databases: `*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm`
- Node modules, logs, build artifacts, `.next/`

### C. API Response Data Minimization
- Never return password hashes (`passwordHash`), secret keys, or internal error stack traces in JSON responses.
- Catch errors server-side with structured logging and return user-safe generic messages in production (e.g. `{ error: 'Ocorreu um erro interno. Tente novamente mais tarde.' }`).

## 2. HTTP Security Headers (`next.config.mjs`)

Enforce modern defense-in-depth headers on all responses:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];
```

## 3. OWASP Top 10 Protections

### A. Broken Access Control & Auth Bypass
- Protect all `/admin/*` views and `/api/admin/*`, `/api/products/*`, `/api/rankings/*`, `/api/messages/*` mutation endpoints using `getSession()` JWT verification.
- Return `401 Unauthorized` immediately if session is missing or invalid.
- Store session JWTs in `httpOnly: true`, `secure: true`, `sameSite: 'lax' | 'strict'` cookies.

### B. Injection & Input Sanitization
- Rely on Prisma ORM's parameterized queries to eliminate SQL Injection.
- Sanitize and validate all string inputs using length restrictions (`maxLength`), type checks, and regex/url whitelist validations.
- Escape dangerous characters in user input to prevent Cross-Site Scripting (XSS).

### C. Anti-Spam & DoS Mitigations
- Enforce Honeypot (`website_hp`) + Timestamp checking on public forms (e.g. Contact form `/contato`).
- Enforce rate-limiting per IP/Email for form submissions.

## 4. Security Audit Checklist

- [ ] `.gitignore` contains all `.env` variants and SQLite database files.
- [ ] No private secrets referenced via `NEXT_PUBLIC_` or bundled in client components.
- [ ] `next.config.mjs` configures standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`).
- [ ] Admin API routes reject unauthorized mutations (`401`).
- [ ] Error messages do not leak internal database schemas, tables, or stack traces.
