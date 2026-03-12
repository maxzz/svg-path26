import type { PathEditorSettings, StoredPathSetting, UiSettings } from "./9-ui-settings-types-and-defaults";

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

function pickPathEditorSettings(stored: Record<string, unknown>): Partial<PathEditorSettings> {
    const rv: Partial<PathEditorSettings> = {};

    if (typeof stored.strokeWidth === "number") rv.strokeWidth = stored.strokeWidth;
    if (typeof stored.zoom === "number") rv.zoom = stored.zoom;
    if (typeof stored.decimals === "number") rv.decimals = stored.decimals;
    if (typeof stored.minifyOutput === "boolean") rv.minifyOutput = stored.minifyOutput;
    if (typeof stored.snapToGrid === "boolean") rv.snapToGrid = stored.snapToGrid;
    if (typeof stored.pointPrecision === "number") rv.pointPrecision = stored.pointPrecision;
    if (typeof stored.showTicks === "boolean") rv.showTicks = stored.showTicks;
    if (typeof stored.tickInterval === "number") rv.tickInterval = stored.tickInterval;
    if (typeof stored.fillPreview === "boolean") rv.fillPreview = stored.fillPreview;
    if (typeof stored.canvasPreview === "boolean") rv.canvasPreview = stored.canvasPreview;
    if (typeof stored.viewPortLocked === "boolean") rv.viewPortLocked = stored.viewPortLocked;
    if (typeof stored.pathName === "string") rv.pathName = stored.pathName;
    if (typeof stored.exportFill === "boolean") rv.exportFill = stored.exportFill;
    if (typeof stored.exportFillColor === "string") rv.exportFillColor = stored.exportFillColor;
    if (typeof stored.exportStroke === "boolean") rv.exportStroke = stored.exportStroke;
    if (typeof stored.exportStrokeColor === "string") rv.exportStrokeColor = stored.exportStrokeColor;
    if (typeof stored.exportStrokeWidth === "number") rv.exportStrokeWidth = stored.exportStrokeWidth;
    if (typeof stored.rawPath === "string") rv.rawPath = stored.rawPath;
    if (isStoredPathArray(stored.storedPaths)) rv.storedPaths = stored.storedPaths;

    return rv;
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
