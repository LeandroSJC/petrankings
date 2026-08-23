---
name: frontend-a11y-auditor
description: >-
  Audits and enforces Web Content Accessibility Guidelines (WCAG 2.1 AA/AAA) in frontend applications.
  Use this skill when checking accessibility, adding ARIA attributes, fixing keyboard navigation,
  improving screen reader support, or auditing color contrast and semantic HTML.
---

# Accessibility (A11y) & WCAG Auditor

This skill guides the auditing, refactoring, and verification of web applications to ensure full accessibility for all users, conforming to **WCAG 2.1 AA** standards.

## 1. Core Accessibility Pillars

### A. Semantic HTML
- Use proper semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- Maintain a logical heading structure: Exactly one `<h1>` per page, followed by sequential `<h2>`, `<h3>` without skipping levels.
- Use native HTML elements (`<button>`, `<a>`, `<input>`) before resorting to custom `<div>` / `<span>` elements with click handlers.

### B. Keyboard Navigation & Focus Management
- Ensure all interactive elements are reachable via `Tab` and activatable via `Enter` / `Space`.
- Never disable focus outlines without providing a custom visible `:focus-visible` indicator.
- Implement focus trapping and `Escape` key listeners for Modals, Drawers, and Dialogs. Return focus to the trigger element when the modal closes.

### C. ARIA & Screen Readers
- Provide descriptive `aria-label` or `aria-labelledby` for icon-only buttons (e.g. close buttons, search icons).
- Use `aria-expanded="true|false"` for accordions, dropdowns, and collapsible sidebars.
- Use `aria-live="polite"` or `aria-live="assertive"` for dynamic toast notifications and live status updates.
- Use `alt` text for all meaningful images (`alt=""` for purely decorative images).

### D. Color Contrast
- Normal text: Minimum contrast ratio of **4.5:1** against the background.
- Large text (18pt+ or 14pt bold): Minimum contrast ratio of **3:1**.
- Interactive UI components & icons: Minimum contrast ratio of **3:1**.
- Do not rely solely on color to convey information (combine color with icons or text labels).

## 2. Accessibility Audit Procedure

1. **DOM Inspection**:
   - Check all interactive elements for keyboard tabability (`tabindex="0"` if custom, never `tabindex > 0`).
   - Check form fields for associated `<label htmlFor="...">` tags.
2. **Interactive Elements Check**:
   - Verify modal dialogs have `role="dialog"` and `aria-modal="true"`.
   - Verify dropdown menus have `role="menu"` or `role="listbox"`.
3. **Contrast & Text Resizing**:
   - Test layout with 200% zoom to ensure text does not overflow or clip.

## 3. Compliance Checklist

- [ ] All buttons and links have accessible names (`text` or `aria-label`).
- [ ] Keyboard focus indicator is clearly visible on all interactive elements.
- [ ] Forms have explicit labels and accessible validation error messages (`aria-invalid`, `aria-describedby`).
- [ ] Color contrast meets WCAG AA standards in both light and dark modes.
- [ ] Modals and drawers trap focus and dismiss with `Escape`.
