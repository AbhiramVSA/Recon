import { useEffect, useMemo, useRef, useState } from 'react';

interface BootSequenceProps {
    lines: string[];
    speed?: number;
    className?: string;
    onComplete?: () => void;
}

export default function BootSequence({
    lines,
    speed = 40,
    className = '',
    onComplete,
}: BootSequenceProps) {
    const [charCount, setCharCount] = useState(0);
    const completedRef = useRef(false);

    const fullText = useMemo(() => lines.join('\n'), [lines]);
    const totalChars = fullText.length;

    useEffect(() => {
        completedRef.current = false;
        setCharCount(0);
        const id = window.setInterval(() => {
            setCharCount((current) => {
                const next = Math.min(totalChars, current + 1);
                return next;
            });
        }, speed);

        return () => clearInterval(id);
    }, [fullText, speed, totalChars]);

    useEffect(() => {
        if (completedRef.current) return;
        if (charCount < totalChars) return;
        completedRef.current = true;
        onComplete?.();
    }, [charCount, onComplete, totalChars]);

    const visible = fullText.slice(0, charCount);

    return (
        <pre className={`font-portal-mono text-[9px] sm:text-[10px] text-[color-mix(in_srgb,var(--amber)_42%,black_10%)] text-center tracking-[0.1em] whitespace-pre-wrap leading-4 sm:leading-5 max-w-[min(32rem,92vw)] mx-auto ${className}`}>
            {visible || '\u00A0'}
        </pre>
    );
}
