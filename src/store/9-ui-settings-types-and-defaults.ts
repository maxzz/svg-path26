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
    showSvgTreeConnectorLines: boolean;   // Show connector lines in the SVG input tree
    dragPrecision: number;                // Drag precision (number of decimal places to keep while dragging points)
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
    scrollOnHover: boolean;               // Scroll commands list while hovering canvas points or segments
    showTicks: boolean;                   // Show ticks or not (when enabled, the ticks will be shown on the axis)
    fillPreview: boolean;                 // Fill preview or not (when enabled, the fill will be shown on the canvas)
    canvasPreview: boolean;               // Show stored viewBox frame on canvas
    showViewBoxFrame: boolean;            // Show view box frame or not
}

export interface FooterButtonsSettings {
    showTicksToggle: boolean;
    showGridToggle: boolean;
    showSnapToGridToggle: boolean;
    showShowHelpersToggle: boolean;
    showFillPreviewToggle: boolean;
    showDarkCanvasToggle: boolean;
    showViewBoxFrameToggle: boolean;
}

export interface FooterSettings {
    buttons: FooterButtonsSettings;
}

export interface ExportSettings {
    exportFill: boolean;                  // Export fill or not
    exportFillColor: string;              // Export fill color
    exportStroke: boolean;                // Export stroke or not
    exportStrokeColor: string;            // Export stroke color
    exportStrokeWidth: number;            // Export stroke width
}

export interface ScaleToViewBoxDialogSettings {
    margin: number;                       // ViewBox margin as a percentage of the viewBox size
}

export interface DialogSettings {
    scaleToViewBox: ScaleToViewBoxDialogSettings;
}

export interface UiSettings {
    theme: ThemeMode;                     // Theme mode (light or dark)
    showSvgPreviewSection: boolean;       // Show "SVG preview" section above SVG input
    canvas: CanvasSettings;               // Canvas settings
    dialogs: DialogSettings;              // Dialog-specific settings
    footer: FooterSettings;               // Footer button visibility
    sections: Record<string, boolean>;    // Props panel sections collapsed state
    editorPanelSizes: number[];           // Props and Canvas editor panel sizes
    pathEditor: PathEditorSettings;       // Path editor settings
    export: ExportSettings;               // Export settings
}

export const DEFAULT_VIEWBOX_SETTINGS: ViewBox = [0, 0, 24, 24];

export const DEFAULT_PATH_EDITOR_SETTINGS: PathEditorSettings = {
    strokeWidth: 1,                       //TODO: set initial stroke width based on viewPort and viewBox
    zoom: 1,
    uniformScale: true,
    decimals: 3,
    minifyOutput: false,
    showSvgTreeConnectorLines: true,
    dragPrecision: 3,
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
    scrollOnHover: true,
    showTicks: false,
    fillPreview: false,
    canvasPreview: false,
    showViewBoxFrame: false,
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
    buttons: {
        showTicksToggle: true,
        showGridToggle: true,
        showSnapToGridToggle: true,
        showShowHelpersToggle: true,
        showFillPreviewToggle: true,
        showDarkCanvasToggle: true,
        showViewBoxFrameToggle: true,
    },
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
    exportFill: true,
    exportFillColor: "#000000",
    exportStroke: false,
    exportStrokeColor: "#ff0000",
    exportStrokeWidth: 0.1,
};

export const DEFAULT_DIALOGS_SETTINGS: DialogSettings = {
    scaleToViewBox: {
        margin: 1,
    },
};

export const DEFAULT_SETTINGS: UiSettings = {
    theme: "light",
    showSvgPreviewSection: false,
    canvas: DEFAULT_CANVAS_SETTINGS,
    dialogs: DEFAULT_DIALOGS_SETTINGS,
    footer: DEFAULT_FOOTER_SETTINGS,
    sections: { "svg-preview": true, "svg-input": true, transform: true, options: true },
    editorPanelSizes: [33, 67],
    pathEditor: DEFAULT_PATH_EDITOR_SETTINGS,
    export: DEFAULT_EXPORT_SETTINGS,
};
