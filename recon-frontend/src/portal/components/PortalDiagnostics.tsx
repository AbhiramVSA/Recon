import { useEffect, useMemo, useState } from 'react';
import { getNowInIstLabel, getUtcLabel } from '../lib/utils';

interface Viewport {
    width: number;
    height: number;
}

export default function PortalDiagnostics() {
    const [timeTick, setTimeTick] = useState(0);
    const [viewport, setViewport] = useState<Viewport>({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const id = window.setInterval(() => setTimeTick((v) => v + 1), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const onResize = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const labels = useMemo(
        () => ({
            utc: getUtcLabel(),
            ist: getNowInIstLabel(),
            unix: Math.floor(Date.now() / 1000),
        }),
        [timeTick],
    );

    return (
        <>
            <div className="fixed bottom-3 left-3 z-[70] hidden md:flex pointer-events-none flex-col gap-0.5 portal-hud-fade" aria-hidden="true">
                <span className="portal-hud-text">CLIENT: PARTICIPANT TERMINAL</span>
                <span className="portal-hud-text">VIEWPORT: {viewport.width}x{viewport.height}</span>
                <span className="portal-hud-text">STATUS: LIVE</span>
            </div>
            <div className="fixed bottom-3 right-3 z-[70] hidden md:flex pointer-events-none flex-col gap-0.5 items-end portal-hud-fade" aria-hidden="true">
                <span className="portal-hud-text">UTC: {labels.utc}</span>
                <span className="portal-hud-text">IST: {labels.ist}</span>
                <span className="portal-hud-text">UNIX: {labels.unix}</span>
            </div>
        </>
    );
}
