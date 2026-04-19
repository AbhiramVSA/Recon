import { useGlyphAnimator } from '../hooks';

interface GlyphGridProps {
    type?: 'braille' | 'hex' | 'circles' | 'blocks' | 'matrix';
    cols?: number;
    rows?: number;
    className?: string;
}

export default function GlyphGrid({ type = 'braille', cols = 8, rows = 3, className = '' }: GlyphGridProps) {
    const grid = useGlyphAnimator(type, { cols, rows });

    return (
        <div
            className={`font-mono text-[10px] leading-tight text-cream/50 select-none whitespace-pre animate-[pulse-glyph_4s_ease-in-out_infinite] ${className}`}
            aria-hidden="true"
        >
            {grid.map((row, i) => (
                <div key={i}>{row.join(' ')}</div>
            ))}
        </div>
    );
}
