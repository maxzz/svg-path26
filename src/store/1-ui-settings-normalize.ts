import { z } from "zod";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type ExportSettings, type PathEditorSettings, type UiSettings, DEFAULT_EXPORT_SETTINGS, DEFAULT_PATH_EDITOR_SETTINGS, DEFAULT_SETTINGS, DEFAULT_VIEWBOX_SETTINGS } from "./9-ui-settings-types-and-defaults";

export function normalizeStoredSettings(value: unknown): UiSettings {
    const defaultSettings = DEFAULT_SETTINGS;
    const defaultPathEditorSettings = DEFAULT_PATH_EDITOR_SETTINGS;
    const defaultExportSettings = DEFAULT_EXPORT_SETTINGS;

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
        const parseResult = uiSettingsSchema.safeParse(value);
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
            viewBox: [...settings.pathEditor.viewBox] as ViewBox,
            storedPaths: settings.pathEditor.storedPaths.map((storedPath) => ({
                ...storedPath,
                viewBox: [...storedPath.viewBox] as ViewBox,
            })),
        },
    };
}

function createPathEditorSettingsSchema(defaultSettings: PathEditorSettings) {
    return z.preprocess(
        toRecord,
        z.object({
            strokeWidth: z.number().catch(defaultSettings.strokeWidth),
            zoom: z.number().catch(defaultSettings.zoom),
            uniformScale: z.boolean().catch(defaultSettings.uniformScale),
            decimals: z.number().catch(defaultSettings.decimals),
            minifyOutput: z.boolean().catch(defaultSettings.minifyOutput),
            snapToGrid: z.boolean().catch(defaultSettings.snapToGrid),
            pointPrecision: z.number().catch(defaultSettings.pointPrecision),
            showTicks: z.boolean().catch(defaultSettings.showTicks),
            tickInterval: z.number().catch(defaultSettings.tickInterval),
            fillPreview: z.boolean().catch(defaultSettings.fillPreview),
            canvasPreview: z.boolean().catch(defaultSettings.canvasPreview),
            viewPortLocked: z.boolean().catch(defaultSettings.viewPortLocked),
            showViewBoxFrame: z.boolean().catch(defaultSettings.showViewBoxFrame),
            viewBox: createStoredViewBoxSchema(defaultSettings.viewBox).catch(defaultSettings.viewBox),
            pathName: z.string().catch(defaultSettings.pathName),
            rawPath: z.string().catch(defaultSettings.rawPath),
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
        })
    );
}

function toRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

const themeModeSchema = z.enum(["light", "dark", "system"]);

function createStoredViewBoxSchema(defaultSettings: ViewBox) {
    return z.tuple([
        z.number().catch(defaultSettings[0]),
        z.number().catch(defaultSettings[1]),
        z.number().catch(defaultSettings[2]),
        z.number().catch(defaultSettings[3]),
    ]);
}

const storedPathSchema = z.object({
    name: z.string(),
    path: z.string(),
    viewBox: createStoredViewBoxSchema(DEFAULT_VIEWBOX_SETTINGS).catch(DEFAULT_VIEWBOX_SETTINGS),
    createdAt: z.number(),
    updatedAt: z.number(),
});
