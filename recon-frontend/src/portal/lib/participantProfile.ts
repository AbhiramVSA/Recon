export const PARTICIPANT_YEAR_MIN = 1;
export const PARTICIPANT_YEAR_MAX = 5;

export function isValidParticipantYear(year: number) {
    return Number.isInteger(year) && year >= PARTICIPANT_YEAR_MIN && year <= PARTICIPANT_YEAR_MAX;
}

export function getParticipantYearError(year: number) {
    if (Number.isNaN(year)) {
        return `Year is required and must be between ${PARTICIPANT_YEAR_MIN} and ${PARTICIPANT_YEAR_MAX}.`;
    }
    if (!Number.isInteger(year)) {
        return 'Year must be a whole number.';
    }
    if (year < PARTICIPANT_YEAR_MIN) {
        return `Year must be at least ${PARTICIPANT_YEAR_MIN}.`;
    }
    if (year > PARTICIPANT_YEAR_MAX) {
        return `Year must not exceed ${PARTICIPANT_YEAR_MAX}.`;
    }
    return null;
}
