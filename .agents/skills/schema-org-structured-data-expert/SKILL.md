---
name: schema-org-structured-data-expert
description: >-
  Architects and implements schema.org JSON-LD structured data, Rich Snippets, Google Discover
  optimization, and search engine SERP enhancements across PetRankings. Specializes in ItemList,
  Product, AggregateRating, FAQPage, BreadcrumbList, and Organization schemas. Use this skill when
  implementing or auditing JSON-LD markup, configuring structured data for ranking lists, fixing Google
  Search Console schema warnings, or enhancing organic search CTR.
---

# Schema.org Structured Data & Rich Snippets Expert

This skill guides the design, generation, and validation of Schema.org JSON-LD structured data across the PetRankings platform, maximizing organic visibility and triggering Google Rich Results (stars, review counts, paged ranking carousels, FAQ accordions, and breadcrumbs).

## 1. Structured Data Blueprint by Page Type

### A. Ranking Pages (`/ranking/[slug]`)
Ranking pages represent editorial curated lists. The primary schema must be an **`ItemList`** where each element is a **`Product`** with position metadata and aggregated reviews:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Melhores Rações Secas para Cães Adultos",
  "description": "Comparativo carinhoso e transparente das rações secas mais recomendadas para cães adultos...",
  "numberOfItems": 10,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "name": "Ração PremieR Formula Cães Adultos Frango",
        "image": "https://petrankings.com.br/images/products/premier.jpg",
        "description": "Alimento super premium completo e balanceado...",
        "brand": {
          "@type": "Brand",
          "name": "PremieR Pet"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.85",
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": "1420"
        }
      }
    }
  ]
}
```

### B. Breadcrumb Schema (`BreadcrumbList`)
Present on all internal ranking and institutional pages to structure search results URL hierarchy:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://petrankings.com.br"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Cães",
      "item": "https://petrankings.com.br/?species=caes"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Melhores Rações Secas para Cães Adultos",
      "item": "https://petrankings.com.br/ranking/melhores-racoes-secas-para-caes-adultos"
    }
  ]
}
```

### C. Home Page FAQ Accordion (`FAQPage`)
Mirrors the interactive FAQ accordion on the home page so Google can render expandable Q&A directly in SERP:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Como o PetRankings calcula as notas de cada produto?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nossa equipe pesquisa com carinho as avaliações reais deixadas por compradores nas 5 maiores lojas online do Brasil..."
      }
    }
  ]
}
```

### D. Global Organization & Website (`Organization` & `WebSite`)
Included on the root layout to establish brand authority and internal search actions:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PetRankings",
  "url": "https://petrankings.com.br",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://petrankings.com.br/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

## 2. Next.js Implementation Standard

Inject schemas safely within React components via `<script type="application/ld+json">`:

```tsx
export default function RankingSchema({ ranking, products }: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: ranking.title,
    description: ranking.description,
    numberOfItems: products.length,
    itemListElement: products.map((prod, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: prod.title,
        ...(prod.brand ? { brand: { '@type': 'Brand', name: prod.brand } } : {}),
        ...(prod.imageUrl ? { image: prod.imageUrl } : {}),
        ...(prod.averageRating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: prod.averageRating.toFixed(2),
                bestRating: '5',
                worstRating: '1',
                ratingCount: prod.stores.reduce((acc, s) => acc + (s.reviewCount || 1), 0),
              },
            }
          : {}),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

## 3. Schema Quality Checklist

- [ ] All numeric ratings are formatted as strings with 2 decimal places (e.g. `"4.85"`).
- [ ] `bestRating` is explicitly set to `"5"` and `worstRating` to `"1"`.
- [ ] Empty/null fields are omitted from JSON-LD to prevent Google Rich Results test warnings.
- [ ] Breadcrumb hierarchy strictly mirrors the URL routing structure.
- [ ] Ranking `ItemList` items contain valid `ListItem` sequential positions starting at 1.
