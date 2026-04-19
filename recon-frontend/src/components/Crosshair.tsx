import { useEffect, useRef } from 'react';

export default function Crosshair() {
    const vLineRef = useRef<HTMLDivElement>(null);
    const hLineRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const coordRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const x = e.clientX;
            const y = e.clientY;
            if (vLineRef.current)
                vLineRef.current.style.transform = `translateX(${x}px)`;
            if (hLineRef.current)
                hLineRef.current.style.transform = `translateY(${y}px)`;
            if (dotRef.current)
                dotRef.current.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
            if (coordRef.current) {
                coordRef.current.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
                coordRef.current.textContent = `${String(x).padStart(4, '0')}.${String(y).padStart(4, '0')}`;
            }
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <div className="fixed inset-0 z-9999 pointer-events-none hidden [@media(pointer:fine)]:block" aria-hidden="true">
            {/* Vertical line */}
            <div
                ref={vLineRef}
                className="absolute top-0 bottom-0 left-0 w-px bg-cream/[0.07]"
                style={{ willChange: 'transform' }}
            />
            {/* Horizontal line */}
            <div
                ref={hLineRef}
                className="absolute left-0 right-0 top-0 h-px bg-cream/[0.07]"
                style={{ willChange: 'transform' }}
            />
            {/* Center dot */}
            <div
                ref={dotRef}
                className="absolute top-0 left-0 w-1 h-1 rounded-full bg-cream/40"
                style={{ willChange: 'transform' }}
            />
            {/* Coordinates readout */}
            <div
                ref={coordRef}
                className="absolute top-0 left-0 font-mono text-[9px] tracking-[0.2em] text-faint/60 uppercase"
                style={{ willChange: 'transform' }}
            />
        </div>
    );
}

