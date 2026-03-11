import type { PathEditorSettings, StoredPathSetting, UiSettings } from "./1-ui-settings-shared";

export function normalizeStoredSettings(
    value: unknown,
    defaultSettings: UiSettings,
    defaultPathEditorSettings: PathEditorSettings
): UiSettings {
    const stored = isRecord(value) ? value : {};
    const storedPathEditor = isRecord(stored.pathEditor) ? stored.pathEditor : {};

    return {
        ...defaultSettings,
        ...pickUiSettings(stored),
        pathEditor: {
            ...defaultPathEditorSettings,
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

function isThemeMode(value: unknown): value is UiSettings["theme"] {
    return value === "light" || value === "dark" || value === "system";
}
