import { z } from "zod";
import { type ExportSettings, type PathEditorSettings, type UiSettings } from "./9-ui-settings-types-and-defaults";

export function normalizeStoredSettings(
    value: unknown,
    defaultSettings: UiSettings,
    defaultPathEditorSettings: PathEditorSettings,
    defaultExportSettings: ExportSettings,
): UiSettings {
    const fallbackSettings = cloneUiSettings({
        ...defaultSettings,
        pathEditor: defaultPathEditorSettings,
        export: defaultExportSettings,
    });

    const pathEditorSchema = createPathEditorSettingsSchema(defaultPathEditorSettings);
    const exportSettingsSchema = createExportSettingsSchema(defaultExportSettings);

    const uiSettingsSchema = z.preprocess(
        toRecord,
        z.object({
            theme: themeModeSchema.catch(defaultSettings.theme),
            showGrid: z.boolean().catch(defaultSettings.showGrid),
            showHelpers: z.boolean().catch(defaultSettings.showHelpers),
            darkCanvas: z.boolean().catch(defaultSettings.darkCanvas),
            sections: z.record(z.string(), z.boolean()).catch(defaultSettings.sections),
            editorPanelSizes: z.array(z.number()).catch(defaultSettings.editorPanelSizes),
            pathEditor: pathEditorSchema.catch(defaultPathEditorSettings),
            export: exportSettingsSchema.catch(defaultExportSettings),
        })
    );

    try {
        const parseResult = uiSettingsSchema.safeParse(migrateLegacyExportSettings(value, defaultExportSettings));
        if (!parseResult.success) {
            console.error("Failed to normalize UI settings. Using defaults.", parseResult.error);
            return fallbackSettings;
        }

        return cloneUiSettings(parseResult.data);
    } catch (error) {
        console.error("Unexpected error while normalizing UI settings. Using defaults.", error);
        return fallbackSettings;
    }
}

function cloneUiSettings(settings: UiSettings): UiSettings {
    return {
        ...settings,
        sections: { ...settings.sections },
        editorPanelSizes: [...settings.editorPanelSizes],
        export: { ...settings.export },
        pathEditor: {
            ...settings.pathEditor,
            storedPaths: settings.pathEditor.storedPaths.map((storedPath) => ({ ...storedPath })),
        },
    };
}

function createPathEditorSettingsSchema(defaultSettings: PathEditorSettings) {
    return z.preprocess(
        toRecord,
        z.object({
            strokeWidth: z.number().catch(defaultSettings.strokeWidth),
            zoom: z.number().catch(defaultSettings.zoom),
            decimals: z.number().catch(defaultSettings.decimals),
            minifyOutput: z.boolean().catch(defaultSettings.minifyOutput),
            snapToGrid: z.boolean().catch(defaultSettings.snapToGrid),
            pointPrecision: z.number().catch(defaultSettings.pointPrecision),
            showTicks: z.boolean().catch(defaultSettings.showTicks),
            tickInterval: z.number().catch(defaultSettings.tickInterval),
            fillPreview: z.boolean().catch(defaultSettings.fillPreview),
            canvasPreview: z.boolean().catch(defaultSettings.canvasPreview),
            viewPortLocked: z.boolean().catch(defaultSettings.viewPortLocked),
            pathName: z.string().catch(defaultSettings.pathName),
            storedPaths: z.array(storedPathSchema).catch(defaultSettings.storedPaths),
        })
    );
}

function createExportSettingsSchema(defaultSettings: ExportSettings) {
    return z.preprocess(
        toRecord,
        z.object({
            exportFill: z.boolean().catch(defaultSettings.exportFill),
            exportFillColor: z.string().catch(defaultSettings.exportFillColor),
            exportStroke: z.boolean().catch(defaultSettings.exportStroke),
            exportStrokeColor: z.string().catch(defaultSettings.exportStrokeColor),
            exportStrokeWidth: z.number().catch(defaultSettings.exportStrokeWidth),
            rawPath: z.string().catch(defaultSettings.rawPath),
        })
    );
}

function migrateLegacyExportSettings(value: unknown, defaultSettings: ExportSettings): Record<string, unknown> {
    const root = toRecord(value);
    const currentExport = toRecord(root.export);
    const hasCurrentExportValues = EXPORT_SETTINGS_KEYS.some((key) => Object.prototype.hasOwnProperty.call(currentExport, key));
    if (hasCurrentExportValues) {
        return root;
    }

    const legacyPathEditor = toRecord(root.pathEditor);
    const hasLegacyExportValues = EXPORT_SETTINGS_KEYS.some((key) => Object.prototype.hasOwnProperty.call(legacyPathEditor, key));
    if (!hasLegacyExportValues) {
        return root;
    }

    return {
        ...root,
        export: {
            exportFill: legacyPathEditor.exportFill ?? defaultSettings.exportFill,
            exportFillColor: legacyPathEditor.exportFillColor ?? defaultSettings.exportFillColor,
            exportStroke: legacyPathEditor.exportStroke ?? defaultSettings.exportStroke,
            exportStrokeColor: legacyPathEditor.exportStrokeColor ?? defaultSettings.exportStrokeColor,
            exportStrokeWidth: legacyPathEditor.exportStrokeWidth ?? defaultSettings.exportStrokeWidth,
            rawPath: legacyPathEditor.rawPath ?? defaultSettings.rawPath,
        },
    };
}

function toRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

const themeModeSchema = z.enum(["light", "dark", "system"]);

const storedPathSchema = z.object({
    name: z.string(),
    path: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

const EXPORT_SETTINGS_KEYS: Array<keyof ExportSettings> = [
    "exportFill",
    "exportFillColor",
    "exportStroke",
    "exportStrokeColor",
    "exportStrokeWidth",
    "rawPath",
];
