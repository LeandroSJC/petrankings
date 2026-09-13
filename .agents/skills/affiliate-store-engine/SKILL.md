---
name: affiliate-store-engine
description: >-
  Manages e-commerce store configurations, affiliate link normalization, partner tracking parameters,
  and link integrity verification across Brazilian retail partners.
  Use this skill when adding or updating partner stores and large retailers,
  configuring affiliate tracking tags, or auditing outbound buy links.
---

# Affiliate & Partner Store Engine

This skill guides the integration, normalization, and management of e-commerce partner stores and monetization links within the PetRankings platform.

## 1. Flexible Retailer & Partner Store Registry

The platform supports flexible store registration across large Brazilian retailers and pet specialty stores, allowing any store name with optional suggested autocompletion based on stores previously registered in the database. Outbound links are standardized with `rel="nofollow noopener sponsored"` and direct product URLs.

## 2. Link Structure & Fallback Logic

When rendering store buttons (`StoreButton.tsx`):
1. **Target URL Hierarchy**:
   - If `affiliateUrl` is present and valid (starts with `https://`), use `affiliateUrl`.
   - If `affiliateUrl` is empty, fallback directly to `productUrl`.
2. **Outbound Link Security & SEO**:
   - Always render outbound purchase links with `rel="noopener noreferrer"` and `target="_blank"`.
   - For affiliate links, apply `rel="sponsored noopener noreferrer"` when applicable to adhere to Google search guidelines.

## 3. Store Review & Rating Protocol

- **Manual Audit**: Store ratings (from `0.0` to `5.0`) and review counts (`reviewCount`) must reflect real numbers from the store page.
- **Aggregation Engine**:
  - Individual store ratings contribute equally to the arithmetic average of the product.
  - Review counts are summed across all linked stores to calculate the total review volume used for ranking tie-breaking.

## 4. Verification Checklist for Store Links

- [ ] URL is valid and opens over HTTPS.
- [ ] Affiliate tag or campaign parameter is active and correctly formatted.
- [ ] Outbound links open in a new tab without security vulnerabilities (`target="_blank"` with `rel="noopener noreferrer"`).
- [ ] Store logo displays correctly with high-contrast badge text.
