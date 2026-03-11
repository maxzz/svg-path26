import { atom } from "jotai";
import { rawPathAtom } from "./1-0-raw-path";

const HISTORY_LIMIT = 120;

export const historyStackAtom = atom<string[]>([]);
export const historyIndexAtom = atom(-1);

const historyReadyAtom = atom(false);
export const doEnsureHistoryReadyAtom = atom(
    null,
    (get, set, initialPath?: string) => {
        if (get(historyReadyAtom)) return;
        
        const initial = initialPath ?? get(rawPathAtom);
        set(historyStackAtom, [initial]);
        set(historyIndexAtom, 0);
        set(historyReadyAtom, true);
    }
);

export const doPushHistoryAtom = atom(
    null,
    (get, set, nextPath: string) => {
        set(doEnsureHistoryReadyAtom);

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

export const doCommitCurrentPathToHistoryAtom = atom(
    null,
    (get, set, previousPath?: string) => {
        set(doEnsureHistoryReadyAtom, previousPath);
        set(doPushHistoryAtom, get(rawPathAtom));
    }
);

export const doSetPathWithoutHistoryAtom = atom(
    null,
    (_get, set, nextPath: string) => {
        set(rawPathAtom, nextPath);
    }
);
