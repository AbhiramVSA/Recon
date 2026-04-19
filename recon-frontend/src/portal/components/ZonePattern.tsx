import type { CSSProperties } from 'react';

const STYLE_MAP: Record<string, CSSProperties> = {
    ctf: {
        backgroundImage:
            'repeating-linear-gradient(135deg, color-mix(in srgb, var(--amber) 16%, transparent) 0 8px, transparent 8px 16px)',
    },
    koth: {
        backgroundImage:
            'radial-gradient(circle at center, color-mix(in srgb, var(--portal-red) 22%, transparent), transparent 72%)',
    },
    nfc: {
        backgroundImage:
            'radial-gradient(circle, color-mix(in srgb, var(--amber) 18%, transparent) 1px, transparent 1px)',
        backgroundSize: '10px 10px',
    },
    hardware: {
        backgroundImage:
            'repeating-linear-gradient(90deg, color-mix(in srgb, var(--amber) 12%, transparent) 0 2px, transparent 2px 8px), repeating-linear-gradient(0deg, color-mix(in srgb, var(--amber) 8%, transparent) 0 2px, transparent 2px 8px)',
    },
    appsec: {
        backgroundImage:
            'linear-gradient(180deg, color-mix(in srgb, var(--portal-blue) 18%, transparent), transparent 72%), repeating-linear-gradient(90deg, color-mix(in srgb, var(--portal-green) 14%, transparent) 0 1px, transparent 1px 6px)',
    },
    forensics: {
        backgroundImage:
            'repeating-linear-gradient(0deg, color-mix(in srgb, var(--fg) 5%, transparent) 0 2px, transparent 2px 4px)',
    },
    arena: {
        backgroundImage:
            'repeating-linear-gradient(135deg, color-mix(in srgb, var(--amber) 14%, transparent) 0 4px, transparent 4px 10px)',
    },
    expo: {
        backgroundImage:
            'repeating-linear-gradient(90deg, color-mix(in srgb, var(--fg) 6%, transparent) 0 1px, transparent 1px 12px), repeating-linear-gradient(0deg, color-mix(in srgb, var(--fg) 6%, transparent) 0 1px, transparent 1px 12px)',
    },
    escape: {
        backgroundImage:
            'linear-gradient(45deg, color-mix(in srgb, var(--amber) 12%, transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb, var(--amber) 12%, transparent) 75%), linear-gradient(45deg, color-mix(in srgb, var(--amber) 12%, transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb, var(--amber) 12%, transparent) 75%)',
        backgroundPosition: '0 0, 8px 8px',
        backgroundSize: '16px 16px',
    },
    gaming: {
        backgroundImage:
            'repeating-linear-gradient(90deg, color-mix(in srgb, var(--amber) 10%, transparent) 0 2px, transparent 2px 6px), repeating-linear-gradient(0deg, color-mix(in srgb, var(--amber) 10%, transparent) 0 2px, transparent 2px 6px)',
    },
    art: {
        backgroundImage:
            'linear-gradient(120deg, color-mix(in srgb, var(--amber) 18%, transparent), color-mix(in srgb, var(--portal-blue) 16%, transparent), transparent 80%)',
    },
};

export default function ZonePattern({
    zoneId,
    className,
}: {
    zoneId: string;
    className?: string;
}) {
    return (
        <div
            className={`absolute inset-0 ${className ?? ''}`}
            style={STYLE_MAP[zoneId] ?? STYLE_MAP.expo}
            aria-hidden="true"
        />
    );
}
