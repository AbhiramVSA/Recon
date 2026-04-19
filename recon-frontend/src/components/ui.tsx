import { type ReactNode, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/* ── Section wrapper with fade-in ─────────────────────────────── */
interface SectionProps {
    id?: string;
    children: ReactNode;
    className?: string;
}

export function Section({ id, children, className = '' }: SectionProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.section
            ref={ref}
            id={id}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 ${className}`}
        >
            {children}
        </motion.section>
    );
}

/* ── Micro-label ──────────────────────────────────────────────── */
interface LabelProps {
    children: ReactNode;
    className?: string;
}

export function Label({ children, className = '' }: LabelProps) {
    return (
        <div className={`flex items-center gap-3 mb-6 ${className}`}>
            <span className="w-6 h-px bg-paper/30" />
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-paper/60">
                {children}
            </span>
        </div>
    );
}

/* ── Tag pill ─────────────────────────────────────────────────── */
interface TagProps {
    children: ReactNode;
    accent?: boolean;
}

export function Tag({ children, accent }: TagProps) {
    return (
        <span
            className={`inline-block font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 border ${accent
                ? 'border-paper/30 text-paper bg-paper/5'
                : 'border-edge text-muted bg-panel/60'
                }`}
        >
            {children}
        </span>
    );
}

/* ── Stagger container ────────────────────────────────────────── */
interface StaggerProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function Stagger({ children, className = '', delay = 0.08 }: StaggerProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={{
                visible: { transition: { staggerChildren: delay } },
                hidden: {},
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export const staggerChild = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
