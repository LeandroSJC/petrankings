---
name: appsec-data-shield
description: >-
  Enforces application security, authentication (jose JWT + AdminOtp + Stealth Gatekeeper),
  secret leakage prevention, HTTP security headers (CSP, HSTS, X-Frame-Options), OWASP Top 10
  compliance, Zod input validation, and anti-spam rate limiting across PetRankings. Use this skill
  when hardening API routes, modifying auth/middleware, configuring headers, or inspecting data privacy.
---

# Application Security, Auth & Data Shield (AppSec)

This skill unifies application security, authentication architecture, secret protection, and OWASP Top 10 defenses across **PetRankings**.

## 1. Authentication & 3-Layer Stealth Gatekeeper (`src/middleware.ts`)

Admin access uses **defense-in-depth** across 3 layers:
1. **Production Master Switch:** `ALLOW_ADMIN_IN_PRODUCTION="true"` is required in production; otherwise `/admin`, `/admin/*`, and auth endpoints rewrite to `/_not-found` (404).
2. **Stealth Gatekeeper (404 Camouflage):** Accessing `ADMIN_SECRET_GATE_PATH?key=ADMIN_GATE_KEY` issues the signed `petrankings_admin_gate` cookie (`httpOnly`, `secure`, `sameSite: 'lax'`) and unlocks `/admin/login`. Direct scans receive 404.
3. **Email OTP + Stateless JWT Session:**
   - Login flow: `/api/auth/otp/request` sends a time-limited OTP via Resend (`AdminOtp` model with `codeHash`, `expiresAt`, `attempts`); `/api/auth/otp/verify` validates it and issues the `petrankings_admin_token` JWT (`jose`, `HS256`, `JWT_SECRET >= 32 chars`, `httpOnly`, `secure`, `sameSite: 'lax'`).
   - Password hashing (when used) employs `bcryptjs` (salt rounds >= 10).
   - Every admin API route handler MUST re-verify the JWT session server-side and return `401 Unauthorized` / `403 Forbidden` on failure.

## 2. Secret & Data Leakage Prevention

- **`NEXT_PUBLIC_*` Policy:** Only non-sensitive values (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`). **Never** expose `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ADMIN_GATE_KEY`, `RESEND_API_KEY`, or `UMAMI_SECRET`.
- **API Data Minimization:** Never return `passwordHash`, `codeHash`, internal stack traces, or raw Prisma errors in JSON responses. Log details server-side and return generic user-safe messages.
- **Repository Hygiene:** `.env*` (except `.env.example`), `*.key`, `*.pem`, and `_backups_nuvem/` must remain in `.gitignore`.

## 3. HTTP Security Headers (`next.config.mjs`)

- Enforce `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, and `poweredByHeader: false`.
- Keep `/uploads/:path*.html` tagged with `X-Robots-Tag: noindex, nofollow` so raw custody HTML files are never indexed.
- Keep Next.js patched (`15.5.x` latest security releases) to mitigate framework CVEs.

## 4. OWASP Top 10 & Anti-Spam Protections

- **Input Validation (Zod):** Validate every Route Handler and Server Action payload with `zod` (`z.object().safeParse(...)`) to enforce types, length limits, and strip unexpected fields.
- **SQL Injection:** Always use Prisma parameterized queries; avoid `$queryRawUnsafe`.
- **XSS:** Never pass unsanitized user input to `dangerouslySetInnerHTML` or dynamic `href`/`src` attributes. Validate external URLs strictly for `https://`.
- **Public Form Protection (`/contato`, `/fabricante`):** Enforce triple protection: invisible honeypot (`website_hp`), minimum fill-time guard (`>= 2.5s`), and PostgreSQL-backed rate limiting (`ContactRateLimit`).

## 5. Security Verification Checklist

- [ ] Admin routes and mutations verify `petrankings_admin_token` server-side (`401` on invalid/missing).
- [ ] No private secrets prefixed with `NEXT_PUBLIC_` or leaked in client bundles.
- [ ] Cookies set with `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`.
- [ ] All POST/PUT/PATCH/DELETE handlers validate payloads with Zod.
- [ ] Public forms enforce honeypot + time trap + DB rate limit.
- [ ] `next.config.mjs` headers and CSP contain only legitimate domains (no Tailwind CDN or unused origins).
