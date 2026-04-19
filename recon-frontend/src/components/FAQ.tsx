import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Section, Label } from './ui';
import ScrambleText from './ScrambleText';
import GlyphGrid from './GlyphGrid';
import Seo from './Seo';

interface FAQItem {
    q: string;
    a: string;
}

const FAQS: { category: string; items: FAQItem[] }[] = [
    {
        category: 'Registration',
        items: [
            {
                q: 'Who can participate in RECON 2026?',
                a: 'RECON is open to all college students across India. Whether you\'re a freshman or a final-year student, as long as you have a valid college ID, you\'re eligible to participate.',
            },
            {
                q: 'How do I register?',
                a: 'Register through the Participant Portal at /login. Enter your email, verify with OTP, and complete your onboarding from the dashboard.',
            },
            {
                q: 'Is there a registration fee?',
                a: 'Certain events and tracks may have nominal registration fees to cover logistics. Check the individual event pages for specific costs. The general entry and most side events are free.',
            },
            {
                q: 'Can I participate as an individual or do I need a team?',
                a: 'Both options are available. Most flagship competitions support teams of 2–4 members. Side events and workshops can be attended individually. You can also find teammates on our Discord server.',
            },
        ],
    },
    {
        category: 'Events & Competitions',
        items: [
            {
                q: 'What events are happening at RECON 2026?',
                a: 'RECON features flagship competitions (CTF, King of the Hill, Attack-Defence), and 10+ side events spanning hardware hacking, IoT Village, AppSec, OSINT, escape room, bug bounty, deepfake forensics, and more.',
            },
            {
                q: 'How long does the event run?',
                a: 'RECON 2026 is a 3-day cybersecurity festival. Check the schedule page for the full timeline of individual events and workshops.',
            },
            {
                q: 'What skill level do I need to participate?',
                a: 'RECON has tracks for everyone — from beginners attending their first CTF to seasoned red-teamers. Beginner workshops and guided challenges are available alongside advanced competitive tracks.',
            },
            {
                q: 'Will there be beginner-friendly workshops?',
                a: 'Yes. We run dedicated beginner workshops on web exploitation, reverse engineering, and network forensics. No prior CTF experience is needed for those.',
            },
        ],
    },
    {
        category: 'Logistics & Venue',
        items: [
            {
                q: 'Where is RECON 2026 being held?',
                a: 'RECON 2026 takes place at VIT-AP University, Amaravati, Andhra Pradesh. Full venue and entry instructions will be shared with registered participants closer to the event.',
            },
            {
                q: 'Is accommodation provided?',
                a: 'Outstation participants can arrange accommodation through VIT-AP\'s guest facilities. Limited on-campus accommodation may be available — details will be sent via email after registration.',
            },
            {
                q: 'What should I bring?',
                a: 'Bring your laptop (Linux recommended), college ID, power strips, and enthusiasm. For hardware tracks, specific component lists will be shared in advance.',
            },
        ],
    },
    {
        category: 'Prizes & Certifications',
        items: [
            {
                q: 'What is the total prize pool?',
                a: 'RECON 2026 has a prize pool of ₹1,50,000+ in cash, along with certifications, training vouchers, tools, and exclusive swag from our sponsors.',
            },
            {
                q: 'How are prizes distributed?',
                a: 'Prizes are distributed per event. Winners of flagship competitions receive cash prizes; all participants get certificates of participation, and winners receive certificates of merit.',
            },
            {
                q: 'Are industry certifications given to winners?',
                a: 'Yes. Depending on the sponsor lineup, top performers may receive training vouchers and certification exam vouchers from our title sponsors.',
            },
        ],
    },
    {
        category: 'Code of Conduct',
        items: [
            {
                q: 'Is there a code of conduct?',
                a: 'Yes. RECON follows a strict code of conduct to ensure a safe, inclusive, and fair environment. Attacks on competition infrastructure outside the defined scope, harassment, or cheating will result in immediate disqualification.',
            },
            {
                q: 'What networks/systems can we attack?',
                a: 'Only systems explicitly listed as in-scope for each competition. Attempting to attack event infrastructure, other participants\' machines, or VIT-AP systems is strictly prohibited and may have legal consequences.',
            },
        ],
    },
];

function FAQAccordion({ item }: { item: FAQItem }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-edge/50 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-start justify-between gap-4 py-4 text-left group"
            >
                <span className="font-mono text-xs tracking-wider text-cream/80 group-hover:text-paper transition-colors leading-relaxed">
                    {item.q}
                </span>
                <span
                    className={`font-mono text-paper/40 text-sm shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
                >
                    +
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 font-body text-xs text-muted leading-relaxed max-w-2xl">
                            {item.a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function FAQ() {
    return (
        <>
            <Seo
                title="FAQ"
                description="Answers to common questions about registration, events, venue, and prizes."
                path="/faq"
            />
            <Section id="faq" className="py-24 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                        <Label>FAQ</Label>
                        <GlyphGrid type="hex" cols={4} rows={2} className="hidden sm:block opacity-30" />
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl text-paper tracking-tight leading-tight mb-3">
                        <ScrambleText text="Frequently Asked" tag="span" speed={16} />
                        <br />
                        <span className="text-paper/70">Questions</span>
                    </h1>
                    <p className="font-body text-sm text-muted mb-12 max-w-xl">
                        Everything you need to know about RECON 2026. Can't find what you're looking for?{' '}
                        <Link to="/contact" className="text-paper/80 hover:text-paper underline underline-offset-2 transition-colors">
                            Contact us.
                        </Link>
                    </p>

                    {/* FAQ sections */}
                    <div className="space-y-10">
                        {FAQS.map((section) => (
                            <div key={section.category}>
                                {/* Section heading */}
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="w-4 h-px bg-paper/30" />
                                    <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-paper/50">
                                        {section.category}
                                    </span>
                                </div>
                                <div className="border border-edge bg-panel/20 px-5">
                                    {section.items.map((item) => (
                                        <FAQAccordion key={item.q} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Still have questions */}
                    <div className="mt-14 border border-edge bg-panel/30 p-6">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-paper/30" />
                        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-cream/50 mb-3">
                            Still have questions?
                        </p>
                        <p className="font-body text-sm text-muted leading-relaxed mb-5">
                            Reach out to us on Discord — our team is online daily and will get back to you within a few hours.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href="https://discord.gg/xJdRgYndSJ"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs tracking-[0.2em] uppercase px-5 py-2.5 bg-paper text-void hover:bg-cream transition-colors duration-200 text-center"
                            >
                                Join Discord
                            </a>
                            <Link
                                to="/contact"
                                className="font-mono text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-cream/30 text-muted hover:border-paper/40 hover:text-paper transition-colors duration-200 text-center"
                            >
                                Contact Page
                            </Link>
                        </div>
                    </div>
                </div>
            </Section>
        </>
    );
}
