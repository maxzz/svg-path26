import { z } from "zod";
import { type PathEditorSettings, type UiSettings } from "./9-ui-settings-types-and-defaults";

export function normalizeStoredSettings(value: unknown, defaultSettings: UiSettings, defaultPathEditorSettings: PathEditorSettings): UiSettings {
    const fallbackSettings = cloneUiSettings({
        ...defaultSettings,
        pathEditor: defaultPathEditorSettings,
    });

    const pathEditorSchema = createPathEditorSettingsSchema(defaultPathEditorSettings);

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
            exportFill: z.boolean().catch(defaultSettings.exportFill),
            exportFillColor: z.string().catch(defaultSettings.exportFillColor),
            exportStroke: z.boolean().catch(defaultSettings.exportStroke),
            exportStrokeColor: z.string().catch(defaultSettings.exportStrokeColor),
            exportStrokeWidth: z.number().catch(defaultSettings.exportStrokeWidth),
            rawPath: z.string().catch(defaultSettings.rawPath),
            storedPaths: z.array(storedPathSchema).catch(defaultSettings.storedPaths),
        })
    );
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
