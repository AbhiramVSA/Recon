export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (!import.meta.env.PROD) {
        return;
    }

    window.addEventListener('load', () => {
        void navigator.serviceWorker.register('/sw.js');
    });
}
