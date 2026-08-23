---
name: link-health-watchdog
description: >-
  Audits and monitors the health of external store links, affiliate URLs, and product availability
  across Brazilian e-commerce partners (Amazon, Mercado Livre, Petlove, Cobasi, Shopee).
  Detects broken links (404/500), missing tracking tags, redirect loops, and out-of-stock anomalies.
  Use this skill when implementing automated URL verification scripts, running health checks,
  auditing affiliate parameters, or building link monitoring tools.
---

# Link Health & Store URL Watchdog

This skill guides automated verification, URL integrity auditing, affiliate parameter validation, and partner status monitoring for outbound store links in the PetRankings platform.

## 1. Outbound URL Health Protocol

Every linked product store (`ProductStore`) has two potential URLs:
- `productUrl`: The canonical product page on the store's website.
- `affiliateUrl`: The monetized tracking link with affiliate campaign parameters.

### Health Criteria:
- **HTTP Status**: Response must return `200 OK` (or valid client redirect `301/302/307/308` resolving to `200`).
- **SSL / HTTPS**: Protocol must be strictly secure (`https://`).
- **Affiliate Tag Presence**: Verify that mandatory partner parameters exist:
  - `amazon`: `tag=...`
  - `shopee`: `shp.ee` or `universal-link` / affiliate sub-ids.
  - `petlove` / `cobasi` / `mercadolivre`: Lomadee/Awin affiliate campaign parameters or clean product URLs.

## 2. Automated Link Audit Script Pattern

To check store links asynchronously without blocking web requests:

```typescript
// Example: HEAD/GET verification with timeout and custom user-agent
export async function checkStoreUrl(url: string): Promise<{ status: number; ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'PetRankings-Bot/1.0 (+https://petrankings.com.br)',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    return {
      status: res.status,
      ok: res.ok || res.status === 403, // Some stores return 403 to HEAD requests, still considered live
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      latencyMs: Date.now() - start,
    };
  }
}
```

## 3. Fallback & Graceful Degradation Strategy

When an affiliate URL fails verification:
1. Log the anomaly for administrative review in `/admin`.
2. Fallback seamlessly to the `productUrl` so user experience is uninterrupted.
3. If both URLs fail with confirmed 404, flag the store link as inactive in the backoffice.

## 4. Link Audit Checklist

- [ ] Outbound links are strictly HTTPS.
- [ ] Fallback to `productUrl` is configured when `affiliateUrl` is absent or malformed.
- [ ] All `<a>` tags targeting external stores include `target="_blank"` and `rel="noopener noreferrer"`.
- [ ] Periodic health check script can report status code distribution across all active products.
