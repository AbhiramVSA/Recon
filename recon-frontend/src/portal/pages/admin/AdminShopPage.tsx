import { useCallback, useEffect, useMemo, useState } from 'react';
import { shopApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton, StatusPill } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

type ShopItemRow = {
    id: string;
    name: string;
    description: string;
    point_cost: number;
    stock?: number | null;
    remaining_stock?: number | null;
    is_active: boolean;
    photo_key?: string | null;
};

type RedemptionRow = {
    id: string;
    participant_id: string;
    participant_display_name?: string | null;
    participant_email?: string | null;
    participant_username?: string | null;
    item_id: string;
    item_name: string;
    point_cost: number;
    redeemed_at: string;
    fulfilled_at?: string | null;
    fulfillment_notes?: string | null;
    returned_at?: string | null;
    return_notes?: string | null;
};

function makeIdempotencyKey(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminShopPage() {
    const addToast = useToastStore((s) => s.addToast);
    const [items, setItems] = useState<ShopItemRow[]>([]);
    const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingItem, setSavingItem] = useState(false);
    const [actingRedemptionId, setActingRedemptionId] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [redemptionFilter, setRedemptionFilter] = useState<'all' | 'fulfilled' | 'returned' | 'pending'>('pending');

    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemPointCost, setItemPointCost] = useState('100');
    const [itemStock, setItemStock] = useState('10');
    const [itemPhotoKey, setItemPhotoKey] = useState('');
    const [itemActive, setItemActive] = useState(true);

    const [fulfillmentNotes, setFulfillmentNotes] = useState('Fulfilled from admin ops');
    const [returnNotes, setReturnNotes] = useState('Returned from admin ops');

    const selectedItem = useMemo(
        () => items.find((item) => item.id === selectedItemId) ?? null,
        [items, selectedItemId],
    );

    const hydrateItem = useCallback((item: ShopItemRow | null) => {
        if (!item) {
            setSelectedItemId('');
            setItemName('');
            setItemDescription('');
            setItemPointCost('100');
            setItemStock('10');
            setItemPhotoKey('');
            setItemActive(true);
            return;
        }
        setSelectedItemId(item.id);
        setItemName(item.name);
        setItemDescription(item.description);
        setItemPointCost(String(item.point_cost));
        setItemStock(item.stock == null ? '' : String(item.stock));
        setItemPhotoKey(item.photo_key ?? '');
        setItemActive(Boolean(item.is_active));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [itemList, redemptionList] = await Promise.all([
                shopApi.list(),
                shopApi.redemptions(),
            ]);
            setItems(Array.isArray(itemList) ? itemList as ShopItemRow[] : []);
            setRedemptions(Array.isArray(redemptionList) ? redemptionList as RedemptionRow[] : []);
        } catch (err) {
            addToast({ type: 'error', title: 'LOAD FAILED', body: getApiErrorMessage(err, 'Could not load shop operations.') });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void load();
    }, [load]);

    const sortedRedemptions = useMemo(
        () =>
            [...redemptions].sort(
                (a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime(),
            ),
        [redemptions],
    );

    const filteredRedemptions = useMemo(() => {
        if (redemptionFilter === 'all') return sortedRedemptions;
        if (redemptionFilter === 'fulfilled') {
            return sortedRedemptions.filter((row) => Boolean(row.fulfilled_at) && !row.returned_at);
        }
        if (redemptionFilter === 'returned') {
            return sortedRedemptions.filter((row) => Boolean(row.returned_at));
        }
        return sortedRedemptions.filter((row) => !row.fulfilled_at && !row.returned_at);
    }, [redemptionFilter, sortedRedemptions]);

    const pendingRedemptionsCount = useMemo(
        () => redemptions.filter((row) => !row.fulfilled_at && !row.returned_at).length,
        [redemptions],
    );

    const buildBaseItemPayload = () => {
        const name = itemName.trim();
        const description = itemDescription.trim();
        const pointCost = Number(itemPointCost);
        const stock = itemStock.trim() === '' ? null : Number(itemStock);

        if (!name) {
            throw new Error('Item name is required.');
        }
        if (!description) {
            throw new Error('Item description is required.');
        }
        if (!Number.isFinite(pointCost) || pointCost < 1 || !Number.isInteger(pointCost)) {
            throw new Error('Point cost must be a whole number >= 1.');
        }
        if (stock != null && (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock))) {
            throw new Error('Stock must be a whole number >= 0, or blank for unlimited.');
        }

        return {
            name,
            description,
            point_cost: pointCost,
            stock,
            photo_key: itemPhotoKey.trim() || null,
        };
    };

    const onCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setSavingItem(true);
        try {
            const created = await shopApi.create(buildBaseItemPayload()) as ShopItemRow;
            addToast({ type: 'success', title: 'ITEM CREATED', body: created.name });
            await load();
            hydrateItem(created);
        } catch (err) {
            addToast({ type: 'error', title: 'CREATE FAILED', body: getApiErrorMessage(err, 'Could not create item.') });
        } finally {
            setSavingItem(false);
        }
    };

    const onUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedItemId) return;
        setSavingItem(true);
        try {
            const updated = await shopApi.update(selectedItemId, {
                ...buildBaseItemPayload(),
                is_active: itemActive,
            }) as ShopItemRow;
            addToast({ type: 'success', title: 'ITEM UPDATED', body: updated.name });
            await load();
            hydrateItem(updated);
        } catch (err) {
            addToast({ type: 'error', title: 'UPDATE FAILED', body: getApiErrorMessage(err, 'Could not update item.') });
        } finally {
            setSavingItem(false);
        }
    };

    const onFulfill = async (redemptionId: string) => {
        setActingRedemptionId(redemptionId);
        try {
            await shopApi.fulfill(redemptionId, { fulfillment_notes: fulfillmentNotes.trim() || null });
            addToast({ type: 'success', title: 'REDEMPTION FULFILLED', body: redemptionId });
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'FULFILL FAILED', body: getApiErrorMessage(err, 'Could not fulfill redemption.') });
        } finally {
            setActingRedemptionId(null);
        }
    };

    const onReturn = async (redemptionId: string) => {
        setActingRedemptionId(redemptionId);
        try {
            await shopApi.returnRedemption(redemptionId, {
                idempotency_key: makeIdempotencyKey('shop-return'),
                return_notes: returnNotes.trim() || null,
            });
            addToast({ type: 'success', title: 'REDEMPTION RETURNED', body: redemptionId });
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'RETURN FAILED', body: getApiErrorMessage(err, 'Could not return redemption.') });
        } finally {
            setActingRedemptionId(null);
        }
    };

    return (
        <AdminPageShell
            title="SHOP OPS"
            subtitle="Admin item management plus fulfillment and returns for live redemptions."
        >
            <PortalCard className="p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        CATALOG ({loading ? '…' : items.length})
                    </span>
                    <GhostButton type="button" className="!w-auto min-h-9 px-4" onClick={() => void load()}>
                        REFRESH
                    </GhostButton>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                    {!loading && items.length === 0 && (
                        <div className="border border-[var(--border-dim)] px-4 py-4 font-portal-body text-[13px] text-[var(--dim)] lg:col-span-2">
                            No catalog items found. Create the first item below.
                        </div>
                    )}
                    {items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`text-left border px-4 py-4 transition-colors ${
                                item.id === selectedItemId
                                    ? 'border-[var(--amber)] bg-[var(--surface-2)]'
                                    : 'border-[var(--border-dim)] hover:border-[var(--amber)]'
                            }`}
                            onClick={() => hydrateItem(item)}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-portal-mono text-[11px] text-[var(--fg)]">{item.name}</div>
                                <StatusPill label={item.is_active ? 'active' : 'inactive'} tone={item.is_active ? 'green' : 'red'} />
                            </div>
                            <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-2">
                                {item.point_cost} pts · remaining {item.remaining_stock ?? '∞'}
                            </div>
                        </button>
                    ))}
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">
                    {selectedItemId ? 'EDIT ITEM' : 'CREATE ITEM'}
                </div>
                <form onSubmit={selectedItemId ? onUpdate : onCreate} className="grid gap-3">
                    <input
                        placeholder="item name"
                        value={itemName}
                        onChange={(event) => setItemName(event.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        required
                    />
                    <textarea
                        placeholder="item description"
                        value={itemDescription}
                        onChange={(event) => setItemDescription(event.target.value)}
                        className="min-h-28 bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-3 font-portal-body text-[13px] text-[var(--fg)]"
                        required
                    />
                    <div className="grid gap-3 md:grid-cols-3">
                        <input
                            type="number"
                            min={1}
                            value={itemPointCost}
                            onChange={(event) => setItemPointCost(event.target.value)}
                            className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                            placeholder="point cost"
                        />
                        <input
                            type="number"
                            min={0}
                            value={itemStock}
                            onChange={(event) => setItemStock(event.target.value)}
                            className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                            placeholder="stock"
                        />
                        <input
                            value={itemPhotoKey}
                            onChange={(event) => setItemPhotoKey(event.target.value)}
                            className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                            placeholder="photo key"
                        />
                    </div>
                    <label className="flex items-center gap-2 font-portal-mono text-[11px] text-[var(--fg)]">
                        <input type="checkbox" checked={itemActive} onChange={(event) => setItemActive(event.target.checked)} />
                        item is active
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <PrimaryButton type="submit" className="!w-auto min-h-10 px-6" disabled={savingItem}>
                            {selectedItemId ? 'SAVE ITEM' : 'CREATE ITEM'}
                        </PrimaryButton>
                        {selectedItemId && (
                            <GhostButton
                                type="button"
                                className="!w-auto min-h-10 px-6"
                                onClick={() => hydrateItem(null)}
                                disabled={savingItem}
                            >
                                RESET FORM
                            </GhostButton>
                        )}
                    </div>
                </form>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        {redemptionFilter === 'pending'
                            ? `AWAITING COLLECTION (${filteredRedemptions.length})`
                            : `REDEMPTIONS (${filteredRedemptions.length})`}
                    </span>
                    <select
                        value={redemptionFilter}
                        onChange={(event) => setRedemptionFilter(event.target.value as 'all' | 'fulfilled' | 'returned' | 'pending')}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px] text-[var(--fg)]"
                    >
                        <option value="all">all</option>
                        <option value="pending">pending</option>
                        <option value="fulfilled">fulfilled</option>
                        <option value="returned">returned</option>
                    </select>
                </div>
                <div className="font-portal-mono text-[10px] text-[var(--dim)] mb-4">
                    pending total: {pendingRedemptionsCount}
                </div>

                <div className="grid gap-3 md:grid-cols-2 mb-4">
                    <input
                        value={fulfillmentNotes}
                        onChange={(event) => setFulfillmentNotes(event.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        placeholder="fulfillment notes"
                    />
                    <input
                        value={returnNotes}
                        onChange={(event) => setReturnNotes(event.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        placeholder="return notes"
                    />
                </div>

                <div className="max-h-96 overflow-auto space-y-3">
                    {filteredRedemptions.length === 0 && (
                        <div className="border border-[var(--border-dim)] px-4 py-4 font-portal-body text-[13px] text-[var(--dim)]">
                            No redemptions match this filter.
                        </div>
                    )}
                    {filteredRedemptions.map((row) => (
                        <div key={row.id} className="border border-[var(--border-dim)] px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-portal-mono text-[11px] text-[var(--fg)]">{row.item_name}</div>
                                {row.returned_at ? (
                                    <StatusPill label="returned" tone="red" />
                                ) : row.fulfilled_at ? (
                                    <StatusPill label="fulfilled" tone="green" />
                                ) : (
                                    <StatusPill label="pending" tone="amber" />
                                )}
                            </div>
                            <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-2 leading-relaxed">
                                buyer {row.participant_display_name ?? row.participant_username ?? row.participant_id}
                                {row.participant_email ? ` · ${row.participant_email}` : ''}
                            </div>
                            <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-1 leading-relaxed">
                                redemption {row.id} · {row.point_cost} pts · redeemed {new Date(row.redeemed_at).toLocaleString()}
                            </div>
                            {row.fulfillment_notes ? (
                                <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-1 leading-relaxed">
                                    fulfill note: {row.fulfillment_notes}
                                </div>
                            ) : null}
                            {row.return_notes ? (
                                <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-1 leading-relaxed">
                                    return note: {row.return_notes}
                                </div>
                            ) : null}
                            <div className="flex flex-wrap gap-2 mt-3">
                                <GhostButton
                                    type="button"
                                    className="!w-auto min-h-9 px-4"
                                    onClick={() => void onFulfill(row.id)}
                                    disabled={Boolean(row.fulfilled_at) || Boolean(row.returned_at) || actingRedemptionId === row.id}
                                >
                                    {actingRedemptionId === row.id ? 'PROCESSING...' : 'FULFILL'}
                                </GhostButton>
                                <GhostButton
                                    type="button"
                                    className="!w-auto min-h-9 px-4 border-[var(--portal-red)] text-[var(--portal-red)]"
                                    onClick={() => void onReturn(row.id)}
                                    disabled={Boolean(row.returned_at) || actingRedemptionId === row.id}
                                >
                                    {actingRedemptionId === row.id ? 'PROCESSING...' : 'RETURN'}
                                </GhostButton>
                            </div>
                        </div>
                    ))}
                </div>
            </PortalCard>
        </AdminPageShell>
    );
}
