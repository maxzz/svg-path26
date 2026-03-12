import { atom } from "jotai";
import { rawPathAtom } from "./1-0-raw-path";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "./2-2-editor-actions";
import { appSettings } from "@/store/0-ui-settings";

export type StoredPath = {
    name: string;
    path: string;
    createdAt: number;
    updatedAt: number;
};

export const doSaveNamedPathAtom = atom(
    null,
    (get, set, nameRaw: string) => {
        const path = get(rawPathAtom).trim();
        const name = nameRaw.trim();
        if (!path || !name) return;
        const now = Date.now();
        const existing = appSettings.pathEditor.storedPaths;
        const match = existing.find((it) => it.name === name);
        if (match) {
            appSettings.pathEditor.storedPaths = existing.map((it) => it.name === name ? { ...it, path, updatedAt: now } : it);
        } else {
            appSettings.pathEditor.storedPaths = [...existing, { name, path, createdAt: now, updatedAt: now }];
        }
        appSettings.pathEditor.pathName = name;
    }
);

export const doDeleteNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        appSettings.pathEditor.storedPaths = appSettings.pathEditor.storedPaths.filter((it) => it.name !== name);
        if (appSettings.pathEditor.pathName === name) {
            appSettings.pathEditor.pathName = "";
        }
    }
);

export const doOpenNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        const match = appSettings.pathEditor.storedPaths.find((it) => it.name === name);
        if (!match) return;
        set(svgPathInputAtom, match.path);
        appSettings.pathEditor.pathName = name;
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
    }
);
