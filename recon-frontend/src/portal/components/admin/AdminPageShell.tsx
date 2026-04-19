import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PortalPage from '../PortalPage';
import { SectionLabel } from '../primitives';

type Props = PropsWithChildren<{
    title: string;
    subtitle?: ReactNode;
    backTo?: string;
    backLabel?: string;
}>;

export function AdminPageShell({ title, subtitle, backTo = '/admin', backLabel = '← OPERATIONS', children }: Props) {
    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-5xl mx-auto">
            <div className="mb-6">
                <Link
                    to={backTo}
                    className="inline-block font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--dim)_70%,white_8%)] hover:text-[var(--amber)] transition-colors"
                >
                    {backLabel}
                </Link>
                <SectionLabel className="mt-4">-- OPERATIONS --</SectionLabel>
                <h1 className="font-portal-display text-[clamp(28px,5vw,40px)] leading-none text-[var(--fg)] mt-2">
                    {title}
                </h1>
                {subtitle && (
                    <div className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_78%,white_6%)] mt-3 max-w-2xl">
                        {subtitle}
                    </div>
                )}
            </div>
            {children}
        </PortalPage>
    );
}
