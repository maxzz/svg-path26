import { atom } from "jotai";
import { rawPathAtom } from "./1-0-raw-path";
import { doSyncSvgInputBoundPathAtom } from "./1-3-svg-input-state";

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
        set(doSyncSvgInputBoundPathAtom, nextPath);
    }
);

// History actions

export const canUndoAtom = atom(
    (get) => {
        const index = get(historyIndexAtom);
        return index > 0;
    }
);

export const canRedoAtom = atom(
    (get) => {
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        return index !== -1 && index < stack.length - 1;
    }
);

export const doUndoPathAtom = atom(
    null,
    (get, set) => {
        set(doEnsureHistoryReadyAtom);
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        if (index <= 0) {
            return;
        }

        const nextIndex = index - 1;
        set(historyIndexAtom, nextIndex);
        set(doSetPathWithoutHistoryAtom, stack[nextIndex]);
    }
);

export const doRedoPathAtom = atom(
    null,
    (get, set) => {
        set(doEnsureHistoryReadyAtom);
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        if (index === -1 || index >= stack.length - 1) {
            return;
        }

        const nextIndex = index + 1;
        set(historyIndexAtom, nextIndex);
        set(doSetPathWithoutHistoryAtom, stack[nextIndex]);
    }
);
