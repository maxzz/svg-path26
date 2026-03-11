import { atom, type SetStateAction, type WritableAtom } from "jotai";
import { proxy, subscribe } from "valtio";
import { themeApplyMode, type ThemeMode } from "@/utils";

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
    return normalizeStoredSettings(loadStoredSettings());
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

function normalizeStoredSettings(value: unknown): UiSettings {
    const stored = isRecord(value) ? value : {};
    const storedPathEditor = isRecord(stored.pathEditor) ? stored.pathEditor : {};

    return {
        ...DEFAULT_SETTINGS,
        ...pickUiSettings(stored),
        pathEditor: {
            ...DEFAULT_PATH_EDITOR_SETTINGS,
            ...pickPathEditorSettings(stored),
            ...pickPathEditorSettings(storedPathEditor),
        },
    };
}

function pickUiSettings(source: Record<string, unknown>): Partial<Omit<UiSettings, "pathEditor">> {
    const next: Partial<Omit<UiSettings, "pathEditor">> = {};

    if (isThemeMode(source.theme)) next.theme = source.theme;
    if (typeof source.showGrid === "boolean") next.showGrid = source.showGrid;
    if (typeof source.showHelpers === "boolean") next.showHelpers = source.showHelpers;
    if (typeof source.darkCanvas === "boolean") next.darkCanvas = source.darkCanvas;
    if (typeof source.transformAccordionOpen === "boolean") next.transformAccordionOpen = source.transformAccordionOpen;
    if (isNumberArray(source.editorPanelSizes)) next.editorPanelSizes = source.editorPanelSizes;

    return next;
}

function pickPathEditorSettings(source: Record<string, unknown>): Partial<PathEditorSettings> {
    const next: Partial<PathEditorSettings> = {};

    if (typeof source.strokeWidth === "number") next.strokeWidth = source.strokeWidth;
    if (typeof source.zoom === "number") next.zoom = source.zoom;
    if (typeof source.decimals === "number") next.decimals = source.decimals;
    if (typeof source.minifyOutput === "boolean") next.minifyOutput = source.minifyOutput;
    if (typeof source.snapToGrid === "boolean") next.snapToGrid = source.snapToGrid;
    if (typeof source.pointPrecision === "number") next.pointPrecision = source.pointPrecision;
    if (typeof source.showTicks === "boolean") next.showTicks = source.showTicks;
    if (typeof source.tickInterval === "number") next.tickInterval = source.tickInterval;
    if (typeof source.fillPreview === "boolean") next.fillPreview = source.fillPreview;
    if (typeof source.canvasPreview === "boolean") next.canvasPreview = source.canvasPreview;
    if (typeof source.viewPortX === "number") next.viewPortX = source.viewPortX;
    if (typeof source.viewPortY === "number") next.viewPortY = source.viewPortY;
    if (typeof source.viewPortWidth === "number") next.viewPortWidth = source.viewPortWidth;
    if (typeof source.viewPortHeight === "number") next.viewPortHeight = source.viewPortHeight;
    if (typeof source.viewPortLocked === "boolean") next.viewPortLocked = source.viewPortLocked;
    if (typeof source.pathName === "string") next.pathName = source.pathName;
    if (typeof source.exportFill === "boolean") next.exportFill = source.exportFill;
    if (typeof source.exportFillColor === "string") next.exportFillColor = source.exportFillColor;
    if (typeof source.exportStroke === "boolean") next.exportStroke = source.exportStroke;
    if (typeof source.exportStrokeColor === "string") next.exportStrokeColor = source.exportStrokeColor;
    if (typeof source.exportStrokeWidth === "number") next.exportStrokeWidth = source.exportStrokeWidth;
    if (typeof source.rawPath === "string") next.rawPath = source.rawPath;
    if (isStoredPathArray(source.storedPaths)) next.storedPaths = source.storedPaths;

    return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function isStoredPathArray(value: unknown): value is StoredPathSetting[] {
    return Array.isArray(value) && value.every(isStoredPath);
}

function isStoredPath(value: unknown): value is StoredPathSetting {
    return isRecord(value)
        && typeof value.name === "string"
        && typeof value.path === "string"
        && typeof value.createdAt === "number"
        && typeof value.updatedAt === "number";
}

function isThemeMode(value: unknown): value is ThemeMode {
    return value === "light" || value === "dark" || value === "system";
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
