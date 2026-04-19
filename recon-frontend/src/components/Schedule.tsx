import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_DATE_RANGE_READABLE, schedule as fallbackSchedule } from '../data';
import { Section, Label } from './ui';
import ScrambleText from './ScrambleText';
import Seo from './Seo';
import { scheduleApi } from '../api/backend';

type ScheduleMap = Record<string, { time: string; title: string; description: string; accent?: boolean }[]>;

function getDayLabel(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Day 1';
    return `Day ${d.getDate()}`;
}

function getTimeLabel(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

const FALLBACK_DAYS = Object.keys(fallbackSchedule);

export default function Schedule() {
    const [scheduleMap, setScheduleMap] = useState<ScheduleMap>(fallbackSchedule);
    const [active, setActive] = useState(FALLBACK_DAYS[0]);

    const DAYS = useMemo(() => Object.keys(scheduleMap), [scheduleMap]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const sessions = await scheduleApi.listSessions();
                if (!alive || !Array.isArray(sessions) || sessions.length === 0) return;

                const next: ScheduleMap = {};
                sessions.forEach((session) => {
                    const startsAt = String(session.starts_at ?? '');
                    const day = getDayLabel(startsAt);
                    if (!next[day]) next[day] = [];
                    next[day].push({
                        time: getTimeLabel(startsAt),
                        title: String(session.title ?? 'Untitled Session'),
                        description: String(session.description ?? ''),
                        accent: String(session.session_type ?? '').toLowerCase().includes('competition'),
                    });
                });

                Object.values(next).forEach((items) => {
                    items.sort((a, b) => a.time.localeCompare(b.time));
                });

                setScheduleMap(next);
                const firstDay = Object.keys(next).sort()[0];
                if (firstDay) setActive(firstDay);
            } catch {
                // keep fallback schedule on fetch error
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    return (
        <>
            <Seo
                title="Schedule"
                description="3-day timeline for RECON 2026, including CTF and King of the Hill operations."
                path="/schedule"
            />
            <Section id="schedule" className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <Label>Schedule</Label>
                    <h1 className="font-display text-3xl md:text-4xl text-paper tracking-tight mb-3">
                        <ScrambleText text="Schedule" tag="span" speed={15} />
                    </h1>
                    <h2 className="font-display text-2xl md:text-3xl text-paper tracking-tight mb-8">
                        <ScrambleText text="3-Day " tag="span" speed={15} /><span className="text-paper/80">Operations Timeline</span>
                    </h2>
                    <p className="-mt-5 mb-8 font-mono text-[10px] tracking-[0.22em] uppercase text-cream/60">
                        {EVENT_DATE_RANGE_READABLE}
                    </p>

                {/* Day tabs */}
                <div className="inline-flex gap-1 mb-8 border border-edge">
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            onClick={() => setActive(day)}
                            className={`font-mono text-[11px] tracking-[0.2em] uppercase px-5 py-2 transition-colors duration-200 ${active === day
                                ? 'bg-paper text-void'
                                : 'text-muted hover:text-paper'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Timeline */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-0"
                    >
                        {(scheduleMap[active] || []).map((item, i) => (
                            <div
                                key={i}
                                className={`flex gap-4 md:gap-6 py-4 border-b border-edge/50 group hover:bg-panel/20 transition-colors px-2 ${item.accent ? 'border-l-2 border-l-paper/50' : ''
                                    }`}
                            >
                                <div className="font-mono text-xs tabular-nums text-faint w-12 shrink-0 pt-0.5">
                                    {item.time}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-display text-sm tracking-tight ${item.accent ? 'text-paper' : 'text-cream/80'}`}>
                                        {item.title}
                                    </div>
                                    <div className="font-body text-xs text-muted mt-0.5">{item.description}</div>
                                </div>
                                {item.accent && (
                                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-void bg-paper/80 px-2 py-0.5 self-start">
                                        LIVE
                                    </span>
                                )}
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
                </div>
            </Section>
        </>
    );
}
