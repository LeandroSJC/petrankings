---
name: auth-security-guardian
description: >-
  Audits and enforces authentication security, session management, rate limiting, anti-spam mechanisms,
  and input sanitization across APIs and the admin dashboard.
  Use this skill when modifying authentication logic (jose/JWT, bcrypt), protecting API routes,
  auditing security vulnerabilities, or configuring security headers.
---

# Authentication & Security Guardian

This skill provides procedures and security guidelines for protecting the PetRankings platform, admin backoffice, contact forms, and REST APIs against unauthorized access, brute-force attacks, and injection vulnerabilities.

## 1. Authentication & Session Architecture

- **Stateless JWT via `jose`**:
  - Sign JWT tokens using `HS256` with strong secret keys (`JWT_SECRET` >= 32 characters).
  - Set strict expiration times (e.g. `1d` for admin sessions, with absolute timeout).
  - Store session tokens in `httpOnly`, `secure`, `sameSite: 'lax'` cookies.
    > **Note:** Use `sameSite: 'lax'` (not `'strict'`) to correctly handle browser redirects during the login flow. `'strict'` blocks cookies on cross-origin navigations, breaking the redirect-after-login UX.
- **Password Hashing with `bcryptjs`**:
  - Use a minimum salt round of 10 (`bcrypt.hash(password, 10)`).
  - Never log raw passwords or plain credentials in error traces or console logs.

## 2. Middleware-Level Route Protection & Stealth Gatekeeper

The middleware (`src/middleware.ts`) enforces three defense-in-depth layers of protection:

### Layer 1 — Production Master Switch:
```typescript
const isProduction = process.env.NODE_ENV === 'production';
const allowAdminInProd = process.env.ALLOW_ADMIN_IN_PRODUCTION === 'true';

if (isProduction && !allowAdminInProd) {
  return NextResponse.rewrite(new URL('/_not-found', req.url));
}
```
> Set `ALLOW_ADMIN_IN_PRODUCTION=true` in production to allow the stealth gate to operate.

### Layer 2 — Stealth Gatekeeper (Camuflagem 404):
```typescript
// O painel (/admin) e a API de login (/api/auth/login) retornam 404 sem o cookie do portão
const gateCookie = req.cookies.get(GATE_COOKIE_NAME)?.value;
const isGateUnlocked = await verifyGateToken(gateCookie);

if (!isGateUnlocked) {
  return NextResponse.rewrite(new URL('/_not-found', req.url));
}
```
- Access is unlocked by visiting `ADMIN_SECRET_GATE_PATH?key=ADMIN_GATE_KEY`.
- Unlocking issues a signed `petrankings_admin_gate` cookie (7 days) and redirects cleanly to `/admin/login`.
- Anyone visiting `/admin` or `/bastidores` directly without the key receives a standard 404 page.

### Layer 3 — JWT Session Verification:
```typescript
// Valida o token de sessão do usuário logado (petrankings_admin_token)
const { payload } = await jwtVerify(token, SECRET_KEY);
if (payload.role !== 'admin') {
  return NextResponse.redirect(loginUrl);
}
```

## 3. API Route Protection & Rate Limiting

- **Admin Route Guards**:
  - Validate auth cookies at the Next.js middleware level AND inside API route handlers (defense in depth).
  - Return `401 Unauthorized` for missing/expired tokens and `403 Forbidden` for insufficient role permissions.
- **Public Endpoint Protections (e.g. Contact Form & Feedback)**:
  - **Honeypot Trap**: Invisible field (`website_hp`) that triggers an immediate silent reject if filled by bots.
  - **Time-based Verification**: Reject submissions received under 2.5 seconds from form initialization (`formOpenedAt`).
  - **IP/Email Rate Limiting**: Limit submissions using database rate-limit records (`ContactRateLimit` model).

## 4. Input Validation & Injection Prevention

- **Sanitization**:
  - Trim and validate all incoming string fields (names, emails, slugs, URLs).
  - Use parameterized Prisma queries (natively immune to SQL injection).
  - Escape or disallow raw HTML tags in user-generated messages and product descriptions.
- **URL Validation for Stores & Affiliates**:
  - Verify that submitted URLs start with valid protocols (`https://`).
  - Validate that store and offer links are well-formed HTTPS URLs from authorized retail partners.

## 5. Security Audit Checklist

- [ ] All admin API routes require valid JWT verification.
- [ ] No sensitive credentials (hashes, secrets, database connection strings) exposed to client bundles.
- [ ] Cookies configured with `httpOnly: true`, `secure: true`, `sameSite: 'lax'`.
- [ ] Anti-spam honeypot and rate-limiting active on public forms.
- [ ] Security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) enforced.
- [ ] `ALLOW_ADMIN_IN_PRODUCTION` env var is only set when intentionally exposing admin in prod.
