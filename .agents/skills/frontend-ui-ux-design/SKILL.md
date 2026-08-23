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

## 4. Verification Checklist

Before considering a UI task complete:
- [ ] Responsive test across mobile (375px), tablet (768px), and desktop (1280px).
- [ ] Dark/Light mode contrast consistency.
- [ ] Loading and empty states handled gracefully without layout shifts (CLS).
- [ ] Interactive states (hover, focus-visible, active, disabled) visually evident.
