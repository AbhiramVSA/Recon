import { useScramble } from '../hooks';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface ScrambleTextProps {
    text: string;
    tag?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
    className?: string;
    speed?: number;
}

export default function ScrambleText({ text, tag: Tag = 'span', className = '', speed = 25 }: ScrambleTextProps) {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const display = useScramble(text, { speed, trigger: inView });

    return (
        // @ts-expect-error dynamic tag
        <Tag ref={ref} className={className}>
            {display || '\u00A0'}
        </Tag>
    );
}
