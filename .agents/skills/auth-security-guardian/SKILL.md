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
  - Store session tokens in `httpOnly`, `secure`, `sameSite: 'strict'` cookies to prevent client-side JavaScript theft (XSS).
- **Password Hashing with `bcryptjs`**:
  - Use a minimum salt round of 10 (`bcrypt.hash(password, 10)`).
  - Never log raw passwords or plain credentials in error traces or console logs.

## 2. API Route Protection & Rate Limiting

- **Admin Route Guards**:
  - Inspect auth cookies at the Next.js middleware level (`middleware.ts`) and inside API route handlers.
  - Return `401 Unauthorized` for missing/expired tokens and `403 Forbidden` for insufficient role permissions.
- **Public Endpoint Protections (e.g. Contact Form & Feedback)**:
  - **Honeypot Trap**: Invisible field (`website_hp`) that triggers an immediate silent reject if filled by bots.
  - **Time-based Verification**: Reject submissions received under 3 seconds from form initialization (`formOpenedAt`).
  - **IP/Email Rate Limiting**: Limit submissions (e.g. max 5 messages per hour per email/IP) using database rate-limit records (`ContactRateLimit`).

## 3. Input Validation & Injection Prevention

- **Sanitization**:
  - Trim and validate all incoming string fields (names, emails, slugs, URLs).
  - Use parameterized Prisma queries (natively immune to SQL injection).
  - Escape or disallow raw HTML tags in user-generated messages and product descriptions.
- **URL Validation for Stores & Affiliates**:
  - Verify that submitted URLs start with valid protocols (`https://`).
  - Restrict affiliate store domains to known whitelist keys (`amazon.com.br`, `mercadolivre.com.br`, `petlove.com.br`, `cobasi.com.br`, `shopee.com.br`).

## 4. Security Audit Checklist

- [ ] All admin API routes require valid JWT verification.
- [ ] No sensitive credentials (hashes, secrets, database connection strings) exposed to client bundles.
- [ ] Cookies configured with `httpOnly: true`, `secure: true`, `sameSite: 'lax' | 'strict'`.
- [ ] Anti-spam honeypot and rate-limiting active on public forms.
- [ ] Security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) enforced.
