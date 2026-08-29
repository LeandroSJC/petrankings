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

> 🚨 **Framework patching (August 25, 2026):** Next.js shipped a critical-severity security release fixing two unauthenticated RCE vulnerabilities — one via AVIF image optimization (see the `image-upload-manager` skill for details), and a second (`CVE-2026-75604`) affecting apps that use **both** the Pages Router and App Router without Cache Components, on **Windows-hosted** servers specifically (Linux/macOS are unaffected). Confirm PetRankings is on Next.js `16.3.3` / `15.5.24` or later. Keeping the framework patched is itself an AppSec control — no amount of header/input hardening substitutes for it.

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

> ⚠️ **This list is missing `Content-Security-Policy`**, despite this skill's own description naming CSP as something it covers. `X-Frame-Options: DENY` protects against clickjacking in older browsers, but the modern, more capable equivalent is CSP's `frame-ancestors` directive — and CSP additionally mitigates XSS by restricting where scripts, styles, and other resources can load from. Add it.

### Adding CSP with a per-request nonce

CSP headers can't be static entries in the `securityHeaders` array above if you want to avoid `'unsafe-inline'` for scripts — a fresh nonce needs generating per request. Do this in `proxy.ts` (the file `middleware.ts` was renamed to in Next.js 16 — the old name and `export function middleware` still work today via the codemod, but new code should use the current name):

```typescript
// proxy.ts (formerly middleware.ts)
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data: *.vercel-storage.com res.cloudinary.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
  return response;
}
```

Nonces require dynamic rendering — a page generated statically at build time has no per-request nonce to inject. If a route needs to stay static, either accept a slightly looser policy for it (`'unsafe-inline'` on `script-src` for that route only) or opt it into dynamic rendering.

## 3. OWASP Top 10 Protections

### A. Broken Access Control & Auth Bypass
- Protect all `/admin/*` views and `/api/admin/*`, `/api/products/*`, `/api/rankings/*`, `/api/messages/*` mutation endpoints using `getSession()` JWT verification.
- Return `401 Unauthorized` immediately if session is missing or invalid.
- Store session JWTs in `httpOnly: true`, `secure: true`, `sameSite: 'lax' | 'strict'` cookies.

### B. Injection & Input Sanitization
- Rely on Prisma ORM's parameterized queries to eliminate SQL Injection.
- Validate every input that reaches a Server Action or Route Handler with a **schema validation library** (Zod is the current default) — not ad hoc `maxLength`/regex checks scattered through handler code. Remember client-side validation is a UX convenience only; an attacker can craft a raw HTTP request that skips the browser entirely, so the server-side schema is the actual security boundary.

```typescript
// src/lib/schemas/contact.ts
import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(2000),
  website_hp: z.string().max(0), // honeypot — real users never fill this
});

// In the Route Handler / Server Action:
const parsed = contactFormSchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
}
```

`z.object()` also strips any field not declared in the schema, which stops unexpected extra fields from ever reaching Prisma.
- React escapes rendered text by default, so classic reflected XSS from `{userInput}` in JSX isn't the main risk — the actual danger points are `dangerouslySetInnerHTML` and any user-supplied URL used as an `href`/`src`. Never use `dangerouslySetInnerHTML` with unsanitized input; if rendering user-supplied HTML/Markdown is ever required, sanitize with a library like DOMPurify first, and lean on the CSP from section 2 as a second layer of defense.

### C. Anti-Spam & DoS Mitigations
- Enforce Honeypot (`website_hp`) + Timestamp checking on public forms (e.g. Contact form `/contato`).
- Enforce rate-limiting per IP/Email for form submissions and any sensitive endpoint (login, password reset). An in-memory counter doesn't work on serverless/edge deployments, since each function invocation is isolated with no shared state — use a distributed limiter backed by Redis:

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Different budgets for different risk levels
export const contactFormRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 submissions per 10 min per IP
  prefix: 'rl:contact',
});

export const adminLoginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 min per IP
  prefix: 'rl:admin-login',
});
```

```typescript
// In the Route Handler / Server Action:
const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
const { success } = await contactFormRatelimit.limit(ip);
if (!success) {
  return Response.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 });
}
```

Requires `@upstash/ratelimit` and `@upstash/redis`, plus a free Upstash Redis instance and its env vars. For admin login specifically, rate limit by IP *and* by the submitted email/username, so an attacker can't spray attempts across many source IPs against one account.

## 4. Security Audit Checklist

- [ ] Next.js is patched to `16.3.3` / `15.5.24` or later (see the framework patching advisory at the top of this file).
- [ ] `.gitignore` contains all `.env` variants and SQLite database files.
- [ ] No private secrets referenced via `NEXT_PUBLIC_` or bundled in client components.
- [ ] `next.config.mjs` configures standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`).
- [ ] **`Content-Security-Policy` is set** (via `proxy.ts`/`middleware.ts` for nonce support, or a static policy in `next.config.mjs` if nonces aren't feasible yet) — this was previously missing despite being named in this skill's own description.
- [ ] Every Server Action and Route Handler validates its input with a Zod (or equivalent) schema — not just client-side form checks.
- [ ] `dangerouslySetInnerHTML` is never used with unsanitized user input; any user-supplied HTML/Markdown goes through DOMPurify first.
- [ ] Sensitive endpoints (admin login, contact form, password reset) are rate-limited with a distributed limiter (e.g. `@upstash/ratelimit`), not an in-memory counter — in-memory state doesn't persist across serverless/edge invocations.
- [ ] Admin API routes reject unauthorized mutations (`401`).
- [ ] Error messages do not leak internal database schemas, tables, or stack traces.
