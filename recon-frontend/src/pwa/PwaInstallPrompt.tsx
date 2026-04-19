import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Share2, X } from 'lucide-react';
import type { BeforeInstallPromptEvent } from './install';
import { isStandaloneMode, supportsIosAddToHomeScreen } from './install';

export default function PwaInstallPrompt({ portalRoute }: { portalRoute: boolean }) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(() => isStandaloneMode());
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
            setOpen(false);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const showIosInstructions = useMemo(
        () => supportsIosAddToHomeScreen(),
        [],
    );

    if (installed || (!deferredPrompt && !showIosInstructions)) {
        return null;
    }

    const bottomOffset = portalRoute
        ? 'calc(env(safe-area-inset-bottom) + 5.5rem)'
        : 'calc(env(safe-area-inset-bottom) + 1rem)';

    const launchInstallPrompt = async () => {
        if (!deferredPrompt) {
            setOpen(true);
            return;
        }

        await deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            setInstalled(true);
            setDeferredPrompt(null);
            return;
        }
        setOpen(true);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => void launchInstallPrompt()}
                className="fixed right-4 z-[160] min-h-11 px-4 border border-[var(--amber)] bg-[rgba(8,8,16,0.94)] backdrop-blur-md text-[var(--amber)] font-portal-mono text-[10px] tracking-[0.16em] uppercase inline-flex items-center gap-2 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
                style={{ bottom: bottomOffset }}
                aria-label="Install RECON as an app"
            >
                <Download className="size-3.5" />
                Install App
            </button>

            {open && (
                <div className="fixed inset-0 z-[170] bg-[rgba(3,3,8,0.78)] backdrop-blur-sm px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] flex items-end sm:items-center justify-center">
                    <div className="portal-card w-full max-w-md bg-[var(--surface)] p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                                    Install RECON
                                </div>
                                <div className="font-portal-display text-[28px] leading-none text-[var(--fg)] mt-2 uppercase">
                                    Save This As An App
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="min-h-10 min-w-10 border border-[var(--border-dim)] text-[var(--fg)] inline-flex items-center justify-center"
                                aria-label="Close install instructions"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 font-portal-body text-[14px] leading-[1.7] text-[color-mix(in_srgb,var(--dim)_80%,white_8%)]">
                            {showIosInstructions
                                ? 'On iPhone or iPad, Safari does not expose the native install prompt. Use the Share menu and add RECON to your Home Screen.'
                                : 'If your browser dismissed the native install prompt, you can still install RECON from the browser menu.'}
                        </div>

                        <div className="mt-5 grid gap-3">
                            {showIosInstructions ? (
                                <>
                                    <div className="portal-card p-3 bg-[var(--surface-2)]">
                                        <div className="font-portal-mono text-[10px] tracking-[0.16em] uppercase text-[var(--amber)] inline-flex items-center gap-2">
                                            <Share2 className="size-3.5" />
                                            Step 1
                                        </div>
                                        <div className="font-portal-body text-[13px] text-[var(--fg)] mt-2">
                                            Tap the Safari share button.
                                        </div>
                                    </div>
                                    <div className="portal-card p-3 bg-[var(--surface-2)]">
                                        <div className="font-portal-mono text-[10px] tracking-[0.16em] uppercase text-[var(--amber)] inline-flex items-center gap-2">
                                            <Plus className="size-3.5" />
                                            Step 2
                                        </div>
                                        <div className="font-portal-body text-[13px] text-[var(--fg)] mt-2">
                                            Choose <span className="font-portal-mono text-[12px]">Add to Home Screen</span>, then open RECON from the new icon.
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="portal-card p-3 bg-[var(--surface-2)]">
                                    <div className="font-portal-mono text-[10px] tracking-[0.16em] uppercase text-[var(--amber)] inline-flex items-center gap-2">
                                        <Download className="size-3.5" />
                                        Browser Menu
                                    </div>
                                    <div className="font-portal-body text-[13px] text-[var(--fg)] mt-2">
                                        In Chrome or Edge, open the browser menu and choose <span className="font-portal-mono text-[12px]">Install App</span> or <span className="font-portal-mono text-[12px]">Add to Home Screen</span>.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
