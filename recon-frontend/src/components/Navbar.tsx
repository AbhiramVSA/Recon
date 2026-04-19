import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ScrambleText from './ScrambleText';

const NAV_LINKS = [
    { label: 'Events', to: '/events' },
    { label: 'Schedule', to: '/schedule' },
    { label: 'People', to: '/people' },
    { label: 'Prizes', to: '/prizes' },
    { label: 'Sponsors', to: '/sponsors' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setOpen(false); }, [pathname]);

    return (
        <nav
            className={`fixed top-[34px] inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-void/90 backdrop-blur-md border-b border-edge' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="font-display text-sm tracking-[0.3em] text-paper uppercase">
                    RECON
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map(({ label, to }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`font-mono text-[11px] tracking-[0.2em] uppercase transition-colors duration-200 ${pathname === to ? 'text-paper' : 'text-muted hover:text-paper'
                                }`}
                        >
                            <ScrambleText text={label} tag="span" speed={12} />
                        </Link>
                    ))}
                    <Link
                        to="/login"
                        className="font-mono text-[11px] tracking-[0.2em] uppercase px-4 py-1.5 border border-paper/30 text-paper hover:bg-paper/10 transition-colors duration-200"
                    >
                        <ScrambleText text="Register" tag="span" speed={12} />
                    </Link>
                </div>

                {/* Mobile burger */}
                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden flex flex-col gap-1 items-end"
                    aria-label="Toggle menu"
                >
                    <span className={`block h-px bg-paper transition-all duration-200 ${open ? 'w-5 rotate-45 translate-y-[3px]' : 'w-5'}`} />
                    <span className={`block h-px bg-paper transition-all duration-200 ${open ? 'opacity-0 w-3' : 'w-3'}`} />
                    <span className={`block h-px bg-paper transition-all duration-200 ${open ? 'w-5 -rotate-45 -translate-y-[3px]' : 'w-4'}`} />
                </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:hidden overflow-hidden bg-dark/95 backdrop-blur-xl border-b border-edge"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {NAV_LINKS.map(({ label, to }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`font-mono text-xs tracking-[0.2em] uppercase transition-colors ${pathname === to ? 'text-paper' : 'text-muted hover:text-paper'
                                        }`}
                                >
                                    {label}
                                </Link>
                            ))}
                            <Link
                                to="/faq"
                                className={`font-mono text-xs tracking-[0.2em] uppercase transition-colors ${pathname === '/faq' ? 'text-paper' : 'text-muted hover:text-paper'}`}
                            >
                                FAQ
                            </Link>
                            <Link
                                to="/contact"
                                className={`font-mono text-xs tracking-[0.2em] uppercase transition-colors ${pathname === '/contact' ? 'text-paper' : 'text-muted hover:text-paper'}`}
                            >
                                Contact
                            </Link>
                            <Link
                                to="/login"
                                className="font-mono text-xs tracking-[0.2em] uppercase px-4 py-2 border border-paper/30 text-paper text-center hover:bg-paper/10 transition-colors mt-2"
                            >
                                Register
                            </Link>

                            {/* Social links */}
                            <div className="pt-4 border-t border-edge/50">
                                <div className="flex flex-wrap justify-center gap-4">
                                    {[
                                        { label: 'Discord', href: 'https://discord.gg/xJdRgYndSJ' },
                                        { label: 'Twitter / X', href: 'https://x.com/Recon2k26/with_replies' },
                                        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/recon-events/' },
                                        { label: 'Instagram', href: 'https://www.instagram.com/recon_2k26/' },
                                    ].map(({ label, href }) => (
                                        <a
                                            key={label}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-[11px] text-muted hover:text-paper transition-colors"
                                        >
                                            {label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
