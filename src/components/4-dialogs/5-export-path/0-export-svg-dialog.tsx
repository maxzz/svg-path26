import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { doSetExportReactComponentAtom, exportSvgDialogOpenAtom, optimizedExportSvgCodeAtom, rawExportSvgCodeAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { viewBoxToString } from "@/store/8-utils/1-viewbox-utils";
import { SvgPreview } from "./1-svg-preview";
import { ViewBoxEditor } from "./2-1-viewbox-editor";
import { isCustomPresetId } from "./2-2-viewbox-preset";
import { FillStrokeControls } from "./3-fill-stroke-controls";
import { SvgoControls } from "./4-svgo-controls";
import { ExportSvgCodeAccordion } from "./5-export-svg-code";
import { exportReactComponentToFile } from "./6-export-react-component";
import { exportSvgToFile } from "./7-export-utils";

export function ExportSvgDialog() {
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const exportViewBoxDraft = useAtomValue(viewBoxDraftAtom);
    const exportViewBoxPresetDraft = useAtomValue(viewBoxStrDraftAtom);
    const rawSvgCode = useAtomValue(rawExportSvgCodeAtom);
    const optimizedSvgCode = useAtomValue(optimizedExportSvgCodeAtom);
    const exportSettings = useSnapshot(appSettings.export);
    const optimizeSvg = exportSettings.svgo.enabled;
    const setExportReactComponent = useSetAtom(doSetExportReactComponentAtom);

    function handleExport() {
        const svgData = optimizeSvg ? optimizedSvgCode : rawSvgCode;
        const didExport = exportSettings.exportReactComponent
            ? exportReactComponentToFile({ svgData })
            : exportSvgToFile({ svgData });
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
                    <label className="flex items-center gap-2 px-2 py-1.5 border rounded cursor-pointer select-none">
                        <Checkbox
                            className="size-3.5"
                            checked={exportSettings.exportReactComponent}
                            onCheckedChange={(checked) => setExportReactComponent(checked === true)}
                        />
                        <span>Export as React component</span>
                    </label>
                </div>

                <DialogFooter className="mt-1">
                    <Button variant="outline" onClick={() => setOpenExportDialog(false)}>Cancel</Button>
                    <Button onClick={handleExport}>Export</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
