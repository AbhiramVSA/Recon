# Events Section Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge flagship competition cards and redesign the 9 Zones of Chaos from a grid into a zigzag slide-in layout with scroll-triggered horizontal animations.

**Architecture:** Two isolated changes in `Events.tsx`. Flagship cards get enlarged typography/padding via conditional classes. Zones of Chaos replaces the `Stagger` grid with individually-animated `motion.div` rows that alternate alignment (right/left) and slide in from their respective side on scroll. A `useMediaQuery` hook handles the mobile fallback (vertical slide-up instead of horizontal).

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion

**Spec:** `docs/superpowers/specs/2026-04-10-events-redesign-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/useMediaQuery.ts` | Create | Reusable media query hook for responsive animation direction |
| `src/components/Events.tsx` | Modify | Flagship card sizing, zigzag layout, section label fix |
| `src/components/CornerFrame.tsx` | Modify | Accept `size` prop for flagship padding variant |
| `src/components/ui.tsx` | No change | Existing `Tag` component — modify inline in Events.tsx via props only |

---

### Task 1: Create `useMediaQuery` hook

**Files:**
- Create: `src/hooks/useMediaQuery.ts`

This hook is needed so the zigzag animation can use `x` on desktop and `y` on mobile without duplicating card markup.

- [ ] **Step 1: Create the hook file**

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
    );

    useEffect(() => {
        const mql = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMediaQuery.ts
git commit -m "feat: add useMediaQuery hook for responsive animation direction"
```

---

### Task 2: Add `size` prop to `CornerFrame`

**Files:**
- Modify: `src/components/CornerFrame.tsx`

The flagship cards need larger padding (`p-8 md:p-10`) instead of the default `p-6`. Rather than overriding from the outside, add a `size` prop.

- [ ] **Step 1: Update CornerFrame to accept a `size` prop**

Replace the full content of `src/components/CornerFrame.tsx` with:

```tsx
import type { ReactNode } from 'react';

interface CornerFrameProps {
    children: ReactNode;
    className?: string;
    accent?: boolean;
    size?: 'default' | 'lg';
}

export default function CornerFrame({ children, className = '', accent = false, size = 'default' }: CornerFrameProps) {
    const color = accent ? 'border-paper/30' : 'border-edge';
    const cornerColor = accent ? 'bg-paper/50' : 'bg-soft';
    const padding = size === 'lg' ? 'p-8 md:p-10' : 'p-6';

    return (
        <div className={`relative group ${className}`}>
            {/* Border container */}
            <div className={`border ${color} bg-panel/60 backdrop-blur-sm ${padding} transition-colors duration-300 group-hover:border-paper/25`}>
                {children}
            </div>
            {/* Corner brackets */}
            {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos) => (
                <span
                    key={pos}
                    className={`absolute ${pos} w-2 h-2 ${cornerColor} transition-colors duration-300 group-hover:bg-paper/40`}
                    style={{
                        clipPath: pos.includes('right')
                            ? pos.includes('bottom') ? 'polygon(100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)'
                            : pos.includes('bottom') ? 'polygon(0 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 0 100%)',
                    }}
                    aria-hidden="true"
                />
            ))}
        </div>
    );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors (existing usages don't pass `size`, so they default to `'default'`)

- [ ] **Step 3: Commit**

```bash
git add src/components/CornerFrame.tsx
git commit -m "feat: add size prop to CornerFrame for flagship card enlargement"
```

---

### Task 3: Enlarge flagship event cards

**Files:**
- Modify: `src/components/Events.tsx:9-30` (EventCard), `src/components/Events.tsx:52` (grid gap)

Split `EventCard` into two rendering paths: flagship (enlarged) and default (unchanged). Update the grid gap.

- [ ] **Step 1: Update EventCard to accept and use a `flagship` boolean for sizing**

Replace lines 9-30 of `src/components/Events.tsx` (the `EventCard` function) with:

```tsx
function EventCard({ event, enlarged }: { event: SiteEvent; enlarged?: boolean }) {
    return (
        <motion.div variants={staggerChild} className={enlarged ? 'min-h-[280px] md:min-h-[320px]' : ''}>
            <CornerFrame accent={event.flagship} size={enlarged ? 'lg' : 'default'}>
                <div className="flex flex-wrap gap-2 mb-3">
                    {event.tags.map((t) => (
                        <Tag key={t} accent={event.flagship}>{t}</Tag>
                    ))}
                </div>
                <h3 className={`font-display text-paper tracking-tight ${enlarged ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                    {event.title}
                </h3>
                <p className={`font-body text-muted leading-relaxed ${enlarged ? 'mt-3 text-sm md:text-base' : 'mt-2 text-xs'}`}>
                    {event.description}
                </p>
                {event.meta.length > 0 && (
                    <div className={`flex flex-wrap gap-3 ${enlarged ? 'mt-4' : 'mt-3'}`}>
                        {event.meta.map((m) => (
                            <span key={m} className={`font-mono text-faint tracking-wider ${enlarged ? 'text-xs' : 'text-[10px]'}`}>
                                {m}
                            </span>
                        ))}
                    </div>
                )}
            </CornerFrame>
        </motion.div>
    );
}
```

- [ ] **Step 2: Update the flagship grid gap and pass `enlarged` prop**

Replace line 52-56 of `src/components/Events.tsx`:

```tsx
                    <Stagger className="grid md:grid-cols-2 gap-4 mb-16">
                        {flagshipEvents.map((e) => (
                            <EventCard key={e.title} event={e} />
                        ))}
                    </Stagger>
```

With:

```tsx
                    <Stagger className="grid md:grid-cols-2 gap-6 mb-16">
                        {flagshipEvents.map((e) => (
                            <EventCard key={e.title} event={e} enlarged />
                        ))}
                    </Stagger>
```

- [ ] **Step 3: Verify it compiles and visually check**

Run: `npx tsc --noEmit`
Expected: No errors

Run: `npm run dev`
Open `/events` in browser. Flagship cards should be noticeably taller with larger text, more padding, and more gap between them. Side events should look unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/Events.tsx
git commit -m "feat: enlarge flagship competition cards with bigger padding and typography"
```

---

### Task 4: Redesign Zones of Chaos as zigzag slide-in layout

**Files:**
- Modify: `src/components/Events.tsx:58-67` (side events section)

This is the main change. Replace the `Stagger` grid with individually-animated rows that alternate left/right alignment.

- [ ] **Step 1: Add the `useMediaQuery` import at the top of Events.tsx**

Add this import after the existing imports (after line 7):

```tsx
import { useMediaQuery } from '../hooks/useMediaQuery';
```

- [ ] **Step 2: Replace the side events section**

Replace lines 58-67 of `src/components/Events.tsx`:

```tsx
                    {/* Side events */}
                    <Label>Side Events</Label>
                    <h2 className="font-display text-xl md:text-2xl text-paper tracking-tight mb-8">
                        10 Zones of <span className="text-paper/80">Chaos</span>
                    </h2>
                    <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" delay={0.06}>
                        {sideEvents.map((e) => (
                            <EventCard key={e.title} event={e} />
                        ))}
                    </Stagger>
```

With:

```tsx
                    {/* Side events */}
                    <Label>Side Events</Label>
                    <h2 className="font-display text-xl md:text-2xl text-paper tracking-tight mb-8">
                        9 Zones of <span className="text-paper/80">Chaos</span>
                    </h2>
                    <ZonesOfChaos />
```

- [ ] **Step 3: Create the `ZonesOfChaos` component in the same file**

Add this component above the `Events` default export (before the `export default function Events()` line):

```tsx
const zigzagEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ZonesOfChaos() {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <div className="flex flex-col gap-6 md:gap-8 overflow-x-hidden">
            {sideEvents.map((event, index) => {
                const fromRight = index % 2 === 0;

                return (
                    <motion.div
                        key={event.title}
                        className={`flex ${fromRight ? 'justify-end' : 'justify-start'}`}
                        initial={{
                            opacity: 0,
                            ...(isDesktop
                                ? { x: fromRight ? 120 : -120 }
                                : { y: 24 }),
                        }}
                        whileInView={{
                            opacity: 1,
                            ...(isDesktop ? { x: 0 } : { y: 0 }),
                        }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{
                            duration: 0.55,
                            ease: zigzagEasing,
                            delay: index * 0.04,
                        }}
                    >
                        <div className="w-full md:w-[75%] lg:w-[70%]">
                            <CornerFrame>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {event.tags.map((t) => (
                                        <Tag key={t}>{t}</Tag>
                                    ))}
                                </div>
                                <h3 className="font-display text-lg text-paper tracking-tight">
                                    {event.title}
                                </h3>
                                <p className="mt-2 font-body text-xs text-muted leading-relaxed">
                                    {event.description}
                                </p>
                            </CornerFrame>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
```

- [ ] **Step 4: Clean up unused imports if needed**

After these changes, check if `Stagger` and `staggerChild` are still used. `Stagger` is still used by the flagship section. `staggerChild` is still used by `EventCard`. Both remain needed — no cleanup required.

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Visual verification in browser**

Run: `npm run dev`
Open `/events` in browser and verify:

1. **Section label** reads "9 Zones of Chaos" (not 10)
2. **Desktop (>= 768px):**
   - Each zone card is its own row
   - Cards alternate right-aligned (NFC Lock Hunt, AppSec Zone, Hacking Arena, Escape Room, Art Zone) and left-aligned (Hardware Badge, Media Forensics, Cyber Expo, Gaming Arena)
   - Cards are ~70-75% width, not full width
   - Scrolling down triggers each card sliding in from its side
   - No horizontal scrollbar appears
3. **Mobile (< 768px):**
   - Cards are full-width, stacked vertically
   - Cards slide up on scroll (no horizontal movement)

- [ ] **Step 7: Check `prefers-reduced-motion`**

In browser DevTools > Rendering > Emulate CSS media feature `prefers-reduced-motion: reduce`. Framer Motion respects this by default — cards should appear without animation.

- [ ] **Step 8: Commit**

```bash
git add src/components/Events.tsx
git commit -m "feat: redesign Zones of Chaos as zigzag slide-in layout with scroll-triggered animations"
```

---

### Task 5: Final cleanup and verification

- [ ] **Step 1: Run the production build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings

- [ ] **Step 2: Preview the production build**

Run: `npm run preview`
Open `/events` and verify both flagship and zones sections render correctly in the optimized build.

- [ ] **Step 3: Commit any remaining changes (if any)**

If the build revealed lint/type issues that needed fixing, commit those fixes.
