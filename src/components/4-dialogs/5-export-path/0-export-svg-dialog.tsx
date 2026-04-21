import { useAtom, useAtomValue } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { exportSvgDialogOpenAtom, exportViewBoxDraftAtom, exportViewBoxPresetDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { appSettings } from "@/store/0-ui-settings";
import { FillStrokeControls } from "./1-fill-stroke-controls";
import { ViewBoxEditor } from "./2-viewbox-editor";
import { SvgPreview } from "./4-svg-preview";
import { exportSvgToFile } from "./7-export-utils";
import { isCustomPresetId, viewBoxToString } from "./3-viewbox-preset";

export function ExportSvgDialog() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const exportViewBoxDraft = useAtomValue(exportViewBoxDraftAtom);
    const exportViewBoxPresetDraft = useAtomValue(exportViewBoxPresetDraftAtom);

    function handleExport() {
        const didExport = exportSvgToFile({ pathValue, exportViewBoxDraft, });
        if (didExport) {
            if (isCustomPresetId(exportViewBoxPresetDraft)) {
                appSettings.export.exportViewBoxPreset = viewBoxToString(exportViewBoxDraft);
            }
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
