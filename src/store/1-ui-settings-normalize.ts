import { z } from "zod";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type CanvasSettings, type DialogSettings, type ExportSettings, type FooterSettings, type PathEditorSettings, type UiSettings, DEFAULT_CANVAS_SETTINGS, DEFAULT_DIALOGS_SETTINGS, DEFAULT_EXPORT_SETTINGS, DEFAULT_FOOTER_SETTINGS, DEFAULT_PATH_EDITOR_SETTINGS, DEFAULT_SETTINGS, DEFAULT_VIEWBOX_SETTINGS } from "./9-ui-settings-types-and-defaults";

type MutableViewBox = Writeable<ViewBox>;

export function normalizeStoredSettings(value: unknown): UiSettings {
    const defaultSettings = DEFAULT_SETTINGS;
    const defaultCanvasSettings = DEFAULT_CANVAS_SETTINGS;
    const defaultDialogsSettings = DEFAULT_DIALOGS_SETTINGS;
    const defaultPathEditorSettings = DEFAULT_PATH_EDITOR_SETTINGS;
    const defaultExportSettings = DEFAULT_EXPORT_SETTINGS;
    const defaultFooterSettings = DEFAULT_FOOTER_SETTINGS;

    const fallbackSettings = cloneUiSettings({
        ...defaultSettings,
        canvas: defaultCanvasSettings,
        dialogs: defaultDialogsSettings,
        footer: defaultFooterSettings,
        pathEditor: defaultPathEditorSettings,
        export: defaultExportSettings,
    });

    const canvasSettingsSchema = createCanvasSettingsSchema(defaultCanvasSettings);
    const dialogsSettingsSchema = createDialogsSettingsSchema(defaultDialogsSettings);
    const pathEditorSchema = createPathEditorSettingsSchema(defaultPathEditorSettings);
    const exportSettingsSchema = createExportSettingsSchema(defaultExportSettings);
    const footerSettingsSchema = createFooterSettingsSchema(defaultFooterSettings);

    const uiSettingsSchema = z.preprocess(
        (value) => toUiSettingsRecord(value, defaultSettings),
        z.object({
            theme: themeModeSchema.catch(defaultSettings.theme),
            showSvgPreviewSection: z.boolean().catch(defaultSettings.showSvgPreviewSection),
            canvas: canvasSettingsSchema.catch(defaultCanvasSettings),
            dialogs: dialogsSettingsSchema.catch(defaultDialogsSettings),
            footer: footerSettingsSchema.catch(defaultFooterSettings),
            sections: z.record(z.string(), z.boolean()).catch(defaultSettings.sections),
            editorPanelSizes: z.array(z.number()).catch(defaultSettings.editorPanelSizes),
            pathEditor: pathEditorSchema.catch(toPathEditorSchemaDefaults(defaultPathEditorSettings)),
            export: exportSettingsSchema.catch(defaultExportSettings),
        })
    );

    try {
        const parseResult = uiSettingsSchema.safeParse(value);
        if (!parseResult.success) {
            console.error("Failed to normalize UI settings. Using defaults.", parseResult.error);
            return fallbackSettings;
        }

        return cloneUiSettings({
            ...parseResult.data,
            sections: {
                ...defaultSettings.sections,
                ...parseResult.data.sections,
            },
        });
    } catch (error) {
        console.error("Unexpected error while normalizing UI settings. Using defaults.", error);
        return fallbackSettings;
    }
}

function cloneUiSettings(settings: UiSettings): UiSettings {
    return {
        ...settings,
        canvas: { ...settings.canvas },
        dialogs: {
            ...settings.dialogs,
            scaleToViewBox: { ...settings.dialogs.scaleToViewBox },
        },
        sections: { ...settings.sections },
        editorPanelSizes: [...settings.editorPanelSizes],
        export: { ...settings.export },
        footer: {
            ...settings.footer,
            buttons: { ...settings.footer.buttons },
        },
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

function createCanvasSettingsSchema(defaultSettings: CanvasSettings) {
    return z.preprocess(
        toRecord,
        z.object({
            showGrid: z.boolean().catch(defaultSettings.showGrid),
            showHelpers: z.boolean().catch(defaultSettings.showHelpers),
            snapToGrid: z.boolean().catch(defaultSettings.snapToGrid),
            scrollOnHover: z.boolean().catch(defaultSettings.scrollOnHover),
            showTicks: z.boolean().catch(defaultSettings.showTicks),
            fillPreview: z.boolean().catch(defaultSettings.fillPreview),
            canvasPreview: z.boolean().catch(defaultSettings.canvasPreview),
            showViewBoxFrame: z.boolean().catch(defaultSettings.showViewBoxFrame),
        })
    );
}

function createDialogsSettingsSchema(defaultSettings: DialogSettings) {
    const defaultScaleToViewBoxSettings = defaultSettings.scaleToViewBox;

    return z.preprocess(
        toRecord,
        z.object({
            scaleToViewBox: z.preprocess(
                toRecord,
                z.object({
                    margin: z.number().catch(defaultScaleToViewBoxSettings.margin),
                })
            ).catch(defaultScaleToViewBoxSettings),
        })
    );
}

function createFooterSettingsSchema(defaultSettings: FooterSettings) {
    const defaultButtons = defaultSettings.buttons;

    return z.preprocess(
        toRecord,
        z.object({
            buttons: z.object({
                showTicksToggle: z.boolean().catch(defaultButtons.showTicksToggle),
                showGridToggle: z.boolean().catch(defaultButtons.showGridToggle),
                showSnapToGridToggle: z.boolean().catch(defaultButtons.showSnapToGridToggle),
                showShowHelpersToggle: z.boolean().catch(defaultButtons.showShowHelpersToggle),
                showFillPreviewToggle: z.boolean().catch(defaultButtons.showFillPreviewToggle),
                showViewBoxFrameToggle: z.boolean().catch(defaultButtons.showViewBoxFrameToggle),
            }).catch(defaultButtons),
        })
    );
}

function createPathEditorSettingsSchema(defaultSettings: PathEditorSettings) {
    const fallbackPathEditorSettings = toPathEditorSchemaDefaults(defaultSettings);

    return z.preprocess(
        toRecord,
        z.object({
            strokeWidth: z.number().catch(defaultSettings.strokeWidth),
            zoom: z.number().catch(defaultSettings.zoom),
            uniformScale: z.boolean().catch(defaultSettings.uniformScale),
            decimals: z.number().catch(defaultSettings.decimals),
            minifyOutput: z.boolean().catch(defaultSettings.minifyOutput),
            showSvgTreeConnectorLines: z.boolean().catch(defaultSettings.showSvgTreeConnectorLines),
            dragPrecision: z.number().catch(defaultSettings.dragPrecision),
            tickInterval: z.number().catch(defaultSettings.tickInterval),
            viewPortLocked: z.boolean().catch(defaultSettings.viewPortLocked),
            viewBox: createStoredViewBoxSchema(defaultSettings.viewBox).catch(toMutableViewBox(defaultSettings.viewBox)),
            pathName: z.string().catch(defaultSettings.pathName),
            rawPath: z.string().catch(defaultSettings.rawPath),
            storedPaths: z.array(storedPathSchema).catch(fallbackPathEditorSettings.storedPaths),
        }).catch(fallbackPathEditorSettings)
    );
}

function toUiSettingsRecord(value: unknown, defaultSettings: UiSettings): Record<string, unknown> {
    const record = toRecord(value);
    const canvasRecord = toRecord(record.canvas);
    const pathEditorRecord = toRecord(record.pathEditor);

    // Backwards compatibility for in-development rename:
    // - older localStorage used `canvas.showSvgPreview`
    // - new schema uses `showSvgPreviewSection` on the root UiSettings
    const legacyShowSvgPreview = (canvasRecord as any).showSvgPreview as unknown;
    const showSvgPreviewSection = (record as any).showSvgPreviewSection ?? legacyShowSvgPreview ?? defaultSettings.showSvgPreviewSection;
    const defaultCanvasSettings = defaultSettings.canvas;

    return {
        ...record,
        showSvgPreviewSection,
        canvas: {
            showGrid: canvasRecord.showGrid ?? record.showGrid ?? pathEditorRecord.showGrid ?? defaultCanvasSettings.showGrid,
            showHelpers: canvasRecord.showHelpers ?? record.showHelpers ?? pathEditorRecord.showHelpers ?? defaultCanvasSettings.showHelpers,
            snapToGrid: canvasRecord.snapToGrid ?? record.snapToGrid ?? pathEditorRecord.snapToGrid ?? defaultCanvasSettings.snapToGrid,
            scrollOnHover: canvasRecord.scrollOnHover ?? record.scrollOnHover ?? pathEditorRecord.scrollOnHover ?? defaultCanvasSettings.scrollOnHover,
            showTicks: canvasRecord.showTicks ?? record.showTicks ?? pathEditorRecord.showTicks ?? defaultCanvasSettings.showTicks,
            fillPreview: canvasRecord.fillPreview ?? record.fillPreview ?? pathEditorRecord.fillPreview ?? defaultCanvasSettings.fillPreview,
            canvasPreview: canvasRecord.canvasPreview ?? record.canvasPreview ?? pathEditorRecord.canvasPreview ?? defaultCanvasSettings.canvasPreview,
            showViewBoxFrame: canvasRecord.showViewBoxFrame ?? record.showViewBoxFrame ?? pathEditorRecord.showViewBoxFrame ?? defaultCanvasSettings.showViewBoxFrame,
        },
        pathEditor: {
            ...pathEditorRecord,
            dragPrecision: pathEditorRecord.dragPrecision ?? pathEditorRecord.pointPrecision,
        },
    };
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
            exportViewBoxPreset: z.string().catch(defaultSettings.exportViewBoxPreset),
        })
    );
}

function toRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

const themeModeSchema = z.enum(["light", "dark", "system"]);

function toMutableViewBox(viewBox: ViewBox): MutableViewBox {
    return [viewBox[0], viewBox[1], viewBox[2], viewBox[3]];
}

function toPathEditorSchemaDefaults(defaultSettings: PathEditorSettings) {
    return {
        ...defaultSettings,
        viewBox: toMutableViewBox(defaultSettings.viewBox),
        storedPaths: defaultSettings.storedPaths.map((storedPath) => ({
            ...storedPath,
            viewBox: toMutableViewBox(storedPath.viewBox),
        })),
    };
}

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
    viewBox: createStoredViewBoxSchema(DEFAULT_VIEWBOX_SETTINGS).catch(toMutableViewBox(DEFAULT_VIEWBOX_SETTINGS)),
    createdAt: z.number(),
    updatedAt: z.number(),
});
