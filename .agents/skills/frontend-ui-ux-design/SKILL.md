---
name: frontend-ui-ux-design
description: >-
  Expert guidance for building modern, responsive, accessible, and visually stunning UI/UX components.
  Use this skill whenever designing or modifying UI components, styling layouts (CSS/design tokens),
  implementing micro-animations, loading skeletons, responsive navigation, or mobile-first design systems.
---

# UI/UX & Design System Specialist

This skill guides the design, implementation, and refinement of modern web interfaces with a focus on premium aesthetics, component reusability, responsive design, and smooth user interactions.

## 1. Core Visual Principles

- **Harmonious Color Palette**: Use cohesive design tokens (CSS variables for primary, secondary, surface, border, and accent colors). Never use hardcoded raw colors in components.
- **Modern Typography**: Establish a clear type scale (`display`, `h1`, `h2`, `h3`, `body`, `caption`) with proper line heights and letter spacing.
- **Layering & Depth**: Use subtle borders, layered box-shadows, and glassmorphism (backdrop-filter) to convey hierarchy.
- **Micro-Interactions**: Add subtle hover, active, and focus transitions (e.g. `transition: all 0.2s ease-in-out`, scale feedback on buttons).

## 2. Component Architecture & State Handling

When building or updating UI components:
1. **State Completeness**:
   - **Default State**: Clean, readable, balanced spacing.
   - **Hover / Active State**: Clear visual affordance (slight elevation, color shift).
   - **Loading State**: Shimmer skeletons for data loading; spinner/disabled state for action buttons.
   - **Empty State**: Engaging icon, concise explanatory copy, and a clear call-to-action (CTA).
   - **Error State**: Non-blocking inline error badges with retry action when appropriate.
2. **Reusability & Props Design**:
   - Keep components focused on a single responsibility.
   - Support variants (e.g., `variant="primary" | "secondary" | "outline"`).
   - Expose semantic standard attributes (`className`, `disabled`, `aria-label`).

## 3. Responsive & Mobile-First Layouts

1. **Fluid Grid & Flexbox**: Use modern CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`) and Flexbox for adaptable layouts.
2. **Breakpoints**:
   - Mobile: `< 640px` (single column, full-width actions, touch-friendly min-target 44x44px).
   - Tablet: `640px - 1024px` (2 columns, collapsible menus).
   - Desktop: `> 1024px` (multi-column, persistent navigation).
3. **Touch & Ergonomics**: Ensure all interactive elements have sufficient padding and touch target sizes.

## 4. Title & Heading Design Tokens (Invariante 13 Standard)

### A. The 3-Layer Hero Kit Pattern (`<h1>`)
All major pages (Home, Catalog, Category, Guides) must employ the 3-layer Hero structure:
```tsx
{/* 1. Eyebrow / Kicker Badge */}
<div style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 10px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--brand-forest-50)',
  border: '1px solid var(--brand-forest-200)',
  color: 'var(--brand-forest-700)',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: '8px'
}}>
  <Icon size={13} aria-hidden="true" />
  <span>ETIQUETA DE CONTEXTO</span>
</div>

{/* 2. Heading H1 */}
<h1 style={{
  fontFamily: 'var(--font-heading)',
  fontSize: 'clamp(1.45rem, 2.8vw, 1.85rem)',
  fontWeight: 800,
  color: 'var(--brand-forest-900)',
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
  marginBottom: '6px'
}}>
  Título Principal em Sentence Case
</h1>

{/* 3. Lead Paragraph */}
<p style={{ fontSize: '0.90rem', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
  Texto explicativo de apoio de 1 a 2 linhas.
</p>
```

### B. Section Headings (`<h2>`)
- Never apply `text-transform: uppercase` to `<h2>` or `<h3>`.
- Always format section titles in **Sentence Case** with `font-weight: 800` and `var(--brand-forest-900)`.

## 5. Verification Checklist

Before considering a UI task complete:
- [ ] Responsive test across mobile (375px), tablet (768px), and desktop (1280px).
- [ ] Dark/Light mode contrast consistency.
- [ ] Headings adhere to Invariante 13 (Hero Kit 3-layer pattern, Sentence Case on `<h2>`, no ALL CAPS).
- [ ] Loading and empty states handled gracefully without layout shifts (CLS).
- [ ] Interactive states (hover, focus-visible, active, disabled) visually evident.

