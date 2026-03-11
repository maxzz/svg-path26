import { type SetStateAction, type WritableAtom, atom } from "jotai";
import { proxy, subscribe } from "valtio";
import { themeApplyMode } from "@/utils";
import { type PathEditorSettings, type UiSettings, DEFAULT_PATH_EDITOR_SETTINGS, DEFAULT_SETTINGS } from "./9-ui-settings-types-and-defaults";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";

const STORE_KEY = "svg-path26";
const STORE_VER = "v1";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

function loadSettings(): UiSettings {
    return normalizeStoredSettings(loadStoredSettings(), DEFAULT_SETTINGS, DEFAULT_PATH_EDITOR_SETTINGS);

    function loadStoredSettings(): unknown {
        try {
            const raw = localStorage.getItem(STORAGE_ID);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (error) {
            console.error("Failed to load UI settings", error);
        }

        return null;
    }
}

export const appSettings = proxy<UiSettings>(loadSettings());

themeApplyMode(appSettings.theme);

subscribe(appSettings, () => {
    try {
        themeApplyMode(appSettings.theme);
        localStorage.setItem(STORAGE_ID, JSON.stringify(appSettings));
    } catch (error) {
        console.error("Failed to save UI settings", error);
    }
});

// UI settings actions

export function toggleShowGrid() {
    appSettings.showGrid = !appSettings.showGrid;
}

export function toggleShowHelpers() {
    appSettings.showHelpers = !appSettings.showHelpers;
}

export function toggleDarkCanvas() {
    appSettings.darkCanvas = !appSettings.darkCanvas;
}

export function setTransformAccordionOpen(isOpen: boolean) {
    appSettings.transformAccordionOpen = isOpen;
}

export function createAtomAppSetting<Key extends keyof PathEditorSettings>(key: Key): WritableAtom<PathEditorSettings[Key], [update: SetStateAction<PathEditorSettings[Key]>], void> {
    const baseAtom = atom(appSettings.pathEditor[key]);

    baseAtom.onMount = (setValue) => {
        setValue(appSettings.pathEditor[key]);
        return subscribe(appSettings, () => {
            setValue(appSettings.pathEditor[key]);
        });
    };

    return atom(
        (get) => get(baseAtom),
        (get, set, update: SetStateAction<PathEditorSettings[Key]>) => {
            const current = get(baseAtom);
            const nextValue = typeof update === "function"
                ? (update as (previous: PathEditorSettings[Key]) => PathEditorSettings[Key])(current)
                : update;

            appSettings.pathEditor[key] = nextValue;
            set(baseAtom, nextValue);
        }
    );
}
