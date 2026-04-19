import { Gift, Trophy, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PortalPage from '../components/PortalPage';
import PortalModal from '../components/PortalModal';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel, ZoneTag } from '../components/primitives';
import { MERCH_ITEMS } from '../lib/data';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { fetchShopItems, redeemShopItem } from '../api/shop';
import type { BackendRedemption, BackendShopItem } from '../api/shop';
import { ApiError } from '../api/client';

type RedeemStage = 'confirm' | 'loading' | 'success';
type CatalogSource = 'backend' | 'preview';

function merchPattern(item: BackendShopItem) {
    const key = `${item.id} ${item.name} ${item.photo_key ?? ''}`.toLowerCase();
    if (key.includes('operator')) {
        return 'linear-gradient(135deg, color-mix(in srgb, var(--amber) 14%, transparent), transparent 72%)';
    }
    if (key.includes('osen') || key.includes('stealth')) {
        return 'linear-gradient(180deg, color-mix(in srgb, var(--fg) 10%, transparent), transparent 70%)';
    }
    if (key.includes('cap')) {
        return 'radial-gradient(circle at center, color-mix(in srgb, var(--amber) 16%, transparent), transparent 72%)';
    }
    if (key.includes('caido')) {
        return 'radial-gradient(circle at top, color-mix(in srgb, var(--portal-blue) 16%, transparent), transparent 68%)';
    }
    return 'repeating-linear-gradient(90deg, color-mix(in srgb, var(--amber) 10%, transparent) 0 8px, transparent 8px 16px)';
}

const merchImageById: Record<string, string> = MERCH_ITEMS.reduce<Record<string, string>>((acc, item) => {
    if (item.image) acc[item.id] = item.image;
    return acc;
}, {});

function resolveMerchImage(item: BackendShopItem) {
    const key = item.photo_key?.trim();
    if (key) {
        if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/')) {
            return key;
        }
    }
    return merchImageById[item.id];
}

function buildPreviewCatalog(): BackendShopItem[] {
    const now = new Date().toISOString();
    return MERCH_ITEMS.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        point_cost: item.pointsCost,
        stock: item.stock,
        remaining_stock: item.stock,
        is_active: true,
        photo_key: item.image ?? null,
        created_at: now,
        updated_at: now,
    }));
}

function extractShopItems(payload: unknown): BackendShopItem[] {
    if (Array.isArray(payload)) {
        return payload as BackendShopItem[];
    }

    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        const arrayCandidate = [record.items, record.data, record.results].find(Array.isArray);
        if (Array.isArray(arrayCandidate)) {
            return arrayCandidate as BackendShopItem[];
        }
    }

    return [];
}

export default function MerchPage() {
    const participant = useAuthStore((state) => state.participant);
    const addToast = useToastStore((state) => state.addToast);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [redeemStage, setRedeemStage] = useState<RedeemStage>('confirm');
    const [redeemResult, setRedeemResult] = useState<BackendRedemption | null>(null);
    const [items, setItems] = useState<BackendShopItem[]>([]);
    const [catalogSource, setCatalogSource] = useState<CatalogSource>('backend');
    const [loading, setLoading] = useState(true);

    const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;
    const points = participant?.points ?? 0;

    const canAfford = (cost: number) => points >= cost;

    const balancePreview = useMemo(() => {
        if (!selected) return points;
        return Math.max(0, points - selected.point_cost);
    }, [points, selected]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const raw = (await fetchShopItems()) as unknown;
                if (!alive) return;

                const backendItems = extractShopItems(raw);
                const activeItems = backendItems.filter((item) => item.is_active ?? true);

                if (activeItems.length > 0) {
                    setItems(activeItems);
                    setCatalogSource('backend');
                } else {
                    setItems(buildPreviewCatalog());
                    setCatalogSource('preview');
                    addToast({
                        type: 'warning',
                        title: 'PREVIEW CATALOG MODE',
                        body: 'Live shop returned no active items. Showing preview catalog.',
                    });
                }
            } catch {
                addToast({
                    type: 'warning',
                    title: 'PREVIEW CATALOG MODE',
                    body: 'Unable to load live merch catalog. Showing preview catalog.',
                });
                if (alive) {
                    setItems(buildPreviewCatalog());
                    setCatalogSource('preview');
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [addToast]);

    const onConfirmRedeem = async () => {
        if (!selected) return;
        if (catalogSource !== 'backend') {
            addToast({
                type: 'warning',
                title: 'REDEMPTION DISABLED',
                body: 'Live shop sync is not available yet. Please try again later.',
            });
            return;
        }
        setRedeemStage('loading');
        try {
            const redeemed = await redeemShopItem(selected.id);
            setRedeemResult(redeemed);
            setRedeemStage('success');
            addToast({
                type: 'success',
                title: 'REDEMPTION CONFIRMED',
                body: `Redemption confirmed - ${selected.name}.`,
            });
        } catch (err) {
            const body =
                err instanceof ApiError && typeof err.body === 'object' && err.body && 'detail' in err.body
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      String((err.body as any).detail)
                    : 'Unable to redeem item.';
            addToast({
                type: 'error',
                title: 'REDEMPTION FAILED',
                body,
            });
            setRedeemStage('confirm');
        }
    };

    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8" data-portal-header>
                <div>
                    <SectionLabel className="mb-2">-- RECON MERCHANDISE --</SectionLabel>
                    <div className="font-portal-display text-[clamp(32px,5vw,60px)] leading-[0.88] text-[var(--fg)]">
                        MERCH
                        <br />
                        <span className="text-[var(--amber)]">STORE</span>
                    </div>
                </div>
                <PortalCard className="hidden md:block px-4 py-3 text-center" attr>
                    <div className="font-portal-mono text-[9px] tracking-[0.16em] uppercase text-[color-mix(in_srgb,var(--amber)_55%,black_20%)]">
                        AVAILABLE
                    </div>
                    <div className="font-portal-display text-[32px] leading-none text-[var(--amber)]">{points}</div>
                    <div className="font-portal-mono text-[9px] tracking-[0.14em] uppercase text-[color-mix(in_srgb,var(--dim)_66%,white_7%)]">
                        POINTS
                    </div>
                </PortalCard>
            </div>

            <PortalCard className="md:hidden px-4 py-3 mb-5 flex justify-between items-center" attr>
                <div className="font-portal-mono text-[10px] tracking-[0.12em] uppercase text-[color-mix(in_srgb,var(--dim)_68%,white_7%)]">
                    AVAILABLE POINTS
                </div>
                <div className="font-portal-display text-[28px] leading-none text-[var(--amber)]">{points ?? 0} PTS</div>
            </PortalCard>

            <PortalCard className="px-4 py-4 mb-8 bg-[var(--surface)]" attr>
                <SectionLabel className="mb-3">-- HOW TO EARN POINTS --</SectionLabel>
                <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-1">
                    {[
                        { icon: Zap, text: 'Zone rewards are configured by the backend' },
                        { icon: Trophy, text: 'Competition rewards settle after admin validation' },
                        { icon: Gift, text: 'Use your dashboard balance as the source of truth' },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="min-w-[170px] sm:min-w-max text-center">
                            <Icon className="size-4 mx-auto text-[var(--amber)]" />
                            <div className="font-portal-mono text-[9px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_68%,white_7%)] uppercase mt-2">
                                {text}
                            </div>
                        </div>
                    ))}
                </div>
            </PortalCard>

            <div className="grid md:grid-cols-2 gap-4" data-portal-card>
                {loading && (
                    <PortalCard className="px-4 py-4 md:col-span-2" attr>
                        <div className="font-portal-mono text-[10px] tracking-[0.16em] uppercase text-[color-mix(in_srgb,var(--dim)_70%,white_8%)]">
                            LOADING CATALOG...
                        </div>
                    </PortalCard>
                )}

                {!loading && catalogSource === 'preview' && (
                    <PortalCard className="px-4 py-4 md:col-span-2" attr>
                        <div className="font-portal-mono text-[10px] tracking-[0.14em] uppercase text-[color-mix(in_srgb,var(--amber)_66%,black_20%)]">
                            LIVE SHOP SYNC UNAVAILABLE - SHOWING PREVIEW ITEMS
                        </div>
                    </PortalCard>
                )}

                {!loading && items.map((item) => {
                    const affordable = canAfford(item.point_cost);
                    const remaining = item.remaining_stock ?? item.stock ?? 0;
                    const outOfStock = remaining <= 0;
                    const imageSrc = resolveMerchImage(item);
                    const canRedeem = catalogSource === 'backend' && affordable && !outOfStock;
                    const missing = Math.max(0, item.point_cost - points);
                    const progress = item.point_cost > 0
                        ? Math.min(100, Math.round((points / item.point_cost) * 100))
                        : 100;

                    return (
                        <PortalCard key={item.id} className="p-0 overflow-hidden">
                            <div className="h-44 sm:h-52 bg-[var(--surface-2)] relative" style={{ backgroundImage: merchPattern(item) }}>
                                <ZoneTag className="absolute top-3 right-3">
                                    {outOfStock
                                        ? 'SOLD OUT'
                                        : affordable
                                          ? 'AVAILABLE'
                                          : 'NEED MORE PTS'}
                                </ZoneTag>
                                {imageSrc ? (
                                    <img
                                        src={imageSrc}
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-contain p-3 sm:p-4"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="absolute bottom-3 left-3 font-portal-mono text-[8px] tracking-[0.12em] uppercase text-[color-mix(in_srgb,var(--fg)_56%,black_10%)] bg-[rgba(8,8,7,0.8)] px-2 py-1">
                                        IMAGE COMING SOON
                                    </div>
                                )}
                            </div>

                            <div className="px-4 py-4">
                                <div className="font-portal-mono text-[9px] tracking-[0.14em] uppercase text-[color-mix(in_srgb,var(--amber)_58%,black_20%)]">
                                    MERCH
                                </div>
                                <div className="font-portal-mono text-[14px] tracking-[0.08em] uppercase text-[var(--fg)] mt-1">
                                    {item.name}
                                </div>
                                <div className="mt-2 flex items-end gap-2">
                                    <div className="font-portal-display text-[28px] leading-none text-[var(--amber)]">
                                        {item.point_cost}
                                    </div>
                                    <div className="font-portal-mono text-[9px] tracking-[0.12em] uppercase text-[color-mix(in_srgb,var(--dim)_66%,white_7%)] pb-1">
                                        POINTS
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 pb-4">
                                {canRedeem ? (
                                    <button
                                        type="button"
                                        className="w-full min-h-11 border border-[var(--amber)] text-[var(--amber)] font-portal-mono text-[11px] tracking-[0.12em] uppercase py-3 hover:bg-[color-mix(in_srgb,var(--amber)_10%,transparent)]"
                                        onClick={() => {
                                            setSelectedId(item.id);
                                            setRedeemStage('confirm');
                                            setRedeemResult(null);
                                        }}
                                    >
                                        {'REDEEM ->'}
                                    </button>
                                ) : (
                                    <>
                                        <div className="font-portal-mono text-[10px] tracking-[0.1em] uppercase text-[color-mix(in_srgb,var(--dim)_64%,white_7%)]">
                                            {catalogSource !== 'backend'
                                                ? 'PREVIEW MODE - REDEMPTION DISABLED'
                                                : outOfStock
                                                  ? 'CURRENTLY SOLD OUT'
                                                  : `NEED ${missing} MORE POINTS`}
                                        </div>
                                        {catalogSource === 'backend' && !outOfStock && !affordable && (
                                            <div className="h-[2px] bg-[var(--border)] mt-2 overflow-hidden">
                                                <div className="h-[2px] bg-[var(--amber)]" style={{ width: `${progress}%` }} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </PortalCard>
                    );
                })}
            </div>

            <PortalModal
                open={Boolean(selected)}
                title="CONFIRM REDEMPTION"
                onClose={() => setSelectedId(null)}
            >
                {selected && (
                    <>
                        {redeemStage !== 'success' && (
                            <>
                                <div className="font-portal-mono text-[13px] tracking-[0.08em] uppercase text-[var(--fg)] leading-relaxed">
                                    {selected.name}
                                </div>
                                <div className="font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--amber)] mt-2">
                                    COST: {selected.point_cost} POINTS
                                </div>
                                <div className="font-portal-mono text-[10px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_72%,white_8%)] mt-4 leading-relaxed uppercase">
                                    {`${points} -> ${balancePreview} PTS`}
                                </div>
                                <div className="font-portal-mono text-[10px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_70%,white_7%)] mt-3 leading-relaxed">
                                    Visit the merch booth to collect your item. Show your redemption code to the volunteer.
                                </div>
                                <div className="grid gap-2 mt-5">
                                    <PrimaryButton
                                        disabled={redeemStage === 'loading'}
                                        onClick={onConfirmRedeem}
                                    >
                                        {redeemStage === 'loading' ? 'PROCESSING...' : 'CONFIRM REDEMPTION'}
                                    </PrimaryButton>
                                    <GhostButton onClick={() => setSelectedId(null)}>CANCEL</GhostButton>
                                </div>
                            </>
                        )}

                        {redeemStage === 'success' && (
                            <div className="text-center">
                                <div className="font-portal-mono text-[12px] tracking-[0.12em] uppercase text-[var(--portal-green)]">
                                    REDEMPTION CONFIRMED
                                </div>
                                {redeemResult && (
                                    <div className="font-portal-mono text-[10px] tracking-[0.12em] uppercase text-[color-mix(in_srgb,var(--dim)_68%,white_7%)] mt-3">
                                        REDEMPTION ID
                                    </div>
                                )}
                                {redeemResult && (
                                    <div className="font-portal-display text-[22px] text-[var(--amber)] leading-none mt-2 tracking-[0.06em] break-all">
                                        {redeemResult.id}
                                    </div>
                                )}
                                <div className="font-portal-mono text-[9px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_68%,white_7%)] mt-3 uppercase">
                                    Show this redemption id at the RECON merch booth.
                                </div>
                                <button
                                    type="button"
                                    className="mt-4 min-h-11 px-4 border border-[var(--border)] font-portal-mono text-[10px] tracking-[0.12em] uppercase text-[var(--amber)]"
                                    onClick={async () => {
                                        if (!redeemResult) return;
                                        await navigator.clipboard.writeText(redeemResult.id);
                                        addToast({
                                            type: 'info',
                                            title: 'CODE COPIED',
                                            body: `Redemption id copied to clipboard.`,
                                        });
                                    }}
                                >
                                    COPY ID
                                </button>
                            </div>
                        )}
                    </>
                )}
            </PortalModal>
        </PortalPage>
    );
}
