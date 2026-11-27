---
name: affiliate-store-engine
description: >-
  Manages e-commerce partner store links (AffiliateLink), affiliate URL normalization, outbound
  link security/SEO attributes, CDC e-commerce compliance, and automated link health checks across
  Brazilian retailers. Use this skill when adding/updating partner links, checking broken URLs,
  or modifying outbound buy buttons.
---

# Affiliate Store Engine & Link Health Watchdog

This skill governs partner store link registration (`AffiliateLink`), outbound buy button rendering, regulatory compliance, and automated link health verification across **PetRankings**.

## 1. Data Model & Fallback Hierarchy

Each `AffiliateLink` record linked to a `Product` stores:

- `store`: Retail partner name (free text with autocomplete from existing stores, unique per product).
- `productUrl`: Canonical HTTPS product page on the retailer's site.
- `affiliateUrl`: Optional monetized tracking URL.

**Target URL Resolution:**

1. If `affiliateUrl` is present and starts with `https://`, render `affiliateUrl`.
2. Otherwise, fallback seamlessly to `productUrl`.
3. Never invent or guess store ratings — product scores come exclusively from the deterministic Motor V5 (`Product.scoreTotal`).

## 2. Outbound Link Security, SEO & Regulatory Compliance

- **HTML Attributes:** Always render outbound purchase links with `target="_blank"` and `rel="sponsored noopener noreferrer"` (or `rel="noopener noreferrer"` when non-monetized).
- **Decreto nº 7.962/2013 & CDC (Arts. 30–31):** Partner links must point strictly to the exact corresponding product (same brand, line, species, and formulation). Generic category redirects or bait-and-switch links are prohibited.
- **Editorial Independence:** Maintain the institutional disclosure that affiliate commissions never influence nutritional scores.

## 3. Automated Link Health Verification

Run the link health verification script periodically and before major releases:

```bash
npx tsx .agents/skills/affiliate-store-engine/scripts/check-links.ts
```

**Health Criteria:**

- Strict `https://` protocol.
- HTTP `200 OK` (or valid `301/302/307/308` resolving to `200`; note some retailers return `403` to `HEAD` requests while still live).
- Timeout of 8s with `AbortController` and custom `User-Agent: PetRankings-Bot/1.0 (+https://petrankings.com.br)`.
- If `affiliateUrl` breaks, fallback to `productUrl`; if both return confirmed `404`, remove or replace the link in `/admin/produtos/[id]/editar`.

## 4. Verification Checklist

- [ ] All URLs start with `https://` and match the exact product formulation.
- [ ] `affiliateUrl` falls back cleanly to `productUrl` when empty or invalid.
- [ ] Outbound links include `target="_blank"` and `rel="sponsored noopener noreferrer"`.
- [ ] `check-links.ts` executed cleanly with no permanent `404` links left active.
