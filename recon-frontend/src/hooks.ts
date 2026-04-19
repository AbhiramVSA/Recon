import { useState, useEffect } from 'react';

/* ── useScramble ─────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz·-—_';

export function useScramble(text: string, opts?: { speed?: number; trigger?: boolean }) {
    const speed = opts?.speed ?? 18;
    const trigger = opts?.trigger ?? true;
    const [display, setDisplay] = useState('');

    useEffect(() => {
        if (!trigger) {
            setDisplay('');
            return;
        }

        let raf: number;
        let idx = 0;
        const len = text.length;
        const tick = () => {
            idx++;
            const done = Math.floor(idx / 2);
            const result = text
                .split('')
                .map((ch, i) => {
                    if (i < done) return ch;
                    if (ch === ' ') return ' ';
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                })
                .join('');
            setDisplay(result);
            if (done < len) {
                raf = window.setTimeout(tick, speed);
            } else {
                setDisplay(text);
            }
        };
        tick();

        return () => clearTimeout(raf);
    }, [text, speed, trigger]);

    return display;
}

/* ── useCountUp ──────────────────────────────────────────────── */
export function useCountUp(
    end: number,
    opts?: { duration?: number; trigger?: boolean; prefix?: string; suffix?: string }
) {
    const duration = opts?.duration ?? 2000;
    const trigger = opts?.trigger ?? true;
    const prefix = opts?.prefix ?? '';
    const suffix = opts?.suffix ?? '';
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!trigger) {
            setValue(0);
            return;
        }

        const start = performance.now();
        let raf: number;

        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * end));
            if (progress < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                setValue(end);
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [end, duration, trigger]);

    const formatted = `${prefix}${value.toLocaleString('en-IN')}${suffix}`;
    return { value, formatted };
}

/* ── useGlyphAnimator ────────────────────────────────────────── */
const GLYPH_SETS = {
    braille: '⣀⣤⣶⣿⣷⣦⣄⠀',
    hex: '⬠⬡⬢⬣⬨⬦⬥',
    circles: '○◦⦿◒∘●◐◑',
    blocks: '█▇▆▅▄▃▂▁ ',
    matrix: '░▒▓█',
};

export function useGlyphAnimator(
    type: keyof typeof GLYPH_SETS = 'braille',
    opts?: { cols?: number; rows?: number; interval?: number }
) {
    const cols = opts?.cols ?? 8;
    const rows = opts?.rows ?? 4;
    const interval = opts?.interval ?? 120;
    const chars = GLYPH_SETS[type];
    const [grid, setGrid] = useState<string[][]>([]);

    useEffect(() => {
        const gen = () =>
            Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => chars[Math.floor(Math.random() * chars.length)])
            );
        setGrid(gen());
        const id = setInterval(() => setGrid(gen()), interval);
        return () => clearInterval(id);
    }, [type, cols, rows, interval, chars]);

    return grid;
}

/* ── useMousePosition ────────────────────────────────────────── */
export function useMousePosition() {
    const [pos, setPos] = useState({ x: -100, y: -100 });

    useEffect(() => {
        const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    }, []);

    return pos;
}
