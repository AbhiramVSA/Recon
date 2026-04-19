import { useState } from 'react';
import { announcementsApi, pointsApi, shopApi, zonesApi } from '../../../api/backend';
import { apiFetch } from '../../../api/client';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

export default function AdminApiCoveragePage() {
    const addToast = useToastStore((s) => s.addToast);
    const [output, setOutput] = useState('Ready.');

    const [zoneIdentifier, setZoneIdentifier] = useState('');
    const [participantId, setParticipantId] = useState('');
    const [announcementId, setAnnouncementId] = useState('');
    const [shopItemId, setShopItemId] = useState('');
    const [redemptionId, setRedemptionId] = useState('');
    const [idempotencyKey, setIdempotencyKey] = useState(() => `key-${Date.now()}`);
    const [qrToken, setQrToken] = useState('');
    const [scannerDeviceId, setScannerDeviceId] = useState('portal-admin-scanner');

    const run = async (title: string, fn: () => Promise<unknown>) => {
        try {
            const result = await fn();
            setOutput(JSON.stringify(result, null, 2));
            addToast({ type: 'success', title, body: 'Request succeeded.' });
        } catch (err) {
            const body = getApiErrorMessage(err, 'Request failed.');
            setOutput(body);
            addToast({ type: 'error', title, body });
        }
    };

    return (
        <AdminPageShell
            title="API COVERAGE"
            subtitle="Direct runners for zones, points, announcements, and shop endpoints."
        >
            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">
                    INPUTS
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                    <input value={zoneIdentifier} onChange={(e) => setZoneIdentifier(e.target.value)} placeholder="zone short_name or uuid" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                    <input value={participantId} onChange={(e) => setParticipantId(e.target.value)} placeholder="participant_id uuid" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                    <input value={announcementId} onChange={(e) => setAnnouncementId(e.target.value)} placeholder="announcement_id uuid" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                    <input value={shopItemId} onChange={(e) => setShopItemId(e.target.value)} placeholder="shop item_id uuid" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                    <input value={redemptionId} onChange={(e) => setRedemptionId(e.target.value)} placeholder="redemption_id uuid" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                    <input value={idempotencyKey} onChange={(e) => setIdempotencyKey(e.target.value)} placeholder="idempotency key" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                    <input value={scannerDeviceId} onChange={(e) => setScannerDeviceId(e.target.value)} placeholder="scanner_device_id" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                    <input value={qrToken} onChange={(e) => setQrToken(e.target.value)} placeholder="zone qr token" className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]" />
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">ZONES</div>
                <div className="grid md:grid-cols-3 gap-2">
                    <GhostButton onClick={() => void run('ZONES LIST', () => zonesApi.list())}>LIST ZONES</GhostButton>
                    <GhostButton onClick={() => void run('ZONE GET', () => zonesApi.get(zoneIdentifier))} disabled={!zoneIdentifier}>GET ZONE</GhostButton>
                    <GhostButton onClick={() => void run('EVENT REGISTER', () => zonesApi.register(zoneIdentifier))} disabled={!zoneIdentifier}>REGISTER</GhostButton>
                    <GhostButton onClick={() => void run('ZONE UNREGISTER', () => zonesApi.unregister(zoneIdentifier))} disabled={!zoneIdentifier}>UNREGISTER</GhostButton>
                    <GhostButton onClick={() => void run('MY REGISTRATIONS', () => zonesApi.myRegistrations())}>MY REGISTRATIONS</GhostButton>
                    <GhostButton onClick={() => void run('MY PASSES', () => zonesApi.myPasses())}>MY PASSES</GhostButton>
                    <GhostButton
                        onClick={() => void run('ZONE SCAN CHECK-IN', () => zonesApi.adminScanCheckIn({
                            qrToken,
                            scannerDeviceId,
                            scannedAt: new Date().toISOString(),
                        }, `${idempotencyKey}-scan`))}
                        disabled={!qrToken || !scannerDeviceId}
                    >
                        SCAN CHECK-IN
                    </GhostButton>
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">POINTS</div>
                <div className="grid md:grid-cols-3 gap-2">
                    <GhostButton onClick={() => void run('POINTS ME', () => pointsApi.me())}>POINTS /ME</GhostButton>
                    <GhostButton onClick={() => void run('POINTS LEADERBOARD', () => pointsApi.leaderboard())}>LEADERBOARD</GhostButton>
                    <GhostButton onClick={() => void run('POINTS LEADERBOARD ME', () => pointsApi.leaderboardMe())}>LEADERBOARD /ME</GhostButton>
                    <GhostButton
                        onClick={() => void run('POINTS AWARD', () => pointsApi.award({
                            participant_id: participantId,
                            amount: 10,
                            reason: 'manual_award',
                            idempotency_key: `${idempotencyKey}-award`,
                            note: 'Awarded from admin console',
                        }))}
                        disabled={!participantId}
                    >
                        AWARD +10
                    </GhostButton>
                    <GhostButton
                        onClick={() => void run('POINTS TRANSACTIONS', () => {
                            const q = new URLSearchParams({ limit: '100' });
                            if (participantId) q.set('participant_id', participantId);
                            return pointsApi.transactions(q);
                        })}
                    >
                        TRANSACTIONS
                    </GhostButton>
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">ANNOUNCEMENTS</div>
                <div className="grid md:grid-cols-3 gap-2">
                    <GhostButton onClick={() => void run('ANN LIST', () => announcementsApi.list())}>LIST</GhostButton>
                    <GhostButton onClick={() => void run('ANN GET', () => announcementsApi.get(announcementId))} disabled={!announcementId}>GET</GhostButton>
                    <GhostButton
                        onClick={() => void run('ANN CREATE', () => announcementsApi.create({
                            title: `Ops Test ${new Date().toISOString().slice(11, 19)}`,
                            body: 'Created from Admin API Coverage page.',
                            priority: 'info',
                            is_pinned: false,
                        }))}
                    >
                        CREATE
                    </GhostButton>
                    <GhostButton
                        onClick={() => void run('ANN UPDATE', () => announcementsApi.update(announcementId, {
                            title: 'Updated title from portal',
                            is_pinned: true,
                        }))}
                        disabled={!announcementId}
                    >
                        UPDATE
                    </GhostButton>
                    <GhostButton onClick={() => void run('ANN DELETE', () => announcementsApi.remove(announcementId))} disabled={!announcementId}>DELETE</GhostButton>
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">SHOP</div>
                <div className="grid md:grid-cols-3 gap-2">
                    <GhostButton onClick={() => void run('SHOP LIST', () => shopApi.list())}>LIST ITEMS</GhostButton>
                    <GhostButton onClick={() => void run('SHOP GET', () => shopApi.get(shopItemId))} disabled={!shopItemId}>GET ITEM</GhostButton>
                    <GhostButton
                        onClick={() => void run('SHOP CREATE', () => shopApi.create({
                            name: `Debug Item ${new Date().toISOString().slice(11, 19)}`,
                            description: 'Created from admin API coverage.',
                            point_cost: 25,
                            stock: 20,
                            photo_key: null,
                        }))}
                    >
                        CREATE ITEM
                    </GhostButton>
                    <GhostButton
                        onClick={() => void run('SHOP UPDATE', () => shopApi.update(shopItemId, {
                            point_cost: 30,
                            is_active: true,
                        }))}
                        disabled={!shopItemId}
                    >
                        UPDATE ITEM
                    </GhostButton>
                    <GhostButton
                        onClick={() => void run('SHOP REDEEM', () => shopApi.redeem(shopItemId, {
                            idempotency_key: `${idempotencyKey}-redeem`,
                        }))}
                        disabled={!shopItemId}
                    >
                        REDEEM
                    </GhostButton>
                    <GhostButton onClick={() => void run('SHOP MY REDEMPTIONS', () => shopApi.myRedemptions())}>MY REDEMPTIONS</GhostButton>
                    <GhostButton onClick={() => void run('SHOP REDEMPTIONS', () => shopApi.redemptions())}>ALL REDEMPTIONS</GhostButton>
                    <GhostButton
                        onClick={() => void run('SHOP FULFILL', () => shopApi.fulfill(redemptionId, {
                            fulfillment_notes: 'Fulfilled from admin portal',
                        }))}
                        disabled={!redemptionId}
                    >
                        FULFILL
                    </GhostButton>
                    <GhostButton
                        onClick={() => void run('SHOP RETURN', () => apiFetch(`/api/v1/shop/redemptions/${encodeURIComponent(redemptionId)}/return`, {
                            method: 'PATCH',
                            json: {
                                idempotency_key: `${idempotencyKey}-return`,
                                return_notes: 'Returned from admin portal',
                            },
                        }))}
                        disabled={!redemptionId}
                    >
                        RETURN
                    </GhostButton>
                </div>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">
                    API OUTPUT
                </div>
                <pre className="text-[10px] font-portal-mono text-[color-mix(in_srgb,var(--dim)_90%,white_5%)] overflow-auto max-h-80 p-3 border border-[var(--border-dim)] bg-[var(--bg)]">
                    {output}
                </pre>
                <PrimaryButton className="mt-3" onClick={() => setOutput('Ready.')}>CLEAR OUTPUT</PrimaryButton>
            </PortalCard>
        </AdminPageShell>
    );
}
