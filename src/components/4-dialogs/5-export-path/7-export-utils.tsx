import { optimize, type Config as SvgoConfig } from "svgo/browser";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { type ExportSettings, type ExportSvgoSettings, type SvgoPresetDefaultPluginName, SVGO_PRESET_DEFAULT_PLUGIN_NAMES } from "@/store/9-ui-settings-types-and-defaults";

export type OptimizeExportSvgResult = {
    svgData: string;
    error: string;
};

export function buildExportSvgData({ pathValue, exportViewBoxDraft, exportSettings = appSettings.export }: { pathValue: string; exportViewBoxDraft: ViewBox; exportSettings?: ExportSettings; }): string {
    if (!pathValue.trim()) {
        return "";
    }

    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = exportSettings;

    const width = Math.max(1e-6, exportViewBoxDraft[2]);
    const height = Math.max(1e-6, exportViewBoxDraft[3]);
    const fillPart = exportFill ? ` fill="${escapeSvgAttribute(exportFillColor)}"` : " fill=\"none\"";
    const strokePart = exportStroke
        ? ` stroke="${escapeSvgAttribute(exportStrokeColor)}" stroke-width="${escapeSvgAttribute(String(exportStrokeWidth))}"`
        : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${escapeSvgAttribute(`${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${width} ${height}`)}"><path d="${escapeSvgAttribute(pathValue)}"${strokePart}${fillPart} /></svg>`;
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
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${(pathName || "svg-path").replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 200);
    return true;
}

function escapeSvgAttribute(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
