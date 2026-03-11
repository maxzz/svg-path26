import { atom } from "jotai";
import { doEnsureHistoryReadyAtom, doPushHistoryAtom } from "./1-2-history";
import { rawPathAtom } from "./1-0-raw-path";

export const svgPathInputAtom = atom(
    (get) => get(rawPathAtom),
    (get, set, nextValue: string | ((prev: string) => string)) => {
        const prev = get(rawPathAtom);
        const resolved = typeof nextValue === "function"
            ? nextValue(prev)
            : nextValue;
        set(doEnsureHistoryReadyAtom);
        set(rawPathAtom, resolved);
        set(doPushHistoryAtom, resolved);
    },
);
