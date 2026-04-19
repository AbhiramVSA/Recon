import { useEffect, useRef } from 'react';
import { initShader } from '../shader';

export default function DitherCanvas() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const cleanup = initShader(ref.current);
        return () => { cleanup?.(); };
    }, []);

    return (
        <canvas
            ref={ref}
            className="fixed inset-0 w-full h-full z-0 pointer-events-none"
            aria-hidden="true"
        />
    );
}
