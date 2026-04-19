import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PortalPage from '../components/PortalPage';
import PortalModal from '../components/PortalModal';
import QrPassModal from '../components/QrPassModal';
import ZonePattern from '../components/ZonePattern';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel, StatusPill, ZoneTag } from '../components/primitives';
import { ZONES, ZONE_FILTERS } from '../lib/data';
import type { Zone } from '../lib/types';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useZoneStore } from '../stores/zoneStore';
import { getApiErrorMessage } from '../lib/apiErrorMessage';
import { fetchZonesCatalog } from '../api/zones';
import { mapBackendZoneToPortalZone } from '../lib/zonesCatalog';

function isCheckedIn(zoneId: string, checkedInZones: string[], qrActive: boolean | undefined, checkedIn: boolean | undefined) {
    if (checkedInZones.includes(zoneId)) return true;
    if (checkedIn) return true;
    if (qrActive === false) return true;
    return false;
}

function zoneState(zone: Zone, registered: boolean, checkedInFlag: boolean) {
    if (!zone.registrationRequired) return 'O';
    if (!registered) return 'A';
    if (checkedInFlag) return 'C';
    return 'B';
}

export default function ZonesPage() {
    const checkedInZonesRaw = useAuthStore((state) => state.participant?.checkedInZones ?? []);
    const registeredZonesRaw = useZoneStore((state) => state.registeredZones);
    const qrCodesRaw = useZoneStore((state) => state.qrCodes);
    const registerZone = useZoneStore((state) => state.registerZone);
    const refreshZonePass = useZoneStore((state) => state.refreshZonePass);
    const addToast = useToastStore((state) => state.addToast);

    const checkedInZones = Array.isArray(checkedInZonesRaw) ? checkedInZonesRaw : [];
    const registeredZones = Array.isArray(registeredZonesRaw) ? registeredZonesRaw : [];
    const qrCodes = Array.isArray(qrCodesRaw) ? qrCodesRaw : [];

    const [filter, setFilter] = useState<(typeof ZONE_FILTERS)[number]>('ALL');
    const [modalZone, setModalZone] = useState<Zone | null>(null);
    const [qrZoneId, setQrZoneId] = useState<string | null>(null);
    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const catalog = await fetchZonesCatalog();
                if (!alive) return;
                if (catalog.length > 0) {
                    setZones(catalog.map(mapBackendZoneToPortalZone));
                } else {
                    setZones(ZONES);
                }
            } catch (err) {
                if (!alive) return;
                addToast({
                    type: 'error',
                    title: 'ZONES UNAVAILABLE',
                    body: getApiErrorMessage(err, 'Unable to load live zones. Showing default zones.'),
                });
                setZones(ZONES);
            } finally {
                if (alive) setZonesLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [addToast]);

    const zonesSafe = useMemo(
        () => zones.map((zone) => ({
            ...zone,
            tags: Array.isArray(zone.tags) ? zone.tags : [],
        })),
        [zones],
    );

    const filtered = useMemo(() => {
        if (filter === 'ALL') return zonesSafe;
        if (filter === 'FLAGSHIP') return zonesSafe.filter((zone) => zone.type === 'flagship');
        return zonesSafe.filter((zone) => zone.category === filter);
    }, [filter, zonesSafe]);

    const flagshipZones = filtered.filter((zone) => zone.type === 'flagship');
    const sideZones = filtered.filter((zone) => zone.type === 'side');

    const qrZone = qrZoneId ? zones.find((zone) => zone.id === qrZoneId) : null;
    const qrPayload = qrCodes.find((code) => code.zoneId === qrZoneId);

    const onConfirmRegistration = async () => {
        if (!modalZone) return;
        try {
            await registerZone(modalZone.id);
            addToast({
                type: 'success',
                title: 'ZONE REGISTERED',
                body: `${modalZone.name} pass generated.`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'REGISTRATION FAILED',
                body: getApiErrorMessage(err, 'Unable to register for this zone.'),
            });
        }
        setModalZone(null);
    };

    const renderAction = (zone: Zone) => {
        const qr = qrCodes.find((code) => code.zoneId === zone.id);
        const registered = registeredZones.includes(zone.id);
        const checked = isCheckedIn(zone.id, checkedInZones, qr?.isActive, qr?.checkedIn);
        const state = zoneState(zone, registered, checked);

        if (state === 'A') {
            return (
                <PrimaryButton
                    className={zone.type === 'side' ? 'py-2.5' : ''}
                    onClick={() => {
                        setModalZone(zone);
                    }}
                >
                    {'REGISTER FOR THIS ZONE ->'}
                </PrimaryButton>
            );
        }

        if (state === 'O') {
            return (
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-[var(--portal-blue)] mt-0.5" />
                    <div>
                        <div className="font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--portal-blue)]">
                            OPEN ACCESS
                        </div>
                        <div className="font-portal-mono text-[9px] tracking-[0.08em] text-[color-mix(in_srgb,var(--dim)_65%,white_6%)] mt-1">
                            No registration or QR pass required
                        </div>
                    </div>
                </div>
            );
        }

        if (state === 'B' && qr) {
            return (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-2 sm:gap-3">
                    <StatusPill tone="amber" label="REGISTERED" />
                    <button
                        type="button"
                        className="font-portal-mono text-[10px] tracking-[0.12em] uppercase text-[var(--amber)] hover:underline"
                        onClick={() => {
                            void refreshZonePass(zone.id).catch(() => null);
                            setQrZoneId(zone.id);
                        }}
                    >
                        {'VIEW PASS ->'}
                    </button>
                </div>
            );
        }

        return (
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-[var(--portal-green)] mt-0.5" />
                    <div>
                    <div className="font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--portal-green)]">
                        CHECKED IN
                        </div>
                        <div className="font-portal-mono text-[9px] tracking-[0.08em] text-[color-mix(in_srgb,var(--dim)_65%,white_6%)] mt-1">
                            {zone.checkInPoints > 0 ? `+${zone.checkInPoints} on check-in` : 'Pass scanned'}
                        </div>
                    </div>
                </div>
        );
    };

    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8">
            <div className="px-4 lg:px-8 max-w-6xl mx-auto mb-8" data-portal-header>
                <SectionLabel>-- ACTIVE OPERATIONS // 11 ZONES --</SectionLabel>
                <div className="font-portal-display text-[clamp(36px,6vw,72px)] leading-[0.88] text-[var(--fg)] mt-2">
                    TARGET
                    <br />
                    <span className="text-[var(--amber)]">AREAS</span>
                </div>

                <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                    {ZONE_FILTERS.map((item) => (
                        <button
                            key={item}
                            type="button"
                            className={`min-h-11 px-3 py-2 border font-portal-mono text-[9px] tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${
                                filter === item
                                    ? 'border-[var(--amber)] text-[var(--amber)] bg-[color-mix(in_srgb,var(--amber)_8%,transparent)]'
                                    : 'border-[var(--border-dim)] bg-[var(--surface)] text-[color-mix(in_srgb,var(--dim)_70%,white_8%)]'
                            }`}
                            onClick={() => setFilter(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 lg:px-8 max-w-6xl mx-auto" data-portal-card>
                {zonesLoading && (
                    <PortalCard className="p-4 mb-6">
                        <div className="font-portal-mono text-[11px] tracking-[0.14em] uppercase text-[var(--dim)]">
                            Loading zones...
                        </div>
                    </PortalCard>
                )}

                {!zonesLoading && filtered.length === 0 && (
                    <PortalCard className="p-4 mb-6" attr>
                        <div className="font-portal-mono text-[10px] tracking-[0.14em] uppercase text-[var(--dim)]">
                            NO ZONES AVAILABLE FOR THIS FILTER.
                        </div>
                    </PortalCard>
                )}
                {flagshipZones.length > 0 && (
                    <>
                        <SectionLabel className="mb-4">-- FLAGSHIP COMPETITIONS --</SectionLabel>
                        <div className="grid lg:grid-cols-2 gap-4 mb-12">
                            {flagshipZones.map((zone) => (
                                <PortalCard key={zone.id} className="p-0 overflow-hidden">
                                    <div className="bg-[color-mix(in_srgb,var(--amber)_10%,transparent)] px-4 sm:px-5 py-4 border-b border-[var(--border-dim)] flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {zone.tags.map((tag) => (
                                                <ZoneTag key={tag}>{tag}</ZoneTag>
                                            ))}
                                        </div>
                                        <StatusPill
                                            tone={zone.status === 'open' ? 'blue' : 'red'}
                                            label={zone.status === 'open' ? 'OPEN' : 'CLOSED'}
                                        />
                                    </div>

                                    <div className="px-4 sm:px-5 py-5">
                                        <div className="font-portal-display text-[32px] leading-[0.9] text-[var(--fg)] tracking-[0.03em] uppercase">
                                            {zone.name}
                                        </div>
                                        <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[var(--amber)] mt-1">
                                            {zone.prizes}
                                        </div>
                                        <div className="font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_74%,white_8%)] leading-[1.7] mt-3">
                                            {zone.description}
                                        </div>

                                        <div className="h-px bg-[var(--border-dim)] my-4" />

                                        <div className="space-y-2">
                                            <div className="flex justify-between font-portal-mono text-[10px] tracking-[0.12em] uppercase">
                                                <span className="text-[color-mix(in_srgb,var(--amber)_55%,black_20%)]">TEAM SIZE</span>
                                                <span className="text-[color-mix(in_srgb,var(--fg)_78%,black_8%)]">{zone.teamSize} OPERATORS</span>
                                            </div>
                                            <div className="flex justify-between font-portal-mono text-[10px] tracking-[0.12em] uppercase">
                                                <span className="text-[color-mix(in_srgb,var(--amber)_55%,black_20%)]">FORMAT</span>
                                                <span className="text-[color-mix(in_srgb,var(--fg)_78%,black_8%)]">{zone.format}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 font-portal-mono text-[9px] tracking-[0.12em] text-[color-mix(in_srgb,var(--dim)_65%,white_6%)] uppercase">
                                            ● {zone.registeredCount} OPERATORS REGISTERED
                                        </div>
                                    </div>

                                    <div className="px-4 sm:px-5 py-4 border-t border-[var(--border-dim)]">
                                        {renderAction(zone)}
                                    </div>
                                </PortalCard>
                            ))}
                        </div>
                    </>
                )}

                {sideZones.length > 0 && (
                    <>
                        <SectionLabel className="mb-4">-- SIDE EVENTS // 9 ZONES OF CHAOS --</SectionLabel>
                        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                            {sideZones.map((zone) => (
                                <PortalCard key={zone.id} className="p-0 overflow-hidden">
                                    <div className="relative h-36 bg-[var(--surface-2)] overflow-hidden">
                                        <ZonePattern zoneId={zone.id} />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--surface)]" />
                                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                            {zone.tags.slice(0, 2).map((tag) => (
                                                <ZoneTag key={tag}>{tag}</ZoneTag>
                                            ))}
                                        </div>
                                        <div className="absolute top-3 right-3 bg-[rgba(8,8,7,0.7)] px-2 py-1 font-portal-mono text-[9px] tracking-[0.1em] text-[color-mix(in_srgb,var(--fg)_68%,black_10%)] uppercase">
                                            ● {zone.registeredCount}
                                        </div>
                                    </div>

                                    <div className="px-4 py-4">
                                        <div className="font-portal-display text-[22px] leading-[0.95] text-[var(--fg)] uppercase tracking-[0.03em]">
                                            {zone.name}
                                        </div>
                                        <div className="font-portal-body text-[12px] leading-[1.6] text-[color-mix(in_srgb,var(--dim)_64%,white_7%)] mt-2 line-clamp-2">
                                            {zone.description}
                                        </div>
                                    </div>

                                    <div className="px-4 pb-4">{renderAction(zone)}</div>
                                </PortalCard>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <PortalModal open={Boolean(modalZone)} title="CONFIRM REGISTRATION" onClose={() => setModalZone(null)}>
                {modalZone && (
                    <div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {modalZone.tags.map((tag) => (
                                <ZoneTag key={tag}>{tag}</ZoneTag>
                            ))}
                        </div>
                        <div className="font-portal-display text-[24px] leading-none text-[var(--fg)] tracking-[0.03em] uppercase">
                            {modalZone.name}
                        </div>
                        <div className="font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_74%,white_8%)] leading-relaxed mt-2">
                            {modalZone.description}
                        </div>
                        <div className="h-px bg-[var(--border-dim)] my-4" />
                        <div className="font-portal-mono text-[10px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_74%,white_8%)] leading-relaxed">
                            {modalZone.registrationRequired
                                ? `This will register you for the selected zone and issue your backend-generated entry pass. Reward: +${modalZone.checkInPoints} points after admin scan.`
                                : 'This zone is open access and does not require a pass.'}
                        </div>

                        <div className="mt-5 grid gap-2">
                            <PrimaryButton onClick={onConfirmRegistration}>{'ACKNOWLEDGE ->'}</PrimaryButton>
                            <GhostButton onClick={() => setModalZone(null)}>CLOSE</GhostButton>
                        </div>
                    </div>
                )}
            </PortalModal>

            {qrZone && qrPayload && (
                <QrPassModal
                    open={Boolean(qrZoneId)}
                    zoneName={qrZone.name}
                    code={qrPayload.code}
                    qrToken={qrPayload.qrToken}
                    active={qrPayload.isActive}
                    onClose={() => setQrZoneId(null)}
                />
            )}
        </PortalPage>
    );
}
