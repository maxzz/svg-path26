import { type ExportViewBoxDraft } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { appSettings } from "@/store/0-ui-settings";

export function exportSvgToFile({ pathValue, exportViewBoxDraft }: { pathValue: string; exportViewBoxDraft: ExportViewBoxDraft; }): boolean {
    if (!pathValue.trim()) {
        return false;
    }

    const { pathName } = appSettings.pathEditor;
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = appSettings.export;

    const width = Math.max(1e-6, exportViewBoxDraft[2]);
    const height = Math.max(1e-6, exportViewBoxDraft[3]);
    const fillPart = exportFill ? ` fill="${exportFillColor}"` : " fill=\"none\"";
    const strokePart = exportStroke
        ? ` stroke="${exportStrokeColor}" stroke-width="${exportStrokeWidth}"`
        : "";
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${width} ${height}"><path d="${pathValue}"${strokePart}${fillPart} /></svg>`;
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
