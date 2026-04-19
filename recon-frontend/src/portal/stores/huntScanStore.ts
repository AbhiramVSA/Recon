import { create } from 'zustand';
import type { TreasureHuntProblemRead } from '../lib/treasureHuntTypes';

/** In-memory cache for full problem payloads after a scan (helps cold `/hunt/problem/:id` when router state is lost). */
interface HuntScanState {
    problemsById: Record<string, TreasureHuntProblemRead>;
    setProblemCache: (problem: TreasureHuntProblemRead) => void;
    getProblemCache: (problemId: string) => TreasureHuntProblemRead | undefined;
    clearProblemCache: (problemId: string) => void;
}

export const useHuntScanStore = create<HuntScanState>((set, get) => ({
    problemsById: {},
    setProblemCache: (problem) =>
        set((s) => ({
            problemsById: { ...s.problemsById, [problem.id]: problem },
        })),
    getProblemCache: (problemId) => get().problemsById[problemId],
    clearProblemCache: (problemId) =>
        set((s) => {
            const next = { ...s.problemsById };
            delete next[problemId];
            return { problemsById: next };
        }),
}));
