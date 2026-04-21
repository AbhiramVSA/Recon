export const HUNT_UI_PROBLEM_COUNT = 8;

export function getDisplayedHuntProblemCount(
    listCount?: number | null,
    serverTotal?: number | null,
): number {
    if (typeof listCount === 'number' && listCount > 0) {
        return Math.min(listCount, HUNT_UI_PROBLEM_COUNT);
    }
    if (typeof serverTotal === 'number' && serverTotal > 0) {
        return Math.min(serverTotal, HUNT_UI_PROBLEM_COUNT);
    }
    return HUNT_UI_PROBLEM_COUNT;
}
