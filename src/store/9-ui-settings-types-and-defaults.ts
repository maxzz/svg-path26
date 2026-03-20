import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type ThemeMode } from "@/utils";

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
    pointPrecision: number;               // Point precision (number of decimal places to show)
    tickInterval: number;                 // Tick interval on axis
    viewPortLocked: boolean;              // View port locked or not
    viewBox: ViewBox;                     // Stored canvas viewBox
    pathName: string;                     // Path name
    rawPath: string;                      // Raw path
    storedPaths: StoredPathSetting[];     // Stored paths
}

export interface CanvasSettings {
    showGrid: boolean;                    // Show grid or not
    showHelpers: boolean;                 // Show helpers or not
    darkCanvas: boolean;                  // Dark canvas or not
    snapToGrid: boolean;                  // Snap to grid or not (when enabled, the path will be snapped to the grid)
    showTicks: boolean;                   // Show ticks or not (when enabled, the ticks will be shown on the axis)
    fillPreview: boolean;                 // Fill preview or not (when enabled, the fill will be shown on the canvas)
    canvasPreview: boolean;               // Show stored viewBox frame on canvas
    showViewBoxFrame: boolean;            // Show view box frame or not
}

export interface ExportSettings {
    exportFill: boolean;                  // Export fill or not
    exportFillColor: string;              // Export fill color
    exportStroke: boolean;                // Export stroke or not
    exportStrokeColor: string;            // Export stroke color
    exportStrokeWidth: number;            // Export stroke width
}

export interface UiSettings {
    theme: ThemeMode;                     // Theme mode (light or dark)
    canvas: CanvasSettings;               // Canvas settings
    sections: Record<string, boolean>;    // Props panel sections collapsed state
    editorPanelSizes: number[];           // Props and Canvas editor panel sizes
    pathEditor: PathEditorSettings;       // Path editor settings
    export: ExportSettings;               // Export settings
}

export const DEFAULT_VIEWBOX_SETTINGS: ViewBox = [0, 0, 24, 24];

export const DEFAULT_PATH_EDITOR_SETTINGS: PathEditorSettings = {
    strokeWidth: 3,
    zoom: 1,
    uniformScale: true,
    decimals: 3,
    minifyOutput: false,
    pointPrecision: 3,
    tickInterval: 5,
    viewPortLocked: false,
    viewBox: [...DEFAULT_VIEWBOX_SETTINGS],
    pathName: "",
    rawPath: "M 20 140 C 40 20, 65 20, 95 140 S 150 260, 180 140",
    storedPaths: [],
};

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
    snapToGrid: true,
    showTicks: false,
    fillPreview: false,
    canvasPreview: false,
    showViewBoxFrame: false,
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
    canvas: DEFAULT_CANVAS_SETTINGS,
    sections: { transform: true, options: true },
    editorPanelSizes: [33, 67],
    pathEditor: DEFAULT_PATH_EDITOR_SETTINGS,
    export: DEFAULT_EXPORT_SETTINGS,
};
