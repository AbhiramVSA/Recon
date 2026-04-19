import { marqueeItems } from '../data';

interface MarqueeProps {
    items?: string[];
    speed?: 'normal' | 'fast';
    className?: string;
    separator?: string;
}

export default function Marquee({
    items = marqueeItems,
    speed = 'normal',
    className = '',
    separator = '◆',
}: MarqueeProps) {
    const animClass = speed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee';
    const sourceItems = items.length > 0 ? items : marqueeItems;
    const loopItems = [...sourceItems];
    while (loopItems.length < 18) {
        loopItems.push(...sourceItems);
    }
    const row = loopItems.map((item) => `${item}  ${separator}  `).join('');
    // If className includes text-void, use that; otherwise default to text-faint
    const textClass = className.includes('text-void')
        ? 'font-mono text-[11px] tracking-[0.3em] uppercase text-void/80'
        : 'font-mono text-xs tracking-[0.3em] uppercase text-faint';

    return (
        <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden="true">
            <div className={`flex w-max will-change-transform ${animClass}`}>
                <span className={`${textClass} block shrink-0`}>
                    {row}
                </span>
                <span className={`${textClass} block shrink-0`}>
                    {row}
                </span>
            </div>
        </div>
    );
}
