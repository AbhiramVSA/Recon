import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ZoneQrCode } from '../lib/types';
import { ZONES } from '../lib/data';
import { ApiError } from '../api/client';
import {
    createEventRegistration,
    fetchMyPasses,
    fetchMyRegistrations,
    fetchRegistrationQr,
    fetchZonesCatalog,
    type BackendEventRegistrationQr,
    type BackendMyPasses,
    type BackendMyRegistrations,
    type BackendZoneCatalogItem,
    type BackendZonePass,
} from '../api/zones';
import { zonesApi } from '../../api/backend';

interface ZoneState {
    registeredZones: string[];
    qrCodes: ZoneQrCode[];
    hydrated: boolean;
    hydrateZones: () => Promise<void>;
    registerZone: (zoneId: string) => Promise<ZoneQrCode>;
    refreshZonePass: (zoneId: string) => Promise<ZoneQrCode | null>;
    unregisterZone: (zoneId: string) => Promise<void>;
    resetZones: () => void;
}

const baseState = {
    registeredZones: [] as string[],
    qrCodes: [] as ZoneQrCode[],
    hydrated: false,
};

type ZoneRegistrationTarget = {
    zoneId: string;
    eventId: string;
};

function normalizeZoneKey(value: string) {
    return value.trim().toLowerCase();
}

function resolveZoneRegistrationTarget(
    zoneIdentifier: string,
    catalog: BackendZoneCatalogItem[],
): ZoneRegistrationTarget | null {
    const normalized = normalizeZoneKey(zoneIdentifier);
    if (!normalized) return null;

    const liveZone = catalog.find((item) => {
        const itemId = normalizeZoneKey(String(item.id));
        const itemShortName = normalizeZoneKey(String(item.shortName));
        const itemName = normalizeZoneKey(String(item.name));
        return itemId === normalized || itemShortName === normalized || itemName === normalized;
    });
    if (liveZone) {
        return {
            zoneId: String(liveZone.id),
            eventId: String(liveZone.shortName),
        };
    }

    const fallbackZone = ZONES.find((item) => {
        const itemId = normalizeZoneKey(String(item.id));
        const itemShortName = normalizeZoneKey(String(item.shortName));
        const itemName = normalizeZoneKey(String(item.name));
        return itemId === normalized || itemShortName === normalized || itemName === normalized;
    });
    if (fallbackZone) {
        return {
            zoneId: String(fallbackZone.id),
            eventId: String(fallbackZone.shortName),
        };
    }

    return null;
}

function normalizePasses(
    registrations: BackendMyRegistrations,
    passes: BackendMyPasses,
    catalog: BackendZoneCatalogItem[],
    qrRegistrations: BackendEventRegistrationQr[],
): ZoneQrCode[] {
    const activeZoneIds = new Set(
        Array.isArray(registrations.zoneIds) ? registrations.zoneIds.map((id) => String(id)) : [],
    );
    const passMap = new Map<string, BackendZonePass>(
        (Array.isArray(passes.passes) ? passes.passes : []).map((pass) => [String(pass.zoneId), pass]),
    );
    const zoneShortNameById = new Map(catalog.map((zone) => [String(zone.id), zone.shortName]));
    const qrByEventId = new Map(qrRegistrations.map((registration) => [registration.eventId, registration]));

    return Array.from(activeZoneIds).flatMap((zoneId) => {
        const pass = passMap.get(zoneId);
        const eventId = zoneShortNameById.get(zoneId);
        if (!pass || !eventId) return [];

        const qr = qrByEventId.get(eventId);
        if (!qr) return [];

        const checkedInAt = pass.checkedInAt ?? undefined;
        return [{
            zoneId,
            registrationId: qr.registrationId,
            code: String(pass.code),
            qrToken: qr.qrToken,
            qrExpiresAt: qr.qrExpiresAt,
            isActive: Boolean(pass.isActive),
            checkedIn: !pass.isActive || Boolean(checkedInAt),
            checkedInAt,
        }];
    });
}

export const useZoneStore = create<ZoneState>()(
    persist(
        (set, get) => ({
            ...baseState,
            hydrateZones: async () => {
                const [registrationsRes, passesRes, catalog] = await Promise.all([
                    fetchMyRegistrations(),
                    fetchMyPasses(),
                    fetchZonesCatalog(),
                ]);
                const registeredZones = Array.isArray(registrationsRes.zoneIds)
                    ? registrationsRes.zoneIds.map((id) => String(id))
                    : [];
                const qrRegistrations = await Promise.all(
                    catalog
                        .filter((zone) => registeredZones.includes(String(zone.id)))
                        .map((zone) => createEventRegistration(zone.shortName)),
                );
                const qrCodes = normalizePasses(registrationsRes, passesRes, catalog, qrRegistrations);
                set({
                    registeredZones,
                    qrCodes,
                    hydrated: true,
                });
            },
            registerZone: async (zoneId) => {
                const catalog = await fetchZonesCatalog().catch(() => []);
                const target = resolveZoneRegistrationTarget(zoneId, catalog);
                if (!target) {
                    throw new ApiError('Zone not found in catalog.', 404, null);
                }
                const registration = await createEventRegistration(target.eventId);

                try {
                    await get().hydrateZones();
                } catch {
                    const provisionalPass: ZoneQrCode = {
                        zoneId: target.zoneId,
                        registrationId: registration.registrationId,
                        code: target.eventId,
                        qrToken: registration.qrToken,
                        qrExpiresAt: registration.qrExpiresAt,
                        isActive: true,
                        checkedIn: false,
                    };
                    set((state) => ({
                        registeredZones: state.registeredZones.includes(target.zoneId)
                            ? state.registeredZones
                            : [...state.registeredZones, target.zoneId],
                        qrCodes: [
                            ...state.qrCodes.filter((q) => q.zoneId !== target.zoneId),
                            provisionalPass,
                        ],
                    }));
                    return provisionalPass;
                }

                const pass = get().qrCodes.find(
                    (q) => q.zoneId === target.zoneId || q.registrationId === registration.registrationId,
                );
                if (!pass) {
                    throw new ApiError('Registration succeeded but no pass returned.', 500, null);
                }
                return pass;
            },
            refreshZonePass: async (zoneId) => {
                const current = get().qrCodes.find((code) => code.zoneId === zoneId);
                if (!current) return null;

                const refreshed = await fetchRegistrationQr(current.registrationId);
                let nextPass: ZoneQrCode | null = null;

                set((state) => ({
                    qrCodes: state.qrCodes.map((code) => {
                        if (code.zoneId !== zoneId) return code;
                        nextPass = {
                            ...code,
                            registrationId: refreshed.registrationId,
                            qrToken: refreshed.qrToken,
                            qrExpiresAt: refreshed.qrExpiresAt,
                        };
                        return nextPass;
                    }),
                }));

                return nextPass;
            },
            unregisterZone: async (zoneId) => {
                await zonesApi.unregister(zoneId);
                await get().hydrateZones();
            },
            resetZones: () => set({ ...baseState }),
        }),
        {
            name: 'recon-portal-zones',
        },
    ),
);
