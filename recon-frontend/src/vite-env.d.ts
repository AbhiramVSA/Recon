/// <reference types="vite/client" />

/** Optional BarcodeDetector (Chromium). */
interface BarcodeDetectorInstance {
    detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
}

interface BarcodeDetectorConstructor {
    new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
}

interface WakeLockSentinel {
    release: () => Promise<void>;
    addEventListener: (type: 'release', listener: () => void) => void;
}

interface Navigator {
    wakeLock?: {
        request: (type: 'screen') => Promise<WakeLockSentinel>;
    };
}
