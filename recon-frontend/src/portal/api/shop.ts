import { apiFetch } from './client';
import { storageApi } from '../../api/backend';

export interface BackendShopItem {
    id: string;
    name: string;
    description: string;
    point_cost: number;
    stock?: number | null;
    remaining_stock?: number | null;
    is_active: boolean;
    photo_key?: string | null;
    image?: string | null;
    created_at: string;
    updated_at: string;
}

export interface BackendRedemption {
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
    created_at: string;
}

export async function fetchShopItems() {
    const items = await apiFetch<BackendShopItem[]>('/api/v1/shop');
    const enriched = await Promise.all(
        items.map(async (item) => {
            if (!item.photo_key) {
                return {
                    ...item,
                    image: null,
                };
            }
            try {
                const read = await storageApi.readUrl(item.photo_key) as { read_url?: string };
                return {
                    ...item,
                    image: read.read_url ?? null,
                };
            } catch {
                return {
                    ...item,
                    image: null,
                };
            }
        }),
    );
    return enriched;
}

export async function redeemShopItem(itemId: string, idempotencyKey?: string) {
    return apiFetch<BackendRedemption>(`/api/v1/shop/${encodeURIComponent(itemId)}/redeem`, {
        method: 'POST',
        json: {
            idempotency_key: idempotencyKey ?? globalThis.crypto?.randomUUID?.() ?? `redeem-${Date.now()}`,
        },
    });
}

export async function fetchMyRedemptions() {
    return apiFetch<BackendRedemption[]>('/api/v1/shop/me/redemptions');
}

