import { getParticipantYearError, isValidParticipantYear } from './participantProfile';

describe('participant year validation', () => {
    it('accepts valid academic years', () => {
        expect(isValidParticipantYear(1)).toBe(true);
        expect(isValidParticipantYear(5)).toBe(true);
        expect(getParticipantYearError(3)).toBeNull();
    });

    it('rejects zero and values above five', () => {
        expect(isValidParticipantYear(0)).toBe(false);
        expect(isValidParticipantYear(6)).toBe(false);
        expect(getParticipantYearError(0)).toMatch('at least 1');
        expect(getParticipantYearError(6)).toMatch('must not exceed 5');
    });

    it('rejects empty and fractional values', () => {
        expect(isValidParticipantYear(Number.NaN)).toBe(false);
        expect(isValidParticipantYear(2.5)).toBe(false);
        expect(getParticipantYearError(Number.NaN)).toMatch('required');
        expect(getParticipantYearError(2.5)).toMatch('whole number');
    });
});
