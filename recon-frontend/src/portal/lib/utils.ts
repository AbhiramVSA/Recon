import { ZONES } from './data';

export function maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    if (name.length <= 4) return `${name[0] ?? ''}***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-2)}@${domain}`;
}

export function generatePassCode(shortName: string): string {
    const prefix = shortName.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'ZONE';
    const partA = Math.random().toString(36).slice(2, 6).toUpperCase();
    const partB = Math.random().toString(36).slice(2, 4).toUpperCase();
    return `${prefix}-${partA}-${partB}`;
}

export function generateRedeemCode(): string {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function getZoneById(id: string) {
    return ZONES.find((zone) => zone.id === id);
}

export function formatCountdown(msLeft: number): string {
    const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
    const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

export function getNowInIstLabel(): string {
    return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
    }).format(new Date());
}

export function getUtcLabel(): string {
    return new Date().toISOString().slice(11, 19);
}
