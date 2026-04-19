import { useCallback, useEffect, useState } from 'react';
import { partnersApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';

type Any = Record<string, unknown>;

const SPONSORSHIP = ['monetary', 'in_kind', 'hybrid'] as const;
const STATUS_FILTER = ['pending_review', 'approved', 'rejected'] as const;
const REVIEW_STATUS = ['pending_review', 'approved', 'rejected'] as const;
const INCENTIVE_TYPES = ['monetary', 'in_kind'] as const;
const ASSET_TYPES = ['logo', 'banner', 'social_post', 'video', 'document', 'other'] as const;

export default function AdminPartnersPage() {
    const addToast = useToastStore((s) => s.addToast);
    const roleName = useAuthStore((s) => s.user?.role?.name?.toLowerCase());

    const [partners, setPartners] = useState<Any[]>([]);
    const [filter, setFilter] = useState<(typeof STATUS_FILTER)[number] | ''>('');
    const [selectedPartner, setSelectedPartner] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewStatus, setReviewStatus] = useState<(typeof REVIEW_STATUS)[number]>('approved');

    const [coName, setCoName] = useState('');
    const [coWeb, setCoWeb] = useState('');
    const [coContact, setCoContact] = useState('');
    const [coEmail, setCoEmail] = useState('');
    const [coType, setCoType] = useState<(typeof SPONSORSHIP)[number]>('monetary');
    const [coWriteup, setCoWriteup] = useState('');

    const [incTitle, setIncTitle] = useState('');
    const [incType, setIncType] = useState<(typeof INCENTIVE_TYPES)[number]>('in_kind');
    const [incValue, setIncValue] = useState('');
    const [incDesc, setIncDesc] = useState('');

    const [editIncId, setEditIncId] = useState('');
    const [assetKey, setAssetKey] = useState('');
    const [assetType, setAssetType] = useState<(typeof ASSET_TYPES)[number]>('logo');
    const [assetLabel, setAssetLabel] = useState('');

    const loadPartners = useCallback(async () => {
        try {
            const list = await partnersApi.list();
            setPartners(Array.isArray(list) ? list : []);
        } catch (err) {
            addToast({ type: 'error', title: 'LIST FAILED', body: getApiErrorMessage(err, 'Could not list partners.') });
        }
    }, [addToast]);

    useEffect(() => {
        void loadPartners();
    }, [loadPartners]);

    const filtered = filter
        ? partners.filter((p) => String((p as { status?: string }).status) === filter)
        : partners;

    const onApply = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await partnersApi.apply({
                company_name: coName.trim(),
                company_website: coWeb.trim() || null,
                contact_name: coContact.trim(),
                contact_email: coEmail.trim(),
                sponsorship_type: coType,
                offering_writeup: coWriteup.trim(),
                incentives: [],
            });
            addToast({ type: 'success', title: 'APPLICATION SENT', body: coName });
            setCoName('');
            setCoWeb('');
            setCoContact('');
            setCoEmail('');
            setCoWriteup('');
            await loadPartners();
        } catch (err) {
            addToast({ type: 'error', title: 'APPLY FAILED', body: getApiErrorMessage(err, 'Apply failed.') });
        }
    };

    const onReview = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = selectedPartner.trim();
        if (!id) return;
        try {
            await partnersApi.review(id, {
                status: reviewStatus,
                review_notes: reviewNotes.trim() || null,
            });
            addToast({ type: 'success', title: 'REVIEW SAVED', body: id });
            await loadPartners();
        } catch (err) {
            addToast({ type: 'error', title: 'REVIEW FAILED', body: getApiErrorMessage(err, 'Review failed.') });
        }
    };

    const onAddIncentive = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Record<string, unknown> = {
                title: incTitle.trim(),
                incentive_type: incType,
                description: incDesc.trim() || null,
                display_order: 0,
            };
            if (incValue.trim()) payload.monetary_value = incValue.trim();
            await partnersApi.addIncentive(payload);
            addToast({ type: 'success', title: 'INCENTIVE ADDED', body: incTitle });
            setIncTitle('');
            setIncDesc('');
            setIncValue('');
        } catch (err) {
            addToast({ type: 'error', title: 'FAILED', body: getApiErrorMessage(err, 'Partner role required.') });
        }
    };

    const onRemoveIncentive = async () => {
        if (!editIncId.trim()) return;
        try {
            await partnersApi.removeIncentive(editIncId.trim());
            addToast({ type: 'success', title: 'REMOVED', body: editIncId });
            setEditIncId('');
        } catch (err) {
            addToast({ type: 'error', title: 'FAILED', body: getApiErrorMessage(err, 'Remove failed.') });
        }
    };

    const onAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await partnersApi.addAsset({
                file_key: assetKey.trim(),
                asset_type: assetType,
                label: assetLabel.trim(),
            });
            addToast({ type: 'success', title: 'ASSET ADDED', body: assetLabel });
            setAssetKey('');
            setAssetLabel('');
        } catch (err) {
            addToast({ type: 'error', title: 'FAILED', body: getApiErrorMessage(err, 'Partner + approval required.') });
        }
    };

    const isPartner = roleName === 'partner';

    return (
        <AdminPageShell
            title="PARTNERS"
            subtitle="Applications (any authenticated user), directory & review (admin), incentives & assets (partner)."
        >
            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">APPLY AS PARTNER</div>
                <form onSubmit={onApply} className="grid gap-2">
                    <input
                        placeholder="company name"
                        value={coName}
                        onChange={(e) => setCoName(e.target.value)}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                        required
                    />
                    <input
                        placeholder="website"
                        value={coWeb}
                        onChange={(e) => setCoWeb(e.target.value)}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                    />
                    <div className="grid sm:grid-cols-2 gap-2">
                        <input
                            placeholder="contact name"
                            value={coContact}
                            onChange={(e) => setCoContact(e.target.value)}
                            className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                            required
                        />
                        <input
                            type="email"
                            placeholder="contact email"
                            value={coEmail}
                            onChange={(e) => setCoEmail(e.target.value)}
                            className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                            required
                        />
                    </div>
                    <select
                        value={coType}
                        onChange={(e) => setCoType(e.target.value as (typeof SPONSORSHIP)[number])}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                    >
                        {SPONSORSHIP.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <textarea
                        placeholder="offering writeup"
                        value={coWriteup}
                        onChange={(e) => setCoWriteup(e.target.value)}
                        rows={4}
                        className="bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-2 font-portal-mono text-[12px]"
                        required
                    />
                    <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                        SUBMIT APPLICATION
                    </PrimaryButton>
                </form>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">ADMIN DIRECTORY</span>
                    <div className="flex gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as (typeof STATUS_FILTER)[number] | '')}
                            className="min-h-9 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[10px]"
                        >
                            <option value="">all statuses</option>
                            {STATUS_FILTER.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <GhostButton type="button" className="!w-auto min-h-9 px-3" onClick={() => void loadPartners()}>
                            REFRESH
                        </GhostButton>
                    </div>
                </div>
                <div className="max-h-48 overflow-auto border border-[var(--border-dim)] mb-4">
                    {filtered.map((p) => (
                        <button
                            key={String(p.id)}
                            type="button"
                            className={`w-full text-left px-3 py-2 font-portal-mono text-[11px] hover:bg-[var(--surface)] ${
                                String(p.id) === selectedPartner ? 'bg-[var(--surface-2)] text-[var(--amber)]' : ''
                            }`}
                            onClick={() => setSelectedPartner(String(p.id))}
                        >
                            {String((p as { company_name?: string }).company_name)} · {String((p as { status?: string }).status)}
                        </button>
                    ))}
                </div>
                <form onSubmit={onReview} className="grid gap-2">
                    <input
                        placeholder="partner uuid"
                        value={selectedPartner}
                        onChange={(e) => setSelectedPartner(e.target.value)}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                    />
                    <select
                        value={reviewStatus}
                        onChange={(e) => setReviewStatus(e.target.value as (typeof REVIEW_STATUS)[number])}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                    >
                        {REVIEW_STATUS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <textarea
                        placeholder="review notes"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={2}
                        className="bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-2 font-portal-mono text-[12px]"
                    />
                    <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                        SAVE REVIEW
                    </PrimaryButton>
                </form>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-2">
                    PARTNER TOOLS
                </div>
                <p className="font-portal-body text-[11px] text-[color-mix(in_srgb,var(--dim)_85%,white_5%)] mb-4">
                    Incentives and assets require the <span className="font-portal-mono">partner</span> role. Your role:{' '}
                    <span className="text-[var(--amber)]">{roleName ?? '—'}</span>
                    {!isPartner && ' — API will return 403 if you are not a partner.'}
                </p>

                <form onSubmit={onAddIncentive} className="grid gap-2 mb-6 border-b border-[var(--border-dim)] pb-6">
                    <div className="font-portal-mono text-[9px] uppercase text-[var(--dim)]">Add incentive</div>
                    <input
                        placeholder="title"
                        value={incTitle}
                        onChange={(e) => setIncTitle(e.target.value)}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                        required
                    />
                    <select
                        value={incType}
                        onChange={(e) => setIncType(e.target.value as (typeof INCENTIVE_TYPES)[number])}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                    >
                        {INCENTIVE_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                    <input
                        placeholder="monetary_value (decimal, optional)"
                        value={incValue}
                        onChange={(e) => setIncValue(e.target.value)}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                    />
                    <textarea
                        placeholder="description"
                        value={incDesc}
                        onChange={(e) => setIncDesc(e.target.value)}
                        rows={2}
                        className="bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-2 font-portal-mono text-[12px]"
                    />
                    <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                        ADD INCENTIVE
                    </PrimaryButton>
                    <div className="flex gap-2 items-center">
                        <input
                            placeholder="incentive uuid to remove"
                            value={editIncId}
                            onChange={(e) => setEditIncId(e.target.value)}
                            className="flex-1 min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[11px]"
                        />
                        <GhostButton type="button" className="!w-auto min-h-10 px-4" onClick={() => void onRemoveIncentive()}>
                            REMOVE
                        </GhostButton>
                    </div>
                </form>

                <form onSubmit={onAddAsset} className="grid gap-2">
                    <div className="font-portal-mono text-[9px] uppercase text-[var(--dim)]">Upload asset (after you have file_key from storage)</div>
                    <input
                        placeholder="file_key"
                        value={assetKey}
                        onChange={(e) => setAssetKey(e.target.value)}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                        required
                    />
                    <select
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as (typeof ASSET_TYPES)[number])}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                    >
                        {ASSET_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                    <input
                        placeholder="label"
                        value={assetLabel}
                        onChange={(e) => setAssetLabel(e.target.value)}
                        className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                        required
                    />
                    <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                        REGISTER ASSET
                    </PrimaryButton>
                </form>
            </PortalCard>
        </AdminPageShell>
    );
}
