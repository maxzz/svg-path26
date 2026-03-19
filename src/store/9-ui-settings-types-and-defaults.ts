import type { ThemeMode } from "@/utils";

export type ViewBox = readonly [number, number, number, number];

export interface StoredPathSetting {
    name: string;
    path: string;
    viewBox: ViewBox;
    createdAt: number;
    updatedAt: number;
}

export interface PathEditorSettings {
    strokeWidth: number;                  // Stroke width
    zoom: number;                         // Zoom level
    uniformScale: boolean;                // Lock scale X and Y together in Path Operations
    decimals: number;                     // Number of decimals to show
    minifyOutput: boolean;                // Minify output or not
    snapToGrid: boolean;                  // Snap to grid or not (when enabled, the path will be snapped to the grid)
    pointPrecision: number;               // Point precision (number of decimal places to show)
    showTicks: boolean;                   // Show ticks or not (when enabled, the ticks will be shown on the axis)
    tickInterval: number;                 // Tick interval on axis
    fillPreview: boolean;                 // Fill preview or not (when enabled, the fill will be previewed)
    canvasPreview: boolean;               // Canvas preview or not (when enabled, the canvas will be previewed)
    viewPortLocked: boolean;              // View port locked or not
    showViewBoxFrame: boolean;            // Show stored viewBox frame on canvas
    viewBox: ViewBox;                     // Stored canvas viewBox
    pathName: string;                     // Path name
    rawPath: string;                      // Raw path
    storedPaths: StoredPathSetting[];     // Stored paths
}

export interface ExportSettings {
    exportFill: boolean;                  // Export fill or not
    exportFillColor: string;              // Export fill color
    exportStroke: boolean;                // Export stroke or not
    exportStrokeColor: string;            // Export stroke color
    exportStrokeWidth: number;            // Export stroke width
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

export const DEFAULT_VIEWBOX_SETTINGS: ViewBox = [0, 0, 24, 24];

export const DEFAULT_PATH_EDITOR_SETTINGS: PathEditorSettings = {
    strokeWidth: 3,
    zoom: 1,
    uniformScale: true,
    decimals: 3,
    minifyOutput: false,
    snapToGrid: true,
    pointPrecision: 3,
    showTicks: false,
    tickInterval: 5,
    fillPreview: false,
    canvasPreview: false,
    viewPortLocked: false,
    showViewBoxFrame: false,
    viewBox: [...DEFAULT_VIEWBOX_SETTINGS],
    pathName: "",
    rawPath: "M 20 140 C 40 20, 65 20, 95 140 S 150 260, 180 140",
    storedPaths: [],
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
    exportFill: true,
    exportFillColor: "#000000",
    exportStroke: false,
    exportStrokeColor: "#ff0000",
    exportStrokeWidth: 0.1,
};

export const DEFAULT_SETTINGS: UiSettings = {
    theme: "light",
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
    sections: { transform: true, options: true },
    editorPanelSizes: [33, 67],
    pathEditor: DEFAULT_PATH_EDITOR_SETTINGS,
    export: DEFAULT_EXPORT_SETTINGS,
};
