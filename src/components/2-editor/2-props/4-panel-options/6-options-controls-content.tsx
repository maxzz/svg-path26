import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { doNormalizePathAtom } from "@/store/0-atoms/2-4-editor-actions";
import { appSettings } from "@/store/0-ui-settings";
import { CheckboxRow, NumberRow, ViewBoxControls, ViewportControls } from "./7-options-panel-rows";

export function OptionsControls() {
    const { showTicks, snapToGrid, scrollOnHover, fillPreview, showGrid, showViewBoxFrame, canvasPreview, showHelpers } = useSnapshot(appSettings.canvas);
    const { minifyOutput, dragPrecision, tickInterval, showSvgTreeConnectorLines } = useSnapshot(appSettings.pathEditor);

    const doNormalizePath = useSetAtom(doNormalizePathAtom);

    return (
        <div className="pl-2.5 pr-2 max-w-[320px] text-[11px] space-y-2.5">
            <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground select-none">
                    viewBox
                </span>
                <ViewBoxControls />

                {/* <span className="text-[11px] text-muted-foreground select-none">
                    viewPort
                </span>
                <ViewportControls /> */}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                <CheckboxRow label="Show grid" className="col-start-1" checked={showGrid} onCheckedChange={(checked) => appSettings.canvas.showGrid = checked} />
                <NumberRow label="Drag precision" className="col-start-2" value={dragPrecision} min={0} max={8} step={1} onValueChange={(value) => appSettings.pathEditor.dragPrecision = value} />
                <CheckboxRow label="Snap to grid" className="col-start-1" checked={snapToGrid} onCheckedChange={(checked) => appSettings.canvas.snapToGrid = checked} />
                <CheckboxRow label="Scroll on hover" className="col-start-1" checked={scrollOnHover} onCheckedChange={(checked) => appSettings.canvas.scrollOnHover = checked} />

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
                <CheckboxRow label="Show SVG tree lines" className="col-start-1" checked={showSvgTreeConnectorLines} onCheckedChange={(checked) => appSettings.pathEditor.showSvgTreeConnectorLines = checked} />
                <CheckboxRow label="Minify output" checked={minifyOutput} className="col-start-1" onCheckedChange={(checked) => { appSettings.pathEditor.minifyOutput = checked; doNormalizePath(); }} />
                
                <CheckboxRow label="Show viewBox frame" checked={showViewBoxFrame} className="col-start-1" onCheckedChange={(checked) => { appSettings.canvas.showViewBoxFrame = checked; }} />
                <CheckboxRow label="Preview mode" checked={canvasPreview} className="col-start-1" onCheckedChange={(checked) => { appSettings.canvas.canvasPreview = checked; }} />
            </div>
        </div>
    );
}
