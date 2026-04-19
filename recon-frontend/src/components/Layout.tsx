import { Outlet } from 'react-router-dom';
import DitherCanvas from './DitherCanvas';
import Crosshair from './Crosshair';
import GlyphGrid from './GlyphGrid';
import HUD from './HUD';
import Marquee from './Marquee';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
    return (
        <div className="relative min-h-screen bg-void text-paper font-body scanline-overlay noise-overlay scanline-bar">
            {/* Background effects */}
            <DitherCanvas />
            <Crosshair />

            {/* Fixed corner glyph decorations — top only */}
            <div className="fixed top-4 left-4 z-40 pointer-events-none opacity-50 hidden lg:block" aria-hidden="true">
                <GlyphGrid type="braille" cols={6} rows={4} />
            </div>
            <div className="fixed top-4 right-4 z-40 pointer-events-none opacity-40 hidden lg:block" aria-hidden="true">
                <GlyphGrid type="hex" cols={5} rows={3} />
            </div>

            {/* Persistent HUD — bottom corners with embedded glyphs */}
            <HUD />

            {/* Top kinetic marquee — OVER the navbar */}
            <div className="fixed top-0 inset-x-0 z-[60] bg-paper/90 py-1.5 border-b border-cream/20">
                <Marquee className="text-void" />
            </div>

            {/* Navigation — pushed below the marquee */}
            <Navbar />

            {/* Page content */}
            <main>
                <Outlet />
            </main>

            {/* Footer on every page */}
            <Footer />
        </div>
    );
}
