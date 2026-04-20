import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { type ExportViewBoxDraft, exportSvgDialogOpenAtom, exportViewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { appSettings } from "@/store/0-ui-settings";
import { ViewBoxEditor } from "./2-viewbox-editor";
import { FillStrokeControls } from "./1-fill-stroke-controls";

export function ExportSvgDialog() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const exportViewBoxDraft = useAtomValue(exportViewBoxDraftAtom);

    function handleExport() {
        const didExport = exportSvgToFile({ pathValue, exportViewBoxDraft, });
        if (didExport) {
            setOpenExportDialog(false);
        }
    }

    return (
        <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
            <DialogContent className="max-w-sm!">
                <DialogHeader>
                    <DialogTitle>Export SVG</DialogTitle>
                    <DialogDescription>Export current path with chosen styling.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs">
                    <FillStrokeControls />
                    <ViewBoxEditor />
                    <SvgPreview />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenExportDialog(false)}>Cancel</Button>
                    <Button onClick={handleExport}>Export</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}

function SvgPreview() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = useSnapshot(appSettings.export);

    const exportViewBoxDraft = useAtomValue(exportViewBoxDraftAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const previewWidth = Math.max(1e-6, exportViewBoxDraft[2]);
    const previewHeight = Math.max(1e-6, exportViewBoxDraft[3]);
    return (
        <div className="rounded border p-2">
            <p className="mb-2 text-[11px] text-muted-foreground">Live preview</p>
            <svg
                className="h-40 w-full rounded bg-muted/20"
                viewBox={`${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${previewWidth} ${previewHeight}`}
            >
                <defs>
                    <pattern id="export-preview-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                    </pattern>
                </defs>
                <rect
                    x={exportViewBoxDraft[0]}
                    y={exportViewBoxDraft[1]}
                    width={previewWidth}
                    height={previewHeight}
                    fill="url(#export-preview-grid)"
                />
                <path
                    d={pathValue || "M 0 0"}
                    fill={exportFill ? exportFillColor : "none"}
                    stroke={exportStroke ? exportStrokeColor : "none"}
                    strokeWidth={exportStroke ? exportStrokeWidth : 0}
                />
            <rect
                x={exportViewBoxDraft[0]}
                y={exportViewBoxDraft[1]}
                width={previewWidth}
                height={previewHeight}
                fill="none"
                stroke="oklch(0.6 0 0 / 0.75)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
            />
            </svg>
        </div>
    );
}

function exportSvgToFile({ pathValue, exportViewBoxDraft }: { pathValue: string; exportViewBoxDraft: ExportViewBoxDraft; }): boolean {
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
