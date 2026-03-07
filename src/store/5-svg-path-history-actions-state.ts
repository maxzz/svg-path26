import { atom } from "jotai";
import {
    ensureHistoryReadyAtom,
    historyIndexAtom,
    historyStackAtom,
    setPathWithoutHistoryAtom,
} from "./5-svg-path-history-internals-state";

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
        set(ensureHistoryReadyAtom);
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        if (index <= 0) return;

        const nextIndex = index - 1;
        set(historyIndexAtom, nextIndex);
        set(setPathWithoutHistoryAtom, stack[nextIndex]);
    }
);

export const doRedoPathAtom = atom(
    null,
    (get, set) => {
        set(ensureHistoryReadyAtom);
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        if (index === -1 || index >= stack.length - 1) return;

        const nextIndex = index + 1;
        set(historyIndexAtom, nextIndex);
        set(setPathWithoutHistoryAtom, stack[nextIndex]);
    }
);
