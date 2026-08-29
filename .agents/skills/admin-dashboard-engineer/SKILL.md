---
name: admin-dashboard-engineer
description: >-
  Specialized engineering for the PetRankings administrative backoffice (/admin), including
  product catalog workflows, ranking management, store rating calculation interfaces,
  bulk operations (CSV/JSON import/export), contact inbox triage, and responsive data tables.
  Use this skill when modifying admin views, building backoffice tools, optimizing CRUD workflows,
  or streamlining editorial catalog productivity.
---

# Admin Dashboard & Backoffice Engineer

This skill provides architecture guidelines, UI patterns, and productivity tools for the PetRankings backoffice (`/admin`), enabling seamless editorial management of rankings, products, store reviews, and contact messages.

## 1. Backoffice Information Architecture (`/admin`)

- **`/admin` (Overview Dashboard)**:
  - Key metrics cards: total published rankings, active products, store link health, unread contact messages.
  - Quick action shortcuts: "Novo Ranking", "Novo Produto", "Conferir Mensagens".
- **`/admin/rankings` (Rankings Manager)**:
  - List with species pills, product counts, publication toggles (`isPublished`), and last data update dates.
  - Navigation links to dedicated edit pages (`/admin/rankings/[id]/editar`).
- **`/admin/produtos` (Product Catalog)**:
  - Multi-store rating editor with automatic client-side arithmetic average calculation.
  - Brand autocompletion, image preview, and linked rankings indicators.
  - Safe deletion checks (warn if product is referenced in published rankings).
  - Navigation links to dedicated edit pages (`/admin/produtos/[id]/editar`).
- **`/admin/mensagens` (Contact Inbox)**:
  - Status management (`nova`, `lida`, `arquivada`), spam cleanup, and message search.

## 2. Dedicated Form Pages — NOT Modals

> **CRITICAL PATTERN:** The admin uses dedicated route-based pages for all creation and editing flows. Do NOT implement modal/popup overlays for these operations. Modals close accidentally and cause data loss.

### Route Structure:
| Action | Route |
|---|---|
| New Product | `/admin/produtos/novo` |
| Edit Product | `/admin/produtos/[id]/editar` |
| New Ranking | `/admin/rankings/novo` |
| Edit Ranking | `/admin/rankings/[id]/editar` |

### Form Components:
- **`src/components/admin/ProductForm.tsx`**: Full product form with real-time average calculation and unsaved-changes protection.
- **`src/components/admin/RankingForm.tsx`**: Full ranking form with slug preview and product linking.

### Unsaved-Changes Guard Pattern:
```tsx
const [isDirty, setIsDirty] = useState(false);

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

## 3. Real-Time Rating Calculation Protocol

When creating or editing products in the admin panel:
1. Allow dynamic addition/removal of store rows (`amazon`, `mercadolivre`, `petlove`, `cobasi`, `shopee`).
2. Validate store URLs (ensure protocol starts with `https://`).
3. Compute the arithmetic average in real time on the client:
   $$\text{average} = \frac{\sum \text{valid ratings}}{\text{count of stores with valid ratings}}$$
4. Upon save, propagate `dataUpdatedAt: new Date()` to all rankings associated with the modified product.

## 4. Bulk Operations & Productivity Patterns

- **CSV / JSON Export**: Enable editors to export ranking lists and product spreadsheets for external review.
- **Batch Status Updates**: Support bulk publish/unpublish of draft rankings.
- **Instant Search & Debounced Filters**: Implement responsive filtering by title, brand, species, or store key.

## 5. Admin Quality Checklist

- [ ] All mutations require verified admin JWT credentials.
- [ ] Forms provide clear feedback toasts and validation error indicators.
- [ ] Tables support sorting by title, rating, and last updated timestamp.
- [ ] Responsive layout allows management on tablets and mobile devices.
- [ ] All CRUD routes use dedicated pages (not modals) to prevent data loss.
- [ ] Unsaved-changes guard (`beforeunload`) is active on all form pages.
