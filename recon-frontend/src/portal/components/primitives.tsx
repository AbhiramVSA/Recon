import type { PropsWithChildren, ReactNode } from 'react';

export function ZoneTag({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    return <span className={`zone-tag ${className}`}>{children}</span>;
}

export function StatusPill({
    label,
    tone = 'amber',
}: {
    label: string;
    tone?: 'green' | 'blue' | 'red' | 'amber';
}) {
    return (
        <span className={`status-pill status-${tone}`}>
            <span className="status-pill-dot" />
            {label}
        </span>
    );
}

export function SectionLabel({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    return (
        <div className={`font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_20%)] ${className}`}>
            {children}
        </div>
    );
}

export function PortalCard({
    children,
    className = '',
    attr,
}: {
    children: ReactNode;
    className?: string;
    attr?: boolean;
}) {
    return (
        <div className={`portal-card ${className}`} data-portal-card={attr ? 'true' : undefined}>
            {children}
        </div>
    );
}

export function PrimaryButton({
    children,
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`w-full min-h-11 bg-[var(--amber)] text-[var(--bg)] hover:brightness-90 font-portal-mono text-[12px] tracking-[0.15em] uppercase px-4 py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );
}

export function GhostButton({
    children,
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`w-full min-h-11 border border-[var(--border-dim)] hover:border-[var(--border)] font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--fg)] px-4 py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );
}
