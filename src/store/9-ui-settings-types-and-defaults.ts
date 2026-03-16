import type { ThemeMode } from "@/utils";

export interface StoredPathSetting {
    name: string;
    path: string;
    createdAt: number;
    updatedAt: number;
}

export interface PathEditorSettings {
    strokeWidth: number;                  // Stroke width
    zoom: number;                         // Zoom level
    decimals: number;                     // Number of decimals to show
    minifyOutput: boolean;                // Minify output or not
    snapToGrid: boolean;                  // Snap to grid or not (when enabled, the path will be snapped to the grid)
    pointPrecision: number;               // Point precision (number of decimal places to show)
    showTicks: boolean;                   // Show ticks or not (when enabled, the ticks will be shown on the axis)
    tickInterval: number;                 // Tick interval on axis
    fillPreview: boolean;                 // Fill preview or not (when enabled, the fill will be previewed)
    canvasPreview: boolean;               // Canvas preview or not (when enabled, the canvas will be previewed)
    viewPortLocked: boolean;              // View port locked or not
    pathName: string;                     // Path name
    storedPaths: StoredPathSetting[];     // Stored paths
}

export interface ExportSettings {
    exportFill: boolean;                  // Export fill or not
    exportFillColor: string;              // Export fill color
    exportStroke: boolean;                // Export stroke or not
    exportStrokeColor: string;            // Export stroke color
    exportStrokeWidth: number;            // Export stroke width
    rawPath: string;                      // Raw path
}

export interface UiSettings {
    theme: ThemeMode;
    showGrid: boolean;
    showHelpers: boolean;
    darkCanvas: boolean;
    sections: Record<string, boolean>;
    editorPanelSizes: number[];
    pathEditor: PathEditorSettings;
    export: ExportSettings;
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
    viewPortLocked: false,
    pathName: "",
    storedPaths: [],
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
    exportFill: true,
    exportFillColor: "#000000",
    exportStroke: false,
    exportStrokeColor: "#ff0000",
    exportStrokeWidth: 0.1,
    rawPath: "M 20 140 C 40 20, 65 20, 95 140 S 150 260, 180 140",
};

export const DEFAULT_SETTINGS: UiSettings = {
    theme: "light",
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
    sections: { transform: true },
    editorPanelSizes: [33, 67],
    pathEditor: DEFAULT_PATH_EDITOR_SETTINGS,
    export: DEFAULT_EXPORT_SETTINGS,
};
