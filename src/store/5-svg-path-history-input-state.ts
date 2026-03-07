import { atom } from "jotai";
import { ensureHistoryReadyAtom, pushHistoryAtom } from "./5-svg-path-history-internals-state";
import { rawPathAtom } from "./5-svg-path-history-source-state";

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
