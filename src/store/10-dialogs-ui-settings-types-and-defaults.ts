export type ScaleDialogAxisMode = "uniform" | "x" | "y";
export type ScaleDialogPivotPoint = "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center";

export interface ScaleDialogUiSettings {
    mode: ScaleDialogAxisMode;
    scaleX: number;
    scaleY: number;
    linked: boolean;
    pivot: ScaleDialogPivotPoint;
    previewOnCanvas: boolean;
}

export interface DialogsUiSettings {
    scale: ScaleDialogUiSettings;
}

export const DEFAULT_DIALOGS_UI_SETTINGS: DialogsUiSettings = {
    scale: {
        mode: "uniform",
        scaleX: 1,
        scaleY: 1,
        linked: true,
        pivot: "center",
        previewOnCanvas: false,
    },
};

function asFiniteNumber(value: unknown, fallback: number): number {
    const n = typeof value === "number"
        ? value
        : typeof value === "string"
            ? Number(value)
            : NaN;
    return Number.isFinite(n) ? n : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
    return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeDialogsUiSettings(value: unknown): DialogsUiSettings {
    const fallback = DEFAULT_DIALOGS_UI_SETTINGS;
    if (!value || typeof value !== "object") return fallback;

    const record = value as Record<string, unknown>;
    const scaleRaw = record.scale;
    if (!scaleRaw || typeof scaleRaw !== "object") return fallback;

    const scaleRecord = scaleRaw as Record<string, unknown>;

    const axisModeAllowed = ["uniform", "x", "y"] as const;
    const pivotAllowed = ["topLeft", "topRight", "bottomLeft", "bottomRight", "center"] as const;

    return {
        scale: {
            mode: asEnum(scaleRecord.mode, axisModeAllowed, fallback.scale.mode),
            scaleX: asFiniteNumber(scaleRecord.scaleX, fallback.scale.scaleX),
            scaleY: asFiniteNumber(scaleRecord.scaleY, fallback.scale.scaleY),
            linked: asBoolean(scaleRecord.linked, fallback.scale.linked),
            pivot: asEnum(scaleRecord.pivot, pivotAllowed, fallback.scale.pivot),
            previewOnCanvas: asBoolean(scaleRecord.previewOnCanvas, fallback.scale.previewOnCanvas),
        },
    };
}

