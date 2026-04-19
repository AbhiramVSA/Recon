import { describe, expect, it } from 'vitest';
import { isSafariBrowser, isStandaloneMode, supportsIosAddToHomeScreen } from './install';

function createNavigatorStub(overrides: Partial<Navigator> & { userAgent: string }) {
    return {
        userAgent: overrides.userAgent,
        platform: overrides.platform ?? 'iPhone',
        maxTouchPoints: overrides.maxTouchPoints ?? 5,
        standalone: overrides.standalone ?? false,
    } as Navigator;
}

function createWindowStub(matches: boolean) {
    return {
        matchMedia: () => ({ matches }),
    } as unknown as Window;
}

describe('pwa install helpers', () => {
    it('detects standalone mode from display-mode media query', () => {
        expect(
            isStandaloneMode(
                createWindowStub(true),
                createNavigatorStub({ userAgent: 'Mozilla/5.0 Safari/605.1.15' }),
            ),
        ).toBe(true);
    });

    it('recognizes Safari but excludes Chrome on iOS', () => {
        expect(isSafariBrowser(createNavigatorStub({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
        }))).toBe(true);

        expect(isSafariBrowser(createNavigatorStub({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/147.0.0.0 Mobile/15E148 Safari/604.1',
        }))).toBe(false);
    });

    it('enables manual install instructions for iOS Safari when not already standalone', () => {
        expect(
            supportsIosAddToHomeScreen(
                createWindowStub(false),
                createNavigatorStub({
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
                }),
            ),
        ).toBe(true);
    });
});
