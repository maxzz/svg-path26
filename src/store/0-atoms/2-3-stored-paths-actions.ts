import { atom } from "jotai";
import { createAtomAppSetting } from "@/store/0-atoms/8-create-atom-app-settings";
import { rawPathAtom } from "./1-0-raw-path";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { hoveredCommandIndexAtom, pathNameAtom, selectedCommandIndexAtom } from "./2-2-editor-actions";

export type StoredPath = {
    name: string;
    path: string;
    createdAt: number;
    updatedAt: number;
};

export const storedPathsAtom = createAtomAppSetting("storedPaths");

export const doSaveNamedPathAtom = atom(
    null,
    (get, set, nameRaw: string) => {
        const path = get(rawPathAtom).trim();
        const name = nameRaw.trim();
        if (!path || !name) return;
        const now = Date.now();
        const existing = get(storedPathsAtom);
        const match = existing.find((it) => it.name === name);
        if (match) {
            set(storedPathsAtom, existing.map((it) => it.name === name ? { ...it, path, updatedAt: now } : it));
        } else {
            set(storedPathsAtom, [...existing, { name, path, createdAt: now, updatedAt: now }]);
        }
        set(pathNameAtom, name);
    }
);

export const doDeleteNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        set(storedPathsAtom, get(storedPathsAtom).filter((it) => it.name !== name));
        if (get(pathNameAtom) === name) {
            set(pathNameAtom, "");
        }
    }
);

export const doOpenNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        const match = get(storedPathsAtom).find((it) => it.name === name);
        if (!match) return;
        set(svgPathInputAtom, match.path);
        set(pathNameAtom, name);
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
    }
);
