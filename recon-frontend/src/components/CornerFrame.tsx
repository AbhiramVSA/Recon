import type { ReactNode } from 'react';

interface CornerFrameProps {
    children: ReactNode;
    className?: string;
    accent?: boolean;
    size?: 'default' | 'lg';
}

export default function CornerFrame({ children, className = '', accent = false, size = 'default' }: CornerFrameProps) {
    const color = accent ? 'border-paper/30' : 'border-edge';
    const cornerColor = accent ? 'bg-paper/50' : 'bg-soft';
    const padding = size === 'lg' ? 'p-8 md:p-10' : 'p-6';

    return (
        <div className={`relative group ${className}`}>
            {/* Border container */}
            <div className={`border ${color} bg-panel/60 backdrop-blur-sm ${padding} transition-colors duration-300 group-hover:border-paper/25`}>
                {children}
            </div>
            {/* Corner brackets */}
            {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos) => (
                <span
                    key={pos}
                    className={`absolute ${pos} w-2 h-2 ${cornerColor} transition-colors duration-300 group-hover:bg-paper/40`}
                    style={{
                        clipPath: pos.includes('right')
                            ? pos.includes('bottom') ? 'polygon(100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)'
                            : pos.includes('bottom') ? 'polygon(0 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 0 100%)',
                    }}
                    aria-hidden="true"
                />
            ))}
        </div>
    );
}
