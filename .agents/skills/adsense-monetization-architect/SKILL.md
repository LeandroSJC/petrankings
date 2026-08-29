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

> 🚨 **Missing compliance requirement: consent management.** Since January 16, 2024, Google requires AdSense publishers to use a **Google-certified CMP integrated with the IAB's Transparency and Consent Framework (TCF)** — and to implement **Google Consent Mode v2** — before serving ads to users in the EEA, UK, or Switzerland. Without it, PetRankings is not eligible to serve *personalized* ads to that traffic (it falls back to non-personalized/Limited Ads, which still earn less and still require basic consent for frequency-capping and fraud-prevention cookies under ePrivacy). As of February 28, 2026, Google also requires the newer TCF v2.3 consent string — older v2.2 integrations stopped being accepted. None of this exists in the current skill; see section 1C below for what to add.
>
> **Cross-skill conflict:** if PetRankings uses the `appsec-data-shield` skill's suggested `Permissions-Policy` header, note that it sets `browsing-topics=()`, which disables Chrome's Privacy Sandbox Topics API. Since third-party cookies are now fully deprecated in Chrome (full rollout completed Q1 2026), Topics is one of the signals AdSense uses for interest-based ad targeting when consent allows it. Disabling it isn't wrong — plenty of publishers do — but it's a monetization trade-off the two skills should agree on explicitly rather than one silently overriding the other.

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

> ⚠️ This loads the AdSense script unconditionally for every visitor. For EEA/UK/Swiss traffic, Google requires consent to be collected **before** ads (personalized or not) are requested — see section 1C. In practice this means gating this `<Script>` (or at minimum the ad calls it enables) behind your CMP's consent state, not firing it on every page load regardless of region or consent.

### C. Consent Management (Google Consent Mode v2 + Certified CMP)

Required for EEA/UK/Swiss traffic; recommended everywhere as the industry baseline. This is a real integration (Google publishes a list of certified CMPs — e.g. Cookiebot, Didomi, Secure Privacy, or Google's own "Privacy & messaging" tool in AdSense), not something to hand-roll from scratch. The shape of the integration:

1. **Install a certified CMP** that supports TCF v2.3 (Google stopped accepting the older v2.2 consent string after February 28, 2026) and Consent Mode v2. Most offer a Next.js-compatible snippet or npm package.
2. **Default all four Consent Mode v2 signals to denied** before the CMP banner has been answered: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`. The two v2-specific signals (`ad_user_data`, `ad_personalization`) are what actually gate whether AdSense can serve *personalized* ads.
3. **Update consent state** via `gtag('consent', 'update', {...})` once the user responds to the banner, and only initialize/call `adsbygoogle` after that update for regions where consent is required.
4. **Basic vs Advanced mode:** Basic mode blocks Google tags entirely until consent is granted (simpler, some revenue loss from non-consenting/undecided users). Advanced mode sends cookieless pings and lets Google model conversions for non-consenting users (more revenue, more implementation surface). Pick Basic first; move to Advanced once the simpler path is working.

```tsx
// Simplified shape — the real implementation comes from your chosen CMP's SDK
'use client';
import { useConsent } from '@/lib/consent'; // wraps your CMP of choice

export function AdSenseGate({ children }: { children: React.ReactNode }) {
  const { adPersonalizationAllowed, consentResolved } = useConsent();
  if (!consentResolved) return null; // don't render ad slots before the CMP has answered
  return <>{children}</>; // AdSenseUnit instances render inside here
}
```

Non-EEA/UK/Swiss traffic isn't legally bound by this today, but treating consent as global rather than geo-branching the whole ad stack is simpler to maintain and avoids the failure mode of misdetecting a user's region.

## 2. Zero-CLS Responsive Ad Component Pattern

To prevent Cumulative Layout Shift (CLS), ad containers must enforce explicit min-height reservations and proper disclosure labels.

> This isn't just a UX nicety anymore: Google now factors a site's Core Web Vitals into ad delivery quality — sites with poor CLS/LCP scores can receive fewer ad requests or lower-quality demand, which compounds the revenue impact of a layout-shift bug beyond the immediate user experience cost.

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

- [ ] **A Google-certified CMP with TCF v2.3 support is integrated**, and Google Consent Mode v2's four signals (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`) default to denied until the user responds — required for EEA/UK/Swiss traffic, recommended as the baseline everywhere.
- [ ] AdSense script/ad calls are gated behind resolved consent state, not fired unconditionally on every page load.
- [ ] **Accidental Click Prevention**: Ad units must have at least `24px` margin from interactive buttons (especially affiliate purchase links).
- [ ] **Mandatory Labeling**: Every ad container includes an accessible `"Publicidade"` or `"Anúncio"` indicator.
- [ ] **Ad Density Balance**: Ensure content outbalances advertising (never place consecutive ad units without editorial content in between).
- [ ] **CLS Guard**: All ad units specify explicit `min-height` inline or in CSS — treat this as a revenue metric, not just a UX one (see section 2).
- [ ] **ads.txt Verification**: Verify that `/ads.txt` responds with status `200` and `Content-Type: text/plain`.
- [ ] If `appsec-data-shield`'s `Permissions-Policy` header is in use, confirm the `browsing-topics=()` setting is an intentional choice, not an accidental block on a targeting signal this skill relies on.
