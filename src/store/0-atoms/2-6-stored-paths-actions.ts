import { atom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { rawPathAtom } from "./1-0-raw-path";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCanvasPointIdsAtom, selectedCommandIndexAtom } from "./2-4-0-editor-actions";
import { doSetPathViewBoxAtom, pathViewBoxAtom } from "./2-2-path-viewbox";

export const doSaveNamedPathAtom = atom(
    null,
    (get, set, nameRaw: string) => {
        const path = get(rawPathAtom).trim();
        const name = nameRaw.trim();
        if (!path || !name) {
            return;
        }

        const viewBox = [...get(pathViewBoxAtom)] as ViewBox;
        const now = Date.now();
        const existing = appSettings.pathEditor.storedPaths;
        const match = existing.find((it) => it.name === name);
        if (match) {
            appSettings.pathEditor.storedPaths = existing.map(
                (it) => it.name === name ? { ...it, path, viewBox, updatedAt: now } : it
            );
        } else {
            appSettings.pathEditor.storedPaths = [...existing, { name, path, viewBox, createdAt: now, updatedAt: now }];
        }
        appSettings.pathEditor.pathName = name;
    }
);

export const doDeleteNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        appSettings.pathEditor.storedPaths = appSettings.pathEditor.storedPaths.filter(
            (it) => it.name !== name
        );
        if (appSettings.pathEditor.pathName === name) {
            appSettings.pathEditor.pathName = "";
        }
    }
);

export const doOpenNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        const match = appSettings.pathEditor.storedPaths.find((it) => it.name === name);
        if (!match) {
            return;
        }

        set(svgPathInputAtom, match.path);
        set(doSetPathViewBoxAtom, match.viewBox);
        appSettings.pathEditor.pathName = name;
        set(selectedCanvasPointIdsAtom, []);
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
    }
);
