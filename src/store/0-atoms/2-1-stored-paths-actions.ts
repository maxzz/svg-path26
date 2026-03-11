import { atom, type SetStateAction, type WritableAtom } from "jotai";
import { createAtomAppSetting } from "@/store/0-ui-settings";
import { rawPathAtom, svgPathInputAtom } from "./1-8-svg-path-history-state";

export type StoredPath = {
    name: string;
    path: string;
    createdAt: number;
    updatedAt: number;
};

export const storedPathsAtom = createAtomAppSetting("storedPaths");

type PathNameAtom = WritableAtom<string, [SetStateAction<string>], void>;
type SelectedCommandIndexAtom = WritableAtom<number | null, [number | null], void>;
type HoveredCommandIndexAtom = WritableAtom<number | null, [SetStateAction<number | null>], void>;

export function createStoredPathActionsAtoms(
    args: {
        pathNameAtom: PathNameAtom;
        selectedCommandIndexAtom: SelectedCommandIndexAtom;
        hoveredCommandIndexAtom: HoveredCommandIndexAtom;
    }
) {
    const doSaveNamedPathAtom = atom(
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
            set(args.pathNameAtom, name);
        }
    );

    const doDeleteNamedPathAtom = atom(
        null,
        (get, set, name: string) => {
            set(storedPathsAtom, get(storedPathsAtom).filter((it) => it.name !== name));
            if (get(args.pathNameAtom) === name) {
                set(args.pathNameAtom, "");
            }
        }
    );

    const doOpenNamedPathAtom = atom(
        null,
        (get, set, name: string) => {
            const match = get(storedPathsAtom).find((it) => it.name === name);
            if (!match) return;
            set(svgPathInputAtom, match.path);
            set(args.pathNameAtom, name);
            set(args.selectedCommandIndexAtom, null);
            set(args.hoveredCommandIndexAtom, null);
        }
    );

    return {
        doSaveNamedPathAtom,
        doDeleteNamedPathAtom,
        doOpenNamedPathAtom,
    };
}
