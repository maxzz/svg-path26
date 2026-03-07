import { atom } from "jotai";
import { rawPathAtom } from "./5-svg-path-history-source-state";

const HISTORY_LIMIT = 120;

export const historyStackAtom = atom<string[]>([]);
export const historyIndexAtom = atom(-1);
const historyReadyAtom = atom(false);

export const ensureHistoryReadyAtom = atom(
    null,
    (get, set) => {
        if (get(historyReadyAtom)) return;
        const initial = get(rawPathAtom);
        set(historyStackAtom, [initial]);
        set(historyIndexAtom, 0);
        set(historyReadyAtom, true);
    }
);

export const pushHistoryAtom = atom(
    null,
    (get, set, nextPath: string) => {
        set(ensureHistoryReadyAtom);

        const stack = get(historyStackAtom);
        const index = get(historyIndexAtom);
        const current = stack[index];
        if (current === nextPath) return;

        const truncated = stack.slice(0, index + 1);
        const appended = [...truncated, nextPath];
        const limited = appended.slice(-HISTORY_LIMIT);
        const nextIndex = limited.length - 1;

        set(historyStackAtom, limited);
        set(historyIndexAtom, nextIndex);
    }
);

export const setPathWithoutHistoryAtom = atom(
    null,
    (_get, set, nextPath: string) => {
        set(rawPathAtom, nextPath);
    }
);
