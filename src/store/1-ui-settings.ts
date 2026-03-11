import { atom, type SetStateAction, type WritableAtom } from "jotai";
import { proxy, subscribe } from "valtio";
import { themeApplyMode, type ThemeMode } from "@/utils";
import { normalizeStoredSettings } from "@/store/1-ui-settings-storage";

const STORE_KEY = "svg-path26";
const STORE_VER = "v1";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

export interface StoredPathSetting {
    name: string;
    path: string;
    createdAt: number;
    updatedAt: number;
}

export interface PathEditorSettings {
    strokeWidth: number;
    zoom: number;
    decimals: number;
    minifyOutput: boolean;
    snapToGrid: boolean;
    pointPrecision: number;
    showTicks: boolean;
    tickInterval: number;
    fillPreview: boolean;
    canvasPreview: boolean;
    viewPortX: number;
    viewPortY: number;
    viewPortWidth: number;
    viewPortHeight: number;
    viewPortLocked: boolean;
    pathName: string;
    exportFill: boolean;
    exportFillColor: string;
    exportStroke: boolean;
    exportStrokeColor: string;
    exportStrokeWidth: number;
    rawPath: string;
    storedPaths: StoredPathSetting[];
}

export interface UiSettings {
    theme: ThemeMode;
    showGrid: boolean;
    showHelpers: boolean;
    darkCanvas: boolean;
    transformAccordionOpen: boolean;
    editorPanelSizes: number[];
    pathEditor: PathEditorSettings;
}

const DEFAULT_PATH_EDITOR_SETTINGS: PathEditorSettings = {
    strokeWidth: 3,
    zoom: 1,
    decimals: 3,
    minifyOutput: false,
    snapToGrid: true,
    pointPrecision: 3,
    showTicks: false,
    tickInterval: 5,
    fillPreview: false,
    canvasPreview: false,
    viewPortX: 0,
    viewPortY: 0,
    viewPortWidth: 120,
    viewPortHeight: 90,
    viewPortLocked: false,
    pathName: "",
    exportFill: true,
    exportFillColor: "#000000",
    exportStroke: false,
    exportStrokeColor: "#ff0000",
    exportStrokeWidth: 0.1,
    rawPath: "M 20 140 C 40 20, 65 20, 95 140 S 150 260, 180 140",
    storedPaths: [],
};

const DEFAULT_SETTINGS: UiSettings = {
    theme: "light",
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
    transformAccordionOpen: true,
    editorPanelSizes: [33, 67],
    pathEditor: DEFAULT_PATH_EDITOR_SETTINGS,
};

function loadSettings(): UiSettings {
    return normalizeStoredSettings(loadStoredSettings(), DEFAULT_SETTINGS, DEFAULT_PATH_EDITOR_SETTINGS);
}

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

export function appSettingAtom<Key extends keyof PathEditorSettings>(key: Key): WritableAtom<PathEditorSettings[Key], [update: SetStateAction<PathEditorSettings[Key]>], void> {
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
