---
name: design-taste-frontend
description: >-
  Anti-slop frontend design heuristics, visual density balancing, and layout discipline for landing pages,
  hero sections, and category displays. Use this skill when auditing visual appeal, preventing templated
  or generic AI UI patterns, refining typography, or crafting distinctive, non-generic frontend aesthetics.
---

# Anti-Slop Frontend Design Specialist

This skill enforces intentional, high-taste frontend design across PetRankings, actively preventing generic AI-generated aesthetics (purple gradients on dark mesh, identical 3-column cards, generic glassmorphism) and anchoring decisions in cohesive design systems.

> 📖 **Full Reference Manual:** For exhaustive visual formulas, type pairings, kinetic motion configs, and brutalist/minimalist case studies, consult the [Taste Reference Guide](./references/taste-guide.md).

---

## 1. Project-Specific Stack Rules for PetRankings

- **NO Tailwind CSS**: The PetRankings project strictly standardizes on **native Vanilla CSS and CSS Variables (Design Tokens)**. Do not output Tailwind classes (`bg-slate-900`, `flex-col`, etc.).
- **CSS Variable Tokens**: Use the design tokens defined in the global stylesheet (`var(--color-primary)`, `var(--bg-surface)`, `var(--radius-md)`, `var(--shadow-card)`).
- **Data Density Matters**: While consumer landing pages prioritize airy breathing room, PetRankings comparison tables and ranking catalogs require high scannability (`VISUAL_DENSITY: 5-7`).

---

## 2. Design Read: Read the Room First

Before proposing or generating frontend components, declare a one-line **Design Read**:

> *"Reading this as: [consumer comparison / editorial ranking] for [pet tutors seeking trustworthy reviews], with a [clean, warm, transparent, high-credibility] language, leaning toward [warm editorial typography + modern card elevated surface]."*

### Anti-Default Discipline (What to NEVER do)
- ❌ Do NOT use generic AI-purple gradients (`#8B5CF6` to `#EC4899`).
- ❌ Do NOT place 3 identical cards with identical icons side-by-side.
- ❌ Do NOT wrap every single element in generic glassmorphism or excessive blurs.
- ❌ Do NOT rely on Inter / Roboto browser fallbacks without distinct typographic hierarchy.

---

## 3. Core Design Dials for PetRankings

Scale from 1 to 10:
* **`DESIGN_VARIANCE: 6`** — Cohesive layout balance with deliberate asymmetry on key focal points (e.g. #1 ranked product badge).
* **`MOTION_INTENSITY: 4`** — Restrained micro-interactions (smooth hover elevation, chevron rotations on accordions, skeleton shimmers). No distracting continuous animations.
* **`VISUAL_DENSITY: 6`** — Balanced information architecture that allows comparison of ratings, store badges, and pros/cons at a glance.

---

## 4. Typography & Color Palette Discipline

1. **Typographic Hierarchy**:
   - Establish crisp contrast between Display/Headers (editorial, trustworthy, high character) and Body/Data (high legibility, tabular numbers for ratings and review counts).
   - Use `font-variant-numeric: tabular-nums` on all review counters and numerical ratings.
2. **Warmth & Trust**:
   - Use warm off-whites and dark slate/charcoal tones rather than pure `#000000` or `#FFFFFF`.
   - Brand accents should convey care, pet well-being, and market transparency (emerald/forest greens, warm ambers, friendly corals).

---

## 5. Heading Hierarchy & Title Standards (Invariante 13 Anti-Slop Discipline)

- **NEVER use ALL CAPS on `<h2>` or `<h3>`**:
  - Full uppercase titles in section headings look loud, dated, and unrefined.
  - Sentence Case is mandatory for all section headings (`font-weight: 800`, `var(--brand-forest-900)`, line-height 1.25).
  - Uppercase is restricted strictly to compact **Kicker / Eyebrow badges** (up to 3 words, `0.72rem`, `letter-spacing: 0.05em`, themed Lucide icon).
- **Hero Kit Pattern (`<h1>`)**:
  - Every page hero must be implemented in three cohesive layers:
    1. *Eyebrow*: Uppercase pill badge with thematic Lucide icon.
    2. *H1 Title*: `var(--font-heading)`, weight 800, `var(--brand-forest-900)`, Sentence Case (or full commercial name on product pages).
    3. *Lead*: 1-2 lines of technical/contextual text in `0.92rem - 1.0rem`.
- **Numbered Forensic Dossier Sequence (`/produto/[slug]`)**:
  - Product technical sheet sections must follow the numbered forensic structure:
    1. `1. Custódia documental e evidência oficial` (Globe)
    2. `2. Extrato da avaliação nutricional (0 a 100)` (PawPrint)
    3. `3. Níveis de garantia: Matéria Natural (MN) vs. Matéria Seca (MS)` (FileText)
    4. `4. Composição básica e ingredientes declarados` (FlaskConical)
    5. `5. Onde encontrar este produto` (Store)

---

## 6. Pre-Flight Verification Checklist

Before finalizing any frontend interface:
- [ ] Interface does not look like a generic Bootstrap/Tailwind template.
- [ ] Design tokens (CSS variables) used consistently with zero hardcoded ad-hoc hex colors.
- [ ] Section headings use Sentence Case (no ALL CAPS on `<h2>` or `<h3>`).
- [ ] Hero sections adopt the 3-layer Hero Kit pattern (Eyebrow + H1 + Lead).
- [ ] First-place ranked product has clear visual hierarchy over lower-ranked items.
- [ ] Badges, store buttons, and review scores remain legible on mobile viewports (< 640px).
- [ ] No layout shifts (CLS) on dynamic image or rating rendering.

