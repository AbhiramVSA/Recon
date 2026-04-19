import type { PropsWithChildren } from 'react';
import { usePortalReveal } from '../hooks/usePortalReveal';

export default function PortalPage({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    const rootRef = usePortalReveal();

    return (
        <div ref={rootRef} className={className}>
            {children}
        </div>
    );
}
