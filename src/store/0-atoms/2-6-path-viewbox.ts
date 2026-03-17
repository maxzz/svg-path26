import { atom } from "jotai";
import { createAtomAppSetting } from "./8-create-atom-app-settings";

const storedPathViewBoxAtom = createAtomAppSetting("viewBox");

export const pathViewBoxAtom = atom((get) => get(storedPathViewBoxAtom));

export const pathViewBoxXAtom = atom(
    (get) => get(storedPathViewBoxAtom).x,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.x) : nextValue;
        if (!Number.isFinite(next)) return;
        set(storedPathViewBoxAtom, { ...current, x: next });
    }
);

export const pathViewBoxYAtom = atom(
    (get) => get(storedPathViewBoxAtom).y,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.y) : nextValue;
        if (!Number.isFinite(next)) return;
        set(storedPathViewBoxAtom, { ...current, y: next });
    }
);

export const pathViewBoxWidthAtom = atom(
    (get) => get(storedPathViewBoxAtom).width,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.width) : nextValue;
        if (!Number.isFinite(next) || next <= 0) return;
        set(storedPathViewBoxAtom, { ...current, width: Math.max(1e-3, next) });
    }
);

export const pathViewBoxHeightAtom = atom(
    (get) => get(storedPathViewBoxAtom).height,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedPathViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.height) : nextValue;
        if (!Number.isFinite(next) || next <= 0) return;
        set(storedPathViewBoxAtom, { ...current, height: Math.max(1e-3, next) });
    }
);

export const doSetPathViewBoxAtom = atom(
    null,
    (_get, set, next: { x: number; y: number; width: number; height: number; }) => {
        if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return;
        if (!Number.isFinite(next.width) || !Number.isFinite(next.height)) return;
        if (next.width <= 0 || next.height <= 0) return;

        set(storedPathViewBoxAtom, {
            x: next.x,
            y: next.y,
            width: Math.max(1e-3, next.width),
            height: Math.max(1e-3, next.height),
        });
    }
);