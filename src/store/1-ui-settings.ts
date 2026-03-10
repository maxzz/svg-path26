import { atom, type SetStateAction, type WritableAtom } from "jotai";
import { proxy, subscribe } from "valtio";
import { themeApplyMode, type ThemeMode } from "@/utils";

const STORE_KEY = "svg-path26";
const STORE_VER = "v1";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

export interface UiSettings {
    theme: ThemeMode;
    showGrid: boolean;
    showHelpers: boolean;
    darkCanvas: boolean;
    transformAccordionOpen: boolean;
    editorPanelSizes: number[];
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
    storedPaths: Array<{
        name: string;
        path: string;
        createdAt: number;
        updatedAt: number;
    }>;
}

const DEFAULT_SETTINGS: UiSettings = {
    theme: "light",
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
    transformAccordionOpen: true,
    editorPanelSizes: [33, 67],
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

const LEGACY_STORAGE_KEYS = {
    strokeWidth: "svg-path26:stroke",
    zoom: "svg-path26:zoom",
    decimals: "svg-path26:decimals",
    minifyOutput: "svg-path26:minify",
    snapToGrid: "svg-path26:snapToGrid",
    pointPrecision: "svg-path26:pointPrecision",
    showTicks: "svg-path26:showTicks",
    tickInterval: "svg-path26:tickInterval",
    fillPreview: "svg-path26:fillPreview",
    canvasPreview: "svg-path26:canvasPreview",
    viewPortX: "svg-path26:viewPortX",
    viewPortY: "svg-path26:viewPortY",
    viewPortWidth: "svg-path26:viewPortWidth",
    viewPortHeight: "svg-path26:viewPortHeight",
    viewPortLocked: "svg-path26:viewPortLocked",
    pathName: "svg-path26:pathName",
    exportFill: "svg-path26:exportFill",
    exportFillColor: "svg-path26:exportFillColor",
    exportStroke: "svg-path26:exportStroke",
    exportStrokeColor: "svg-path26:exportStrokeColor",
    exportStrokeWidth: "svg-path26:exportStrokeWidth",
    rawPath: "svg-path26:path",
    storedPaths: "svg-path26:storedPaths",
} satisfies Partial<Record<keyof UiSettings, string>>;

function loadSettings(): UiSettings {
    const stored = loadStoredSettings();
    const legacy = loadLegacySettings();

    return {
        ...DEFAULT_SETTINGS,
        ...legacy,
        ...stored,
    };
}

function loadStoredSettings(): Partial<UiSettings> {
    try {
        const raw = localStorage.getItem(STORAGE_ID);
        if (raw) {
            return JSON.parse(raw) as Partial<UiSettings>;
        }
    } catch (error) {
        console.error("Failed to load UI settings", error);
    }

    return {};
}

function loadLegacySettings(): Partial<UiSettings> {
    const legacy: Partial<UiSettings> = {};
    const legacyRecord = legacy as Record<string, unknown>;

    for (const [key, storageKey] of Object.entries(LEGACY_STORAGE_KEYS) as Array<[keyof typeof LEGACY_STORAGE_KEYS, string]>) {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw === null) continue;
            legacyRecord[key] = parseStoredValue(raw);
        } catch (error) {
            console.error(`Failed to load legacy setting ${storageKey}`, error);
        }
    }

    return legacy;
}

function parseStoredValue(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
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

export function appSettingAtom<Key extends keyof UiSettings>(key: Key): WritableAtom<UiSettings[Key], [update: SetStateAction<UiSettings[Key]>], void> {
    const baseAtom = atom(appSettings[key]);

    baseAtom.onMount = (setValue) => {
        setValue(appSettings[key]);
        return subscribe(appSettings, () => {
            setValue(appSettings[key]);
        });
    };

    return atom(
        (get) => get(baseAtom),
        (get, set, update: SetStateAction<UiSettings[Key]>) => {
            const current = get(baseAtom);
            const nextValue = typeof update === "function"
                ? (update as (previous: UiSettings[Key]) => UiSettings[Key])(current)
                : update;

            appSettings[key] = nextValue;
            set(baseAtom, nextValue);
        }
    );
}
