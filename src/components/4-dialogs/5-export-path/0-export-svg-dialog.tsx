import { useAtom, useAtomValue } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { type ExportViewBoxDraft, exportSvgDialogOpenAtom, exportViewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { appSettings } from "@/store/0-ui-settings";
import { ViewBoxEditor } from "./2-viewbox-editor";
import { FillStrokeControls } from "./1-fill-stroke-controls";
import { SvgPreview } from "./3-svg-preview";

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
