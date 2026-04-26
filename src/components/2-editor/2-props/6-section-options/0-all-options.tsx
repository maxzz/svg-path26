import { useSnapshot } from "valtio";
import { SectionPanel } from "@/components/ui/local-ui/1-section-panel";
import { appSettings } from "@/store/0-ui-settings";
import { NumberRow } from "../../../4-dialogs/8-3-options/1-options-controls";
import { ViewBoxControls } from "../../../4-dialogs/8-3-options/2-viewbox-controls";

export function Section_Options() {
    const { dragPrecision } = useSnapshot(appSettings.pathEditor);

    return (
        <SectionPanel sectionKey="options" label="Options" contentClassName="px-0 pt-1 pb-4" triggerClassName="mr-2">
            <div className="pl-2.5 pr-2 max-w-[320px] text-[11px] space-y-2.5">
                <ViewBoxControls />

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                    <NumberRow label="Drag precision" className="col-start-2" value={dragPrecision} min={0} max={8} step={1} onValueChange={(value) => appSettings.pathEditor.dragPrecision = value} />
                </div>
            </div>
        </SectionPanel>
    );
}
