import { atom } from "jotai";
import { createAtomAppSetting } from "./8-create-atom-app-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";

const storedPathViewBoxAtom = createAtomAppSetting("viewBox");

export const pathViewBoxAtom = atom<ViewBox>((get) => get(storedPathViewBoxAtom));

export const pathViewBoxXAtom = atom(
    (get) => get(storedPathViewBoxAtom)[0],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current[0]) : nextValue;
        if (!Number.isFinite(next)) return;
        set(storedPathViewBoxAtom, [next, current[1], current[2], current[3]]);
    }
);

export const pathViewBoxYAtom = atom(
    (get) => get(storedPathViewBoxAtom)[1],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current[1]) : nextValue;
        if (!Number.isFinite(next)) return;
        set(storedPathViewBoxAtom, [current[0], next, current[2], current[3]]);
    }
);

export const pathViewBoxWidthAtom = atom(
    (get) => get(storedPathViewBoxAtom)[2],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current[2]) : nextValue;
        if (!Number.isFinite(next) || next <= 0) return;
        set(storedPathViewBoxAtom, [current[0], current[1], Math.max(1e-3, next), current[3]]);
    }
);

export const pathViewBoxHeightAtom = atom(
    (get) => get(storedPathViewBoxAtom)[3],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current[3]) : nextValue;
        if (!Number.isFinite(next) || next <= 0) return;
        set(storedPathViewBoxAtom, [current[0], current[1], current[2], Math.max(1e-3, next)]);
    }
);

export const doSetPathViewBoxAtom = atom(
    null,
    (_get, set, next: ViewBox) => {
        if (!Number.isFinite(next[0]) || !Number.isFinite(next[1])) return;
        if (!Number.isFinite(next[2]) || !Number.isFinite(next[3])) return;
        if (next[2] <= 0 || next[3] <= 0) return;

        set(storedPathViewBoxAtom, [next[0], next[1], Math.max(1e-3, next[2]), Math.max(1e-3, next[3])]);
    }
);