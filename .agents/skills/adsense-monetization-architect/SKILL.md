---
name: adsense-monetization-architect
description: >-
  Architects and manages Google AdSense programmatic monetization, responsive ad units, CLS (Cumulative
  Layout Shift) prevention, ads.txt validation, Google Publisher Policy compliance, ad density balance,
  and asynchronous high-performance ad delivery across PetRankings. Use this skill when configuring
  AdSense publisher IDs, placing ad banners, resolving layout shifts from ads, setting up ads.txt, or
  auditing ad policy compliance.
---

# Google AdSense Monetization Architect

This skill provides architecture guidelines, placement strategies, policy compliance rules, and component patterns for integrating Google AdSense into Next.js applications while preserving fast page loads and optimal Core Web Vitals.

## 1. Google AdSense Architecture in Next.js

### A. Environment Configuration
AdSense publisher and slot IDs must be configured via environment variables:

```bash
# .env.local
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_TOP=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_FEED=2345678901
NEXT_PUBLIC_ADSENSE_SLOT_FOOTER=3456789012
```

### B. Asynchronous Script Loading (`src/app/layout.tsx`)
Load the AdSense script asynchronously without blocking the Critical Rendering Path:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="pt-BR">
      <head>
        {adsenseId && (
          <Script
            id="google-adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 2. Zero-CLS Responsive Ad Component Pattern

To prevent Cumulative Layout Shift (CLS), ad containers must enforce explicit min-height reservations and proper disclosure labels.

```tsx
'use client';

import React, { useEffect } from 'react';

interface AdSenseUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  minHeight?: string;
  className?: string;
}

export default function AdSenseUnit({
  slotId,
  format = 'auto',
  responsive = true,
  minHeight = '100px',
  className = '',
}: AdSenseUnitProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && clientId && slotId) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (err) {
      // Ignorar erros de adblocker
    }
  }, [clientId, slotId]);

  // Modo de Desenvolvimento ou sem ID configurado: exibir placeholder discreto
  if (!clientId || !slotId) {
    return (
      <aside
        className={`ad-container ${className}`}
        aria-label="Espaço Publicitário"
        style={{
          minHeight,
          backgroundColor: 'var(--bg-cream-subtle)',
          border: '1px dashed var(--border-cream)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          margin: '24px 0',
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-subtle)' }}>
          Publicidade
        </span>
      </aside>
    );
  }

  return (
    <aside
      className={`ad-container ${className}`}
      aria-label="Publicidade"
      style={{
        minHeight,
        margin: '24px 0',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-subtle)', marginBottom: '4px' }}>
        Publicidade
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </aside>
  );
}
```

## 3. Strict ads.txt Setup (`public/ads.txt` or `src/app/ads.txt/route.ts`)

Google AdSense mandates a valid `ads.txt` file at the root of the domain:

```text
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Implementation via Route Handler (`src/app/ads.txt/route.ts`):

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.replace('ca-', '') || 'pub-XXXXXXXXXXXXXXXX';
  const content = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
```

## 4. Google Publisher Policy Compliance Checklist

- [ ] **Accidental Click Prevention**: Ad units must have at least `24px` margin from interactive buttons (especially affiliate purchase links).
- [ ] **Mandatory Labeling**: Every ad container includes an accessible `"Publicidade"` or `"Anúncio"` indicator.
- [ ] **Ad Density Balance**: Ensure content outbalances advertising (never place consecutive ad units without editorial content in between).
- [ ] **CLS Guard**: All ad units specify explicit `min-height` inline or in CSS.
- [ ] **ads.txt Verification**: Verify that `/ads.txt` responds with status `200` and `Content-Type: text/plain`.
