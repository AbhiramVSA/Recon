import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { X } from 'lucide-react';

interface PortalModalProps {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
}

export default function PortalModal({ open, title, onClose, children }: PortalModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!open || !cardRef.current) return;
        gsap.fromTo(
            cardRef.current,
            { scale: 0.95, opacity: 0, y: 8 },
            { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' },
        );
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center px-3 sm:px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={cardRef}
                className="portal-card w-full max-w-md p-4 sm:p-6 bg-[var(--surface)] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_65%,black_20%)]">
                        {title}
                    </div>
                    <button
                        type="button"
                        className="min-h-11 min-w-11 inline-flex items-center justify-center text-[color-mix(in_srgb,var(--dim)_70%,white_8%)] hover:text-[var(--fg)]"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <div className="h-px bg-[var(--border-dim)] my-4" />
                {children}
            </div>
        </div>
    );
}
