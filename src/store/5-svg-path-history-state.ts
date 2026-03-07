import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const DEFAULT_PATH = "M 20 140 C 40 20, 65 20, 95 140 S 150 260, 180 140";
const HISTORY_LIMIT = 120;

export const rawPathAtom = atomWithStorage("svg-path26:path", DEFAULT_PATH);

const historyStackAtom = atom<string[]>([]);
const historyIndexAtom = atom(-1);
const historyReadyAtom = atom(false);

const ensureHistoryReadyAtom = atom(
    null,
    (get, set) => {
        if (get(historyReadyAtom)) return;
        const initial = get(rawPathAtom);
        set(historyStackAtom, [initial]);
        set(historyIndexAtom, 0);
        set(historyReadyAtom, true);
    }
);

const pushHistoryAtom = atom(
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

const setPathWithoutHistoryAtom = atom(
    null,
    (_get, set, nextPath: string) => {
        set(rawPathAtom, nextPath);
    }
);

export const svgPathInputAtom = atom(
    (get) => get(rawPathAtom),
    (get, set, nextValue: string | ((prev: string) => string)) => {
        const prev = get(rawPathAtom);
        const resolved = typeof nextValue === "function"
            ? nextValue(prev)
            : nextValue;
        set(ensureHistoryReadyAtom);
        set(rawPathAtom, resolved);
        set(pushHistoryAtom, resolved);
    },
);

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
