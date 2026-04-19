import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
    { threshold: 0, label: 'INITIALIZING COMMS' },
    { threshold: 25, label: 'DECRYPTING MANIFEST' },
    { threshold: 55, label: 'LOADING ASSETS' },
    { threshold: 80, label: 'CALIBRATING HUD' },
    { threshold: 98, label: 'ACCESS GRANTED' },
];

const SEGMENTS = 28;

export default function Preloader() {
    const [visible, setVisible] = useState(true);
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(0);

    const stage = STAGES.filter((s) => progress >= s.threshold).pop()!;
    const filled = Math.round((progress / 100) * SEGMENTS);

    useEffect(() => {
        const MIN_MS = 1800;
        const start = Date.now();

        // Track whether the hero image has finished loading
        let imageReady = false;
        const img = new Image();
        img.onload = img.onerror = () => { imageReady = true; };
        img.src = '/hands.webp';

        const tick = setInterval(() => {
            const p = progressRef.current;

            // Slow near 90% until image is actually loaded
            let step: number;
            if (p < 60) step = Math.random() * 10 + 5;
            else if (p < 80) step = Math.random() * 6 + 3;
            else if (p < 95) step = imageReady ? Math.random() * 5 + 2 : 0.4;
            else step = imageReady ? 100 - p : 0.2;

            const next = Math.min(100, p + step);
            progressRef.current = next;
            setProgress(Math.floor(next));

            if (next >= 100) {
                clearInterval(tick);
                const delay = Math.max(0, MIN_MS - (Date.now() - start));
                setTimeout(() => setVisible(false), delay + 400); // linger on ACCESS GRANTED
            }
        }, 55);

        return () => clearInterval(tick);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="preloader"
                    className="fixed inset-0 bg-void flex flex-col items-center justify-center overflow-hidden select-none"
                    style={{ zIndex: 99999 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Corner angle brackets */}
                    <div className="absolute top-5 left-5 w-7 h-7 border-t border-l border-edge" />
                    <div className="absolute top-5 right-5 w-7 h-7 border-t border-r border-edge" />
                    <div className="absolute bottom-5 left-5 w-7 h-7 border-b border-l border-edge" />
                    <div className="absolute bottom-5 right-5 w-7 h-7 border-b border-r border-edge" />

                    {/* Top label */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2">
                        <span className="font-mono text-[8px] tracking-[0.45em] uppercase text-faint/50">
                            SYSTEM BOOT
                        </span>
                    </div>

                    {/* Center content */}
                    <div className="flex flex-col items-center gap-10 w-full max-w-[280px] px-6">
                        {/* Logo */}
                        <div className="text-center">
                            <p className="font-mono text-[12px] tracking-[0.5em] uppercase text-faint/50 mb-4">
                                NATIONAL WORKSHOP ON SYSTEM SECURITY
                            </p>
                            <h1 className="font-display text-[3.5rem] tracking-[0.2em] text-paper leading-none">
                                RECON
                            </h1>
                            <p className="font-mono text-[10px] tracking-[0.55em] text-muted mt-2">
                                2026
                            </p>
                        </div>

                        {/* Progress area */}
                        <div className="w-full flex flex-col gap-3">
                            {/* Segmented bar */}
                            <div className="flex gap-[3px]">
                                {Array.from({ length: SEGMENTS }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-[3px] flex-1 transition-colors duration-75 ${i < filled ? 'bg-paper/75' : 'bg-edge'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Status row */}
                            <div className="flex justify-between items-center">
                                <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-faint/60 flex items-center gap-1">
                                    {stage.label}
                                    <span className="inline-block w-[5px] h-[9px] bg-faint/50 animate-[blink_1s_step-end_infinite]" />
                                </span>
                                <span className="font-mono text-[10px] tracking-widest text-paper/50 tabular-nums">
                                    {String(progress).padStart(3, '0')}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom HUD strip */}
                    <div className="absolute bottom-5 inset-x-0 px-6 flex justify-between pointer-events-none">
                        <span className="font-mono text-[7px] tracking-[0.3em] uppercase text-faint/35">
                            VIT-AP UNIVERSITY · AMARAVATI
                        </span>
                        <span className="font-mono text-[7px] tracking-[0.3em] uppercase text-faint/35">
                            APR 19–21 2026
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
