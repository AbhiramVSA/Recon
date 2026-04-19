import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export function usePortalReveal() {
    const rootRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!rootRef.current) return;
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.matchMedia('(max-width: 1023px)').matches;
        if (prefersReduced) return;

        const root = rootRef.current;
        const revealTargets = () => {
            const header = root.querySelector('[data-portal-header]');
            const cards = root.querySelectorAll('[data-portal-card]');
            return {
                header,
                cards,
            };
        };

        const forceVisible = () => {
            const { header, cards } = revealTargets();
            gsap.set(root, { opacity: 1, y: 0 });
            if (header) gsap.set(header, { opacity: 1, y: 0 });
            if (cards.length > 0) gsap.set(cards, { opacity: 1, y: 0 });
        };

        const ctx = gsap.context(() => {
            try {
                if (!isMobile) {
                    gsap.fromTo(
                        root,
                        { y: 8 },
                        {
                            y: 0,
                            duration: 0.25,
                            ease: 'power2.out',
                        },
                    );
                }

                const { header, cards } = revealTargets();

                if (header) {
                    gsap.fromTo(
                        header,
                        { y: 16, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.5,
                            ease: 'power3.out',
                        },
                    );
                }

                if (cards.length > 0) {
                    gsap.fromTo(
                        cards,
                        { y: 20, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.5,
                            ease: 'power3.out',
                            stagger: 0.06,
                            delay: 0.08,
                        },
                    );
                }
            } catch {
                forceVisible();
            }
        }, rootRef);

        return () => ctx.revert();
    }, []);

    return rootRef;
}
