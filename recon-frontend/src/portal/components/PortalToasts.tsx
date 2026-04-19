import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useToastStore } from '../stores/toastStore';
import type { Toast, ToastType } from '../lib/types';

const ICON_MAP: Record<ToastType, React.ComponentType<{ className?: string }>> = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
};

const COLOR_CLASS: Record<ToastType, string> = {
    info: 'text-[var(--portal-blue)]',
    success: 'text-[var(--portal-green)]',
    warning: 'text-[var(--amber)]',
    error: 'text-[var(--portal-red)]',
};

function ToastRow({ toast, mobile }: { toast: Toast; mobile: boolean }) {
    const removeToast = useToastStore((state) => state.removeToast);
    const navigate = useNavigate();
    const rowRef = useRef<HTMLDivElement>(null);
    const durationMs = toast.durationMs ?? 4000;

    useEffect(() => {
        if (!rowRef.current) return;
        gsap.fromTo(
            rowRef.current,
            mobile ? { y: -48, opacity: 0 } : { x: 80, opacity: 0 },
            { y: 0, x: 0, opacity: 1, duration: 0.28, ease: 'power2.out' },
        );

        const timeoutId = window.setTimeout(() => {
            if (!rowRef.current) {
                removeToast(toast.id);
                return;
            }
            gsap.to(rowRef.current, {
                x: mobile ? 0 : 90,
                opacity: 0,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => removeToast(toast.id),
            });
        }, durationMs);

        return () => clearTimeout(timeoutId);
    }, [durationMs, mobile, removeToast, toast.id]);

    const Icon = ICON_MAP[toast.type];

    return (
        <div
            ref={rowRef}
            className="portal-card bg-[var(--surface-2)] p-0 overflow-hidden cursor-pointer"
            onClick={() => {
                if (toast.ctaPath) navigate(toast.ctaPath);
            }}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3 px-4 py-3">
                <Icon className={`size-4 mt-0.5 ${COLOR_CLASS[toast.type]}`} />
                <div className="flex-1 min-w-0">
                    <div className="font-portal-mono text-[11px] text-[var(--fg)] tracking-[0.08em] uppercase">
                        {toast.title}
                    </div>
                    <div className="font-portal-body text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_80%,white_8%)] mt-0.5">
                        {toast.body}
                    </div>
                </div>
                <button
                    type="button"
                    className="text-[color-mix(in_srgb,var(--dim)_60%,white_8%)] hover:text-[var(--fg)] min-h-11 min-w-11 inline-flex items-center justify-center"
                    onClick={(event) => {
                        event.stopPropagation();
                        removeToast(toast.id);
                    }}
                    aria-label="Dismiss toast"
                >
                    <X className="size-3.5" />
                </button>
            </div>
            <div className="h-px bg-[color-mix(in_srgb,var(--amber)_20%,transparent)]">
                <div
                    className="h-px bg-[color-mix(in_srgb,var(--amber)_62%,transparent)] toast-progress"
                    style={{ animationDuration: `${durationMs}ms` }}
                />
            </div>
        </div>
    );
}

export default function PortalToasts() {
    const toasts = useToastStore((state) => state.toasts);
    const mobile = !useMediaQuery('(min-width: 768px)');

    return (
        <div className="fixed z-[9000] top-[calc(env(safe-area-inset-top)+3.75rem)] md:top-[max(0.75rem,env(safe-area-inset-top))] md:right-4 md:left-auto left-3 right-3 sm:left-4 sm:right-4 flex flex-col gap-2 max-w-sm md:w-[22rem] pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastRow toast={toast} mobile={mobile} />
                </div>
            ))}
        </div>
    );
}
