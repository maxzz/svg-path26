import { useAtom, useAtomValue } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { exportSvgDialogOpenAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { viewBoxToString } from "@/store/8-utils/1-viewbox-utils";
import { SvgPreview } from "./1-svg-preview";
import { ViewBoxEditor } from "./2-1-viewbox-editor";
import { isCustomPresetId } from "./2-2-viewbox-preset";
import { FillStrokeControls } from "./3-fill-stroke-controls";
import { exportSvgToFile } from "./7-export-utils";

export function ExportSvgDialog() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const exportViewBoxDraft = useAtomValue(viewBoxDraftAtom);
    const exportViewBoxPresetDraft = useAtomValue(viewBoxStrDraftAtom);

    function handleExport() {
        const didExport = exportSvgToFile({ pathValue, exportViewBoxDraft, });
        if (didExport) {
            if (isCustomPresetId(exportViewBoxPresetDraft)) {
                appSettings.export.viewBoxPreset = viewBoxToString(exportViewBoxDraft);
            }
            setOpenExportDialog(false);
        }
    }

    return (
        <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
            <DialogContent className="max-w-sm!">
                <DialogHeader>
                    <DialogTitle>
                        Export SVG
                    </DialogTitle>
                    <DialogDescription>Export current path with chosen styling.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs">
                    <SvgPreview />
                    <ViewBoxEditor />
                    <FillStrokeControls />
                </div>

                <DialogFooter className="mt-1">
                    <Button variant="outline" onClick={() => setOpenExportDialog(false)}>Cancel</Button>
                    <Button onClick={handleExport}>Export</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
