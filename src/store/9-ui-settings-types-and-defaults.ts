import type { ThemeMode } from "@/utils";

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

export const DEFAULT_PATH_EDITOR_SETTINGS: PathEditorSettings = {
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

export const DEFAULT_SETTINGS: UiSettings = {
    theme: "light",
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
    transformAccordionOpen: true,
    editorPanelSizes: [33, 67],
    pathEditor: DEFAULT_PATH_EDITOR_SETTINGS,
};
