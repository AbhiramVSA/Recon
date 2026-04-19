import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Star {
    id: number;
    x: number;
    y: number;
    size: 'xs' | 'sm' | 'lg';
    delay: number;
    duration: number;
}

const SRC: Record<string, string> = {
    xs: '/pixel-star-xs.svg',
    sm: '/pixel-star-sm.svg',
    lg: '/pixel-star-lg.svg',
};

const PX: Record<string, number> = { xs: 4, sm: 8, lg: 16 };

export default function PixelStars({ count = 18, className = '' }: { count?: number; className?: string }) {
    const stars = useMemo<Star[]>(() => {
        const sizes: Star['size'][] = ['xs', 'sm', 'lg'];
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: sizes[i % 3],
            delay: Math.random() * 4,
            duration: 2 + Math.random() * 3,
        }));
    }, [count]);

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
            {stars.map((s) => (
                <motion.img
                    key={s.id}
                    src={SRC[s.size]}
                    width={PX[s.size]}
                    height={PX[s.size]}
                    alt=""
                    className="absolute text-paper"
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                    initial={{ opacity: 0.15, scale: 0.8 }}
                    animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.8, 1.15, 0.8] }}
                    transition={{
                        duration: s.duration,
                        delay: s.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}
