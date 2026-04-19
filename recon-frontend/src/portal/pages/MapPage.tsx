import { Navigation2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import PortalPage from '../components/PortalPage';
import { PortalCard, SectionLabel, StatusPill } from '../components/primitives';
import { ZONES } from '../lib/data';

const MAP_EMBED =
    'https://www.google.com/maps?q=16.4948622,80.4990628&hl=en&z=17&output=embed';

const MAP_ZONE_ORDER = ['arena', 'appsec', 'art', 'nfc', 'gaming', 'expo', 'forensics'] as const;

export default function MapPage() {
    const [locationState, setLocationState] = useState<'idle' | 'granted' | 'denied'>('idle');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const mapSrc = useMemo(() => {
        if (!userLocation) return MAP_EMBED;
        return `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}&hl=en&z=17&output=embed`;
    }, [userLocation]);

    const mapZones = useMemo(() => {
        const zoneById = new Map(ZONES.map((zone) => [zone.id, zone]));
        return MAP_ZONE_ORDER.map((id) => zoneById.get(id)).filter((zone): zone is NonNullable<typeof zone> => Boolean(zone));
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationState('denied');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setLocationState('granted');
            },
            () => setLocationState('denied'),
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8 px-4 sm:px-5 lg:px-8">
            <div className="max-w-6xl mx-auto" data-portal-header>
                <SectionLabel>-- CAMPUS MAP // VIT-AP CENTRAL BLOCK --</SectionLabel>
                <div className="font-portal-display text-[clamp(30px,8vw,36px)] leading-none text-[var(--fg)] mt-2">
                    ZONE <span className="text-[var(--amber)]">MAP</span>
                </div>
                <div className="font-portal-mono text-[10px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_70%,white_8%)] mt-2">
                    VIT-AP University, Amaravati, Andhra Pradesh
                </div>

                {locationState !== 'granted' && (
                    <div className="mt-4 border border-[var(--border)] bg-[color-mix(in_srgb,var(--amber)_8%,transparent)] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="font-portal-mono text-[10px] tracking-[0.1em] text-[color-mix(in_srgb,var(--amber)_80%,black_10%)] uppercase">
                            Enable location to see your position on the map
                        </span>
                        <button
                            type="button"
                            className="w-full sm:w-auto min-h-11 px-4 border border-[var(--border)] font-portal-mono text-[10px] tracking-[0.12em] uppercase text-[var(--amber)]"
                            onClick={requestLocation}
                        >
                            {'ENABLE ->'}
                        </button>
                    </div>
                )}

                <PortalCard className="p-0 overflow-hidden mt-6 mb-6 relative h-[56svh] sm:h-[60vh] min-h-[260px] sm:min-h-[300px] max-h-[520px]" attr>
                    <iframe
                        src={mapSrc}
                        title="VIT-AP Zone Map"
                        className="w-full h-full border-0"
                        loading="lazy"
                        style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.75) contrast(1.1)' }}
                        referrerPolicy="no-referrer-when-downgrade"
                    />

                    <button
                        type="button"
                        onClick={requestLocation}
                        className="absolute bottom-3 left-3 right-3 sm:right-auto sm:bottom-4 sm:left-4 min-h-11 px-3 py-2 border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] text-[var(--amber)] font-portal-mono text-[10px] tracking-[0.12em] uppercase inline-flex items-center justify-center sm:justify-start gap-2"
                    >
                        <Navigation2 className="size-3.5" />
                        LOCATE ME
                    </button>

                    <PortalCard className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] p-2 sm:p-3 max-w-[160px] sm:max-w-[180px]">
                        <div className="font-portal-mono text-[8px] tracking-[0.16em] text-[color-mix(in_srgb,var(--amber)_60%,black_10%)] uppercase mb-2">
                            ACTIVE ZONES
                        </div>
                        <div className="space-y-1.5">
                            {mapZones.map((zone) => (
                                <div key={zone.id} className="font-portal-mono text-[9px] text-[color-mix(in_srgb,var(--fg)_65%,black_12%)] tracking-[0.1em] uppercase flex items-center gap-2">
                                    <span className="size-2" style={{ background: zone.color }} />
                                    {zone.shortName}
                                </div>
                            ))}
                        </div>
                    </PortalCard>
                </PortalCard>

                <SectionLabel className="mb-4 mt-6">-- ZONE LOCATIONS --</SectionLabel>

                <div className="space-y-2" data-portal-card>
                    {mapZones.map((zone) => (
                        <PortalCard key={zone.id} className="px-4 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                <div className="flex w-full items-center gap-3 sm:gap-4 min-w-0">
                                    <span className="size-2.5 shrink-0" style={{ backgroundColor: zone.color }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-portal-mono text-[11px] tracking-[0.08em] text-[var(--fg)] uppercase">
                                            {zone.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:ml-auto sm:justify-end">
                                    <StatusPill
                                        tone={zone.status === 'open' ? 'blue' : zone.status === 'soon' ? 'amber' : 'red'}
                                        label={zone.status.toUpperCase()}
                                    />
                                    <div className="min-w-0 text-right sm:max-w-[220px]">
                                        <div className="font-portal-mono text-[8px] tracking-[0.14em] text-[color-mix(in_srgb,var(--dim)_62%,white_8%)] uppercase">
                                            Venue
                                        </div>
                                        <div className="font-portal-mono text-[9px] tracking-[0.08em] text-[var(--amber)] uppercase break-words">
                                            {zone.location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PortalCard>
                    ))}
                </div>
            </div>
        </PortalPage>
    );
}
