import { useState, useEffect } from 'react';

export default function HUD() {
    const [time, setTime] = useState(new Date());
    const [isFooterDominant, setIsFooterDominant] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const footer = document.getElementById('site-footer');
        if (!footer) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFooterDominant(entry.intersectionRatio > 0.8);
            },
            {
                threshold: [0, 0.5, 0.8, 0.95],
            }
        );

        observer.observe(footer);
        return () => observer.disconnect();
    }, []);

    const utc = time.toISOString().slice(11, 19);
    const local = time.toLocaleTimeString('en-GB');
    const unix = Math.floor(time.getTime() / 1000);
    const tz = `GMT${time.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(time.getTimezoneOffset() / 60)}`;

    const client = /Firefox/.test(navigator.userAgent) ? 'Firefox'
        : /Chrome/.test(navigator.userAgent) ? 'Chrome'
            : /Safari/.test(navigator.userAgent) ? 'Safari' : 'Browser';
    const vp = `${window.innerWidth}x${window.innerHeight}`;
    const scr = `${screen.width}x${screen.height}`;
    const depth = `${screen.colorDepth}BIT`;

    return (
        <>
            {/* Bottom-left: Glyph corner + HUD inset */}
            <div
                className={`fixed bottom-3 left-3 z-50 pointer-events-none hidden md:flex flex-col items-start gap-1 transition-opacity duration-300 ${isFooterDominant ? 'opacity-70' : 'opacity-100'}`}
                aria-hidden="true"
            >

                <div className="pl-1 flex flex-col gap-0.5">
                    <span className="font-mono text-[9px] tracking-wider uppercase text-faint/70">
                        CLIENT: {client}
                    </span>
                    <span className="font-mono text-[9px] tracking-wider uppercase text-faint/70">
                        VIEWPORT: {vp}&ensp;SCREEN: {scr}
                    </span>
                    <span className="font-mono text-[9px] tracking-wider uppercase text-faint/70">
                        DEPTH: {depth}
                    </span>
                </div>
            </div>

            {/* Bottom-right: Glyph corner + HUD inset */}
            <div
                className={`fixed bottom-3 right-3 z-50 pointer-events-none hidden md:flex flex-col items-end gap-1 transition-opacity duration-300 ${isFooterDominant ? 'opacity-70' : 'opacity-100'}`}
                aria-hidden="true"
            >

                <div className="pr-1 flex flex-col gap-0.5 items-end">
                    <span className="font-mono text-[9px] tracking-wider uppercase text-faint/70">
                        UTC: {utc}&ensp;LOCAL: {local}
                    </span>
                    <span className="font-mono text-[9px] tracking-wider uppercase text-faint/70">
                        UNIX: {unix}
                    </span>
                    <span className="font-mono text-[9px] tracking-wider uppercase text-faint/70">
                        ZONE: {tz}&ensp;STATUS: <span className="text-paper/60">● ON</span>
                    </span>
                </div>
            </div>
        </>
    );
}
