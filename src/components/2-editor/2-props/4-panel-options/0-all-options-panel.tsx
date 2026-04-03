import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { doNormalizePathAtom } from "@/store/0-atoms/2-4-editor-actions";
import { appSettings } from "@/store/0-ui-settings";
import { CheckboxRow, NumberRow } from "../../../4-dialogs/8-3-options/1-options-controls";
import { ViewBoxControls } from "../../../4-dialogs/8-3-options/2-viewbox-controls";

export function OptionsPanel() {
    const { snapToGrid, fillPreview, showHelpers, canvasPreview } = useSnapshot(appSettings.canvas);
    const { minifyOutput, dragPrecision, showSvgTreeConnectorLines } = useSnapshot(appSettings.pathEditor);

    const doNormalizePath = useSetAtom(doNormalizePathAtom);

    return (
        <SectionPanel sectionKey="options" label="Options" contentClassName="px-0 pt-1 pb-4">
            <div className="pl-2.5 pr-2 max-w-[320px] text-[11px] space-y-2.5">
                <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground select-none">
                        viewBox
                    </span>
                    <ViewBoxControls />
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                    <CheckboxRow label="Snap to grid" className="col-start-1" checked={snapToGrid} onCheckedChange={(checked) => appSettings.canvas.snapToGrid = checked} />
                    <NumberRow label="Drag precision" className="col-start-2" value={dragPrecision} min={0} max={8} step={1} onValueChange={(value) => appSettings.pathEditor.dragPrecision = value} />

                    <CheckboxRow label="Show point controls" className="col-start-1" checked={showHelpers} onCheckedChange={(checked) => appSettings.canvas.showHelpers = checked} />
                    <CheckboxRow label="Fill path" className="col-start-1" checked={fillPreview} onCheckedChange={(checked) => appSettings.canvas.fillPreview = checked} />
                    <CheckboxRow label="Show SVG tree lines" className="col-start-1" checked={showSvgTreeConnectorLines} onCheckedChange={(checked) => appSettings.pathEditor.showSvgTreeConnectorLines = checked} />
                    <CheckboxRow label="Minify output" checked={minifyOutput} className="col-start-1" onCheckedChange={(checked) => { appSettings.pathEditor.minifyOutput = checked; doNormalizePath(); }} />
                    
                    <CheckboxRow label="Preview mode" checked={canvasPreview} className="col-start-1" onCheckedChange={(checked) => { appSettings.canvas.canvasPreview = checked; }} />
                </div>
            </div>
        </SectionPanel>
    );
}
