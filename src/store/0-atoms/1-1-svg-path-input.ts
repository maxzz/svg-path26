import { atom } from "jotai";
import { doEnsureHistoryReadyAtom, doPushHistoryAtom } from "./1-2-history";
import { rawPathAtom } from "./1-0-raw-path";
import { doSyncSvgInputBoundPathAtom } from "./1-3-svg-input-state";

export const svgPathInputAtom = atom(
    (get) => get(rawPathAtom),
    (get, set, nextValue: string | ((prev: string) => string)) => {
        const prev = get(rawPathAtom);
        const resolved = typeof nextValue === "function"
            ? nextValue(prev)
            : nextValue;
        set(doEnsureHistoryReadyAtom);
        set(rawPathAtom, resolved);
        set(doSyncSvgInputBoundPathAtom, resolved);
        set(doPushHistoryAtom, resolved);
    },
);
