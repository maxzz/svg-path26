import { atom } from "jotai";
import { createAtomAppSetting } from "./8-create-atom-app-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";

const storedPathViewBoxAtom = createAtomAppSetting("viewBox");

export const pathViewBoxAtom = atom<ViewBox>(
    (get) => get(storedPathViewBoxAtom)
);

export const doSetPathViewBoxAtom = atom(
    null,
    (_get, set, next: ViewBox) => {
        const [x, y, width, height] = next;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (!Number.isFinite(width) || !Number.isFinite(height)) return;
        if (width <= 0 || height <= 0) return;

        set(storedPathViewBoxAtom, [x, y, Math.max(1e-3, width), Math.max(1e-3, height)]);
    }
);

// UI accessible atoms for editing the path viewBox.

export const pathViewBoxXAtom = atom(
    (get) => get(storedPathViewBoxAtom)[0],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const value = typeof nextValue === "function" ? nextValue(current[0]) : nextValue;
        if (!Number.isFinite(value)) return;
        set(storedPathViewBoxAtom, [value, current[1], current[2], current[3]]);
    }
);

export const pathViewBoxYAtom = atom(
    (get) => get(storedPathViewBoxAtom)[1],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const value = typeof nextValue === "function" ? nextValue(current[1]) : nextValue;
        if (!Number.isFinite(value)) return;
        set(storedPathViewBoxAtom, [current[0], value, current[2], current[3]]);
    }
);

export const pathViewBoxWidthAtom = atom(
    (get) => get(storedPathViewBoxAtom)[2],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const value = typeof nextValue === "function" ? nextValue(current[2]) : nextValue;
        if (!Number.isFinite(value) || value <= 0) return;
        set(storedPathViewBoxAtom, [current[0], current[1], Math.max(1e-3, value), current[3]]);
    }
);

export const pathViewBoxHeightAtom = atom(
    (get) => get(storedPathViewBoxAtom)[3],
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const value = typeof nextValue === "function" ? nextValue(current[3]) : nextValue;
        if (!Number.isFinite(value) || value <= 0) return;
        set(storedPathViewBoxAtom, [current[0], current[1], current[2], Math.max(1e-3, value)]);
    }
);
