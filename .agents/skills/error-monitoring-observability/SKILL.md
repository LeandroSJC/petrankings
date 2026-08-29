---
name: error-monitoring-observability
description: >-
  Implements error tracking, structured logging, React Error Boundaries, and observability for PetRankings.
  Use this skill when setting up Sentry error monitoring, adding structured error logging to API routes,
  implementing React Error Boundaries for graceful UI fallbacks, or debugging production errors without
  exposing internal stack traces to users.
---

# Error Monitoring & Observability

This skill guides the implementation of error tracking, structured logging, and graceful error handling across the PetRankings platform.

## 1. Structured Error Logging in API Routes

Never expose internal error details to users. Log internally and return safe messages:

```typescript
// Pattern to use in ALL API route handlers
import * as Sentry from '@sentry/nextjs';

export async function GET(req: Request) {
  try {
    const data = await prisma.ranking.findMany({ where: { isPublished: true } });
    return Response.json(data);
  } catch (error) {
    // Log the full error server-side (visible in Vercel logs, Docker logs, etc.)
    console.error('[API /api/rankings GET]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Also report to Sentry (no-op if Sentry isn't configured) — console logs alone
    // are easy to miss; Sentry gives alerting + grouping on top of the same data.
    Sentry.captureException(error, { tags: { route: '/api/rankings', method: 'GET' } });

    // Return a safe generic message to the client
    return Response.json(
      { error: 'Ocorreu um erro interno. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
```

> Note: with `instrumentation.ts` configured (see section 4), unhandled errors thrown from Server Components, Server Actions, and middleware are captured automatically via `onRequestError` — you don't need a manual `Sentry.captureException` call in every one of those. Route Handlers (like the one above) are the main place manual capture is still needed, since their `try/catch` swallows the error before it reaches the request-error hook.

## 2. React Error Boundaries

Add Error Boundaries to isolate failures and prevent full page crashes:

```tsx
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Algo inesperado aconteceu. Por favor, recarregue a página.</p>
          <button onClick={() => this.setState({ hasError: false })}>Tentar novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Usage in layouts:
```tsx
// Wrap sections that fetch external data
<ErrorBoundary fallback={<RankingErrorFallback />}>
  <RankingProductList products={products} />
</ErrorBoundary>
```

## 3. Next.js Error Pages

`error.tsx` and `global-error.tsx` are **not interchangeable** — mixing them up is a common bug:

- **`error.tsx`** — a Client Component error boundary scoped to a route segment (and everything below it). It's rendered *inside* the existing root layout, so it must **not** include `<html>`/`<body>` tags. Every folder under `app/` can have its own.
- **`global-error.tsx`** — only fires when the error is in the **root layout itself**. Because it replaces the root layout when it renders, it **must** include its own `<html>`/`<body>` tags. Most apps only need one, at `src/app/global-error.tsx`.

```tsx
// src/app/error.tsx — handles runtime errors in a route segment (not the root layout)
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }; // `digest` correlates this client error to the server log entry
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}>
      <h1>Algo deu errado</h1>
      <p>Nossos técnicos foram notificados. Tente recarregar a página.</p>
      {error.digest && <p style={{ fontSize: '0.8rem', color: '#888' }}>Código: {error.digest}</p>}
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
```

```tsx
// src/app/global-error.tsx — only catches errors thrown by the root layout itself
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // global-error.tsx replaces the root layout — it MUST render its own <html>/<body>
  return (
    <html lang="pt-BR">
      <body>
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}>
          <h1>Erro na aplicação</h1>
          <p>Nossos técnicos foram notificados. Tente recarregar a página.</p>
          <button onClick={reset}>Recarregar</button>
        </main>
      </body>
    </html>
  );
}

// src/app/not-found.tsx — 404 page (not an error — don't send this to Sentry)
export default function NotFound() {
  return (
    <main>
      <h1>Página não encontrada</h1>
      <a href="/">Voltar ao início</a>
    </main>
  );
}
```

### Server-side errors: `instrumentation.ts`

`error.tsx` and `global-error.tsx` are Client Components — they only catch errors that reach the browser. Errors thrown in Server Components, Server Actions, and middleware need a separate hook, `onRequestError`, wired up in `instrumentation.ts` at the project root:

```typescript
// instrumentation.ts
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captures errors from Server Components, Server Actions, and middleware
export const onRequestError = Sentry.captureRequestError;
```

Without this, server-side rendering errors that never throw inside a `try/catch` in your own code (section 1) go completely unreported.

## 4. Sentry Integration (Optional — Recommended for Production)

Sentry provides free error tracking with stack traces, breadcrumbs, and alerts:

```bash
# Install Sentry SDK
npm install @sentry/nextjs

# Run the setup wizard — creates instrumentation-client.ts, sentry.server.config.ts,
# sentry.edge.config.ts, instrumentation.ts, and global-error.tsx, and wraps next.config.ts
npx @sentry/wizard@latest -i nextjs
```

Add environment variables:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ORG=your-org
SENTRY_PROJECT=petrankings
```

> **Naming note:** older guides and tutorials show `sentry.client.config.ts` for the browser runtime — that file is superseded by **`instrumentation-client.ts`** in current `@sentry/nextjs` versions. The server (`sentry.server.config.ts`) and edge (`sentry.edge.config.ts`) files are unchanged; only the client one moved.

### Key Sentry configuration for PetRankings:
```typescript
// instrumentation-client.ts — runs in the browser
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
  replaysSessionSampleRate: 0,     // Disable session replays for normal sessions (privacy)
  replaysOnErrorSampleRate: 1.0,   // But always capture a replay when an error actually occurs
  environment: process.env.NODE_ENV,
  // Do not log admin login errors to avoid leaking attempt info
  beforeSend(event) {
    if (event.request?.url?.includes('/admin/login')) return null;
    return event;
  },
});

// Required so Sentry can trace client-side route transitions in the App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

```typescript
// sentry.server.config.ts — runs in the Node.js runtime
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
});
```

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // ...existing config
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,       // Quiet Sentry CLI output outside CI
  widenClientFileUpload: true,   // Upload source maps for readable stack traces
  hideSourceMaps: true,          // Don't expose source maps in the shipped bundle
  disableLogger: true,           // Strip Sentry's own debug logging from the prod bundle
});
```

Pair this with the `instrumentation.ts` file from section 3 so both client- and server-side errors are captured — `instrumentation-client.ts` alone only sees errors that reach the browser.

## 5. Observability Checklist

- [ ] All API route handlers have `try/catch` blocks with structured `console.error` logging AND `Sentry.captureException` (when Sentry is configured).
- [ ] Error responses return safe generic messages (`status: 500`, no stack traces, no `error.message` shown to users in production).
- [ ] `src/app/error.tsx` (segment-scoped, no `<html>`/`<body>`) and `src/app/global-error.tsx` (root-layout-scoped, **must** include `<html>`/`<body>`) are both implemented — they are not the same file. `src/app/not-found.tsx` is implemented separately and is not reported to Sentry.
- [ ] `error.tsx` and `global-error.tsx` both destructure `error` (not just `reset`), call `Sentry.captureException(error)` in a `useEffect`, and can show `error.digest` to correlate the client view with the server log entry.
- [ ] `instrumentation.ts` exports `onRequestError = Sentry.captureRequestError` so Server Component, Server Action, and middleware errors are captured — not just the ones that hit a `try/catch` in Route Handlers.
- [ ] React Error Boundaries wrap major data-fetching sections and call `Sentry.captureException` in `componentDidCatch`.
- [ ] Admin API errors include the route path in the log prefix (and as a Sentry tag) for easy filtering.
- [ ] (Optional) Sentry configured across all three runtimes: `instrumentation-client.ts` (browser — not the older `sentry.client.config.ts`), `sentry.server.config.ts` (Node.js), `sentry.edge.config.ts` (edge), with `next.config.ts` wrapped in `withSentryConfig`.
- [ ] `tracesSampleRate` is lower in production than in development (e.g. `0.1` prod / `1.0` dev) to avoid burning through quota.
