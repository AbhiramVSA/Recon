export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
}

function getNavigatorStandalone(value: Navigator) {
    return Boolean((value as Navigator & { standalone?: boolean }).standalone);
}

export function isStandaloneMode(win: Window = window, nav: Navigator = navigator) {
    return win.matchMedia('(display-mode: standalone)').matches || getNavigatorStandalone(nav);
}

export function isIosDevice(nav: Navigator = navigator) {
    const ua = nav.userAgent;
    const platform = nav.platform;
    const maxTouchPoints = nav.maxTouchPoints ?? 0;
    return /iPhone|iPad|iPod/i.test(ua)
        || (platform === 'MacIntel' && maxTouchPoints > 1);
}

export function isSafariBrowser(nav: Navigator = navigator) {
    const ua = nav.userAgent;
    return /Safari/i.test(ua)
        && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
}

export function supportsIosAddToHomeScreen(win: Window = window, nav: Navigator = navigator) {
    return isIosDevice(nav) && isSafariBrowser(nav) && !isStandaloneMode(win, nav);
}
