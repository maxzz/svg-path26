import { atom } from "jotai";
import { doEnsureHistoryReadyAtom, historyIndexAtom, historyStackAtom, doSetPathWithoutHistoryAtom } from "./1-2-history-internals";

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
        if (index <= 0) return;

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
        if (index === -1 || index >= stack.length - 1) return;

        const nextIndex = index + 1;
        set(historyIndexAtom, nextIndex);
        set(doSetPathWithoutHistoryAtom, stack[nextIndex]);
    }
);
