import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { doExportFromDialogAtom, exportDialogBusyAtom, exportSvgDialogOpenAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { viewBoxToString } from "@/store/8-utils/1-viewbox-utils";
import { SvgPreview } from "./1-svg-preview";
import { ViewBoxEditor } from "./2-1-viewbox-editor";
import { isCustomPresetId } from "./2-2-viewbox-preset";
import { FillStrokeControls } from "./3-fill-stroke-controls";
import { SvgoControls } from "./4-svgo-controls";
import { ExportSvgCodeAccordion } from "./5-export-svg-code";
import { ReactExportControls } from "./6-react-export-controls";

export function ExportSvgDialog() {
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const exportViewBoxDraft = useAtomValue(viewBoxDraftAtom);
    const exportViewBoxPresetDraft = useAtomValue(viewBoxStrDraftAtom);
    const exportDialogBusy = useAtomValue(exportDialogBusyAtom);
    const exportFromDialog = useSetAtom(doExportFromDialogAtom);

    async function handleExport() {
        const didExport = await exportFromDialog();
        if (didExport) {
            if (isCustomPresetId(exportViewBoxPresetDraft)) {
                appSettings.export.viewBoxPreset = viewBoxToString(exportViewBoxDraft);
            }
            setOpenExportDialog(false);
        }
    }

    return (
        <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
            <DialogContent className="max-w-sm!" data-dialog="export-svg">
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
                    <SvgoControls />
                    <ExportSvgCodeAccordion />
                    <ReactExportControls />
                </div>

                <DialogFooter className="mt-1">
                    <Button variant="outline" onClick={() => setOpenExportDialog(false)} disabled={exportDialogBusy}>Cancel</Button>
                    <Button onClick={() => void handleExport()} disabled={exportDialogBusy}>{exportDialogBusy ? "Exporting..." : "Export"}</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
