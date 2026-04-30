import { optimize, type Config as SvgoConfig } from "svgo/browser";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { SVGO_PRESET_DEFAULT_PLUGIN_NAMES, type SvgoPresetDefaultPluginName } from "@/store/2-svgo-presets";
import { type ExportSettings, type ExportSvgoSettings } from "@/store/9-ui-settings-types-and-defaults";
import { buildExportSvgData as buildExportSvgDataFromSource } from "./9-export-source";
import { type SvgInputDocument } from "@/svg-core/3-svg-input";

export type OptimizeExportSvgResult = {
    svgData: string;
    error: string;
};

export function buildExportSvgData({ svgInputDocument, pathValue, pathViewBox, exportViewBoxDraft, exportSettings = appSettings.export }: { svgInputDocument: SvgInputDocument | null; pathValue: string; pathViewBox: ViewBox; exportViewBoxDraft: ViewBox; exportSettings?: ExportSettings; }): string {
    return buildExportSvgDataFromSource({
        svgInputDocument,
        pathValue,
        pathViewBox,
        exportViewBoxDraft,
        exportSettings,
    });
}

export function optimizeExportSvgData(svgData: string, svgoSettings: ExportSvgoSettings): OptimizeExportSvgResult {
    if (!svgData.trim()) {
        return { svgData: "", error: "" };
    }

    try {
        const result = optimize(svgData, createSvgoConfig(svgoSettings));
        return { svgData: result.data, error: "" };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to optimize SVG.";
        return { svgData, error: message };
    }
}

export function createSvgoConfig(svgoSettings: ExportSvgoSettings): SvgoConfig {
    const overrides = Object.fromEntries(
        SVGO_PRESET_DEFAULT_PLUGIN_NAMES
            .filter((pluginName) => !svgoSettings.presetDefault[pluginName])
            .map((pluginName) => [pluginName, false])
    ) as Partial<Record<SvgoPresetDefaultPluginName, false>>;

    return {
        multipass: svgoSettings.multipass,
        floatPrecision: svgoSettings.floatPrecision,
        plugins: [
            {
                name: "preset-default",
                params: {
                    floatPrecision: svgoSettings.floatPrecision,
                    overrides,
                },
            },
        ],
    };
}

export function exportSvgToFile({ svgData }: { svgData: string; }): boolean {
    if (!svgData.trim()) {
        return false;
    }

    const { pathName } = appSettings.pathEditor;
    return downloadTextFile({
        data: svgData,
        fileName: `${normalizeExportFileBaseName(pathName)}.svg`,
        mimeType: "image/svg+xml",
    });
}

export function downloadTextFile({ data, fileName, mimeType }: { data: string; fileName: string; mimeType: string; }): boolean {
    if (!data.trim()) {
        return false;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 200);
    return true;
}

export function normalizeExportFileBaseName(pathName: string): string {
    const normalized = pathName
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    return normalized || "svg-path";
}
