import { useEffect, useMemo, useState } from 'react';
import PortalPage from '../components/PortalPage';
import { PortalCard, SectionLabel, ZoneTag } from '../components/primitives';
import { useAnnouncementStore } from '../stores/announcementStore';

const FILTERS = ['ALL', 'URGENT', 'UPDATE', 'INFO', 'GENERAL'] as const;
type Filter = (typeof FILTERS)[number];

export default function AnnouncementsPage() {
    const announcements = useAnnouncementStore((state) => state.announcements);
    const markAllRead = useAnnouncementStore((state) => state.markAllRead);
    const highlightedId = useAnnouncementStore((state) => state.highlightedAnnouncementId);
    const setHighlighted = useAnnouncementStore((state) => state.setHighlightedAnnouncement);
    const [filter, setFilter] = useState<Filter>('ALL');

    useEffect(() => {
        const id = window.setTimeout(() => markAllRead(), 400);
        return () => clearTimeout(id);
    }, [markAllRead]);

    useEffect(() => () => setHighlighted(null), [setHighlighted]);

    const filtered = useMemo(() => {
        if (filter === 'ALL') return announcements;
        if (filter === 'URGENT') return announcements.filter((item) => item.priority === 'URGENT');
        if (filter === 'UPDATE') return announcements.filter((item) => item.priority === 'UPDATE');
        if (filter === 'INFO') return announcements.filter((item) => item.priority === 'INFO');
        return announcements.filter((item) => item.priority === 'GENERAL' || item.category === 'GENERAL');
    }, [announcements, filter]);

    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-3xl mx-auto">
            <div data-portal-header>
                <SectionLabel>-- COMMAND UPDATES --</SectionLabel>
                <div className="font-portal-display text-[clamp(30px,8vw,36px)] leading-none text-[var(--fg)] mt-2">
                    ANNOUNCEMENTS
                </div>
                <div className="font-portal-mono text-[10px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_70%,white_8%)] mt-1">
                    Live updates from RECON command team
                </div>

                <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                    {FILTERS.map((item) => (
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

            <div className="mt-4 space-y-3" data-portal-card>
                {filtered.map((item) => {
                    const urgent = item.priority === 'URGENT';
                    const isHighlighted = highlightedId === item.id;

                    return (
                        <PortalCard
                            key={item.id}
                            className={`px-4 sm:px-5 py-4 sm:py-5 ${
                                urgent
                                    ? 'border-l-[3px] border-l-[var(--portal-red)] bg-[color-mix(in_srgb,var(--portal-red)_4%,var(--surface))]'
                                    : ''
                            } ${isHighlighted ? 'border-[var(--amber)]' : ''}`}
                        >
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                                <div className="flex gap-2 flex-wrap">
                                    <ZoneTag
                                        className={
                                            item.priority === 'URGENT'
                                                ? 'border-[var(--portal-red)] text-[var(--portal-red)]'
                                                : item.priority === 'INFO'
                                                  ? 'border-[var(--portal-blue)] text-[var(--portal-blue)]'
                                                  : item.priority === 'UPDATE'
                                                    ? 'border-[var(--amber)] text-[var(--amber)]'
                                                    : 'border-[var(--border)] text-[color-mix(in_srgb,var(--dim)_72%,white_6%)]'
                                        }
                                    >
                                        {item.priority}
                                    </ZoneTag>
                                    <ZoneTag>{item.category}</ZoneTag>
                                </div>
                                <div className="font-portal-mono text-[8px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_58%,white_8%)] uppercase">
                                    {item.timeLabel}
                                </div>
                            </div>

                            <div className="font-portal-mono text-[13px] tracking-[0.08em] text-[var(--fg)] uppercase">
                                {item.title}
                            </div>
                            <div className="font-portal-body text-[13px] leading-[1.7] text-[color-mix(in_srgb,var(--dim)_72%,white_8%)] mt-2">
                                {item.body}
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <div className="font-portal-mono text-[8px] tracking-[0.1em] text-[color-mix(in_srgb,var(--dim)_58%,white_8%)] uppercase">
                                    Posted by: {item.postedBy}
                                </div>
                                {item.unread && <span className="size-1.5 rounded-full bg-[var(--amber)]" />}
                            </div>
                        </PortalCard>
                    );
                })}
                {filtered.length === 0 && (
                    <PortalCard className="px-4 sm:px-5 py-8">
                        <div className="font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[color-mix(in_srgb,var(--dim)_72%,white_8%)]">
                            No active announcements
                        </div>
                        <div className="font-portal-body text-[13px] leading-[1.7] text-[color-mix(in_srgb,var(--dim)_72%,white_8%)] mt-2">
                            The live feed is empty right now or this filter has no matching updates.
                        </div>
                    </PortalCard>
                )}
            </div>
        </PortalPage>
    );
}
