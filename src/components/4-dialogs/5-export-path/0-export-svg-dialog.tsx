import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { exportSvgDialogOpenAtom, optimizedExportSvgCodeAtom, rawExportSvgCodeAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { viewBoxToString } from "@/store/8-utils/1-viewbox-utils";
import { SvgPreview } from "./1-svg-preview";
import { ViewBoxEditor } from "./2-1-viewbox-editor";
import { isCustomPresetId } from "./2-2-viewbox-preset";
import { FillStrokeControls } from "./3-fill-stroke-controls";
import { SvgoControls } from "./4-svgo-controls";
import { ExportSvgCodeAccordion } from "./5-export-svg-code";
import { exportSvgToFile } from "./7-export-utils";

export function ExportSvgDialog() {
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const exportViewBoxDraft = useAtomValue(viewBoxDraftAtom);
    const exportViewBoxPresetDraft = useAtomValue(viewBoxStrDraftAtom);
    const rawSvgCode = useAtomValue(rawExportSvgCodeAtom);
    const optimizedSvgCode = useAtomValue(optimizedExportSvgCodeAtom);
    const { enabled: optimizeSvg } = useSnapshot(appSettings.export.svgo);

    function handleExport() {
        const didExport = exportSvgToFile({ svgData: optimizeSvg ? optimizedSvgCode : rawSvgCode });
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
                </div>

                <DialogFooter className="mt-1">
                    <Button variant="outline" onClick={() => setOpenExportDialog(false)}>Cancel</Button>
                    <Button onClick={handleExport}>Export</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
