import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { optionsDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { doNormalizePathAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { CheckboxRow, NumberRow } from "./1-options-controls";
import { ViewBoxControls } from "./2-viewbox-controls";
import { isThemeDark, toggleTheme } from "@/utils";

export function OptionsDialog() {
    const [open, setOpen] = useAtom(optionsDialogOpenAtom);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Options</DialogTitle>
                    <DialogDescription>
                        View and editor options.
                    </DialogDescription>
                </DialogHeader>

                <OptionsControls />

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function OptionsControls() {
    const { showTicks, snapToGrid, scrollOnHover, fillPreview, showGrid, showViewBoxFrame, canvasPreview, showHelpers } = useSnapshot(appSettings.canvas);
    const { minifyOutput, dragPrecision, tickInterval, showSvgTreeConnectorLines } = useSnapshot(appSettings.pathEditor);
    const { theme, showSvgPreviewSection } = useSnapshot(appSettings);
    const isDarkTheme = isThemeDark(theme);

    const doNormalizePath = useSetAtom(doNormalizePathAtom);

    return (
        <div className="pl-2.5 pr-2 text-[11px] space-y-2.5">

            <ViewBoxControls className="max-w-[320px]" />

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                <Separator />
                <CheckboxRow label="Toggle dark theme" className="col-start-1" checked={isDarkTheme} onCheckedChange={() => toggleTheme(theme)} />
                <Separator />

                <CheckboxRow label="Show grid" className="col-start-1" checked={showGrid} onCheckedChange={(checked) => appSettings.canvas.showGrid = checked} />
                <CheckboxRow label="Snap to grid" className="col-start-1" checked={snapToGrid} onCheckedChange={(checked) => appSettings.canvas.snapToGrid = checked} />
                <NumberRow label="Drag precision" className="col-start-2" value={dragPrecision} min={0} max={8} step={1} onValueChange={(value) => appSettings.pathEditor.dragPrecision = value} />

                <div className="col-start-1 flex items-center gap-2">
                    <CheckboxRow label="Show ticks" checked={showTicks} onCheckedChange={(checked) => appSettings.canvas.showTicks = checked} />
                    <input
                        className="h-6 w-12 rounded border bg-background px-2 text-[11px] disabled:opacity-20"
                        disabled={!showTicks}
                        type="number"
                        value={tickInterval}
                        min={1}
                        step={1}
                        onChange={(event) => appSettings.pathEditor.tickInterval = Math.max(1, Number(event.target.value) || 1)}
                    />
                </div>

                <CheckboxRow label="Show point controls" className="col-start-1" checked={showHelpers} onCheckedChange={(checked) => appSettings.canvas.showHelpers = checked} />
                <CheckboxRow label="Fill path" className="col-start-1" checked={fillPreview} onCheckedChange={(checked) => appSettings.canvas.fillPreview = checked} />
                <CheckboxRow label="Show viewBox frame" checked={showViewBoxFrame} className="col-start-1" onCheckedChange={(checked) => { appSettings.canvas.showViewBoxFrame = checked; }} />
                <CheckboxRow label="Preview mode" checked={canvasPreview} className="col-start-1" onCheckedChange={(checked) => { appSettings.canvas.canvasPreview = checked; }} />
                <Separator />

                <CheckboxRow label="Minify output" checked={minifyOutput} className="col-start-1" onCheckedChange={(checked) => { appSettings.pathEditor.minifyOutput = checked; doNormalizePath(); }} />
                <Separator />

                <CheckboxRow label="Scroll on hover" className="col-start-1" checked={scrollOnHover} onCheckedChange={(checked) => appSettings.canvas.scrollOnHover = checked} />
                <Separator />
                
                <CheckboxRow label="Show SVG tree lines" className="col-start-1" checked={showSvgTreeConnectorLines} onCheckedChange={(checked) => appSettings.pathEditor.showSvgTreeConnectorLines = checked} />
                <Separator />

                <CheckboxRow label="SVG preview section" className="col-start-1" checked={showSvgPreviewSection} onCheckedChange={(checked) => appSettings.showSvgPreviewSection = checked} />
                <Separator />
            </div>
        </div>
    );
}

function Separator() {
    return (
        <div aria-hidden="true" className="-mx-1 my-1 h-[0.1px] col-span-2 bg-foreground" />
    );
}
