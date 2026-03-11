import { atom } from "jotai";
import { ensureHistoryReadyAtom, pushHistoryAtom } from "./4-svg-path-history-internals-state";
import { rawPathAtom } from "./1-0-raw-path";

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
