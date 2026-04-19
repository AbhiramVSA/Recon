# Events Section Redesign — Design Spec

## Overview

Two changes to the Events page (`/events`):

1. **Flagship Competitions** — Make CTF and King of the Hill cards taller and larger
2. **9 Zones of Chaos** — Fundamentally redesign from a grid to a zigzag slide-in layout where each card is its own row, alternating between right-aligned and left-aligned, sliding in from its respective side on scroll

## Files to Modify

- `src/components/Events.tsx` — Main layout changes, new animation variants, card sizing
- `src/data.ts` — No structural changes needed (data shape stays the same)
- `src/components/CornerFrame.tsx` — Possibly accept a `size` variant prop for flagship enlargement
- `src/components/ui.tsx` — No changes expected (existing Stagger/Section/Tag/Label reused)

## Change 1: Flagship Competitions — Larger Cards

### Current State
- 2-column grid (`md:grid-cols-2 gap-4`)
- Cards have `p-6` padding
- Title: `text-lg`, Description: `text-xs`, Meta: `text-[10px]`, Tags: `text-[9px]`

### Target State
- Grid stays `md:grid-cols-2` but gap increases to `gap-6`
- Bottom margin stays `mb-16`

**Card sizing changes (flagship only):**

| Property | Current | New |
|----------|---------|-----|
| Padding | `p-6` | `p-8 md:p-10` |
| Min height | none | `min-h-[280px] md:min-h-[320px]` |
| Title | `text-lg` | `text-xl md:text-2xl` |
| Description | `text-xs` | `text-sm md:text-base`, `mt-3` instead of `mt-2` |
| Meta | `text-[10px]`, `mt-3` | `text-xs`, `mt-4` |
| Tags | `text-[9px] px-2 py-0.5` | `text-[10px] px-2.5 py-1` |

### Implementation Approach
Pass a `flagship` boolean (or `size="lg"`) prop into the `EventCard` component. Apply enlarged classes conditionally. This keeps the card component reusable without creating a separate component.

## Change 2: 9 Zones of Chaos — Zigzag Slide-In

### Current State
- Grid: `sm:grid-cols-2 lg:grid-cols-3 gap-4`
- All cards stagger-animate upward identically using the `Stagger` wrapper
- Section label: "10 Zones of Chaos"

### Target State

**Section label:** Changed to "9 Zones of Chaos"

**Layout:**
- Replace grid with a vertical flex column (`flex flex-col gap-6 md:gap-8`)
- Each card is wrapped in a row container that alternates alignment:
  - Even indices (0, 2, 4, 6, 8): `justify-end` (card sits right)
  - Odd indices (1, 3, 5, 7): `justify-start` (card sits left)
- Card width: `w-full md:w-[75%] lg:w-[70%]`
- Parent section: `overflow-x: hidden` to prevent horizontal scrollbar during animations

**Animation (desktop, >= md):**
- Each card uses `framer-motion` `whileInView` (not the `Stagger` wrapper — individual control needed)
- Viewport trigger: `{ once: true, margin: '-60px' }`
- Even-index cards (right-aligned): `initial={{ opacity: 0, x: 120 }}` -> `whileInView={{ opacity: 1, x: 0 }}`
- Odd-index cards (left-aligned): `initial={{ opacity: 0, x: -120 }}` -> `whileInView={{ opacity: 1, x: 0 }}`
- Transition: `{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }`
- The small per-index delay ensures that if multiple cards are in the viewport simultaneously (e.g. on page load), they cascade rather than all firing at once

**Animation (mobile, < md):**
- All cards are full-width (`w-full`)
- Slide up instead of sideways: `initial={{ opacity: 0, y: 24 }}` -> `whileInView={{ opacity: 1, y: 0 }}`
- No zigzag pattern on mobile — it doesn't read well on narrow screens

**Card internals:**
- Same `CornerFrame` wrapper as today
- Same padding (`p-6`), same typography sizing as current side events
- No changes to tag/title/description/meta styling

**Responsive breakpoints:**
- `< md (768px)`: Full-width cards, vertical slide-up animation, stacked
- `>= md`: 75% width cards, horizontal slide-in, zigzag alignment
- `>= lg (1024px)`: 70% width cards, same zigzag behavior

### Implementation Approach
Replace the `<Stagger>` grid wrapper in the side events section with a `<div className="flex flex-col ...">`. Map over `sideEvents` with index, rendering each card inside a `<motion.div>` that handles its own viewport-triggered animation. The direction of the slide (x vs y, positive vs negative) is determined by index parity and a `useMediaQuery` check (or Tailwind's responsive approach via CSS).

For the responsive animation direction (slide-x on desktop, slide-y on mobile), use a simple `useMediaQuery('(min-width: 768px)')` hook or check `window.matchMedia` inside a `useMemo`. This avoids duplicating the card markup.

## What Does NOT Change

- `CornerFrame` corner bracket visuals and hover effects
- Color palette, typography families
- Section/page-level fade-in animation
- Flagship event data structure
- Side event data structure
- Page max-width (`max-w-5xl`)
- Navbar, footer, other page elements
- Other pages/routes

## Accessibility

- `overflow-x: hidden` is scoped to the zones section container, not the page body
- Cards remain in DOM order (no visual reorder that breaks tab navigation)
- `prefers-reduced-motion`: Animations should respect the media query — if reduced motion is preferred, cards render in their final position immediately without slide-in
