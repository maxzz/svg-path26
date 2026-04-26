import { useAtom } from "jotai";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { PathInput_Overlay } from "./7-overlays";

export function Section_PathInput() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom);
    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="path-input" label="Path Input" contentClassName="px-px py-0.5" overlay={<PathInput_Overlay pathValue={pathValue} />}>
                <textarea
                    id="svg-path-input"
                    className="px-3 py-1 w-full min-h-8 field-sizing-content font-mono tracking-tight text-[11px] bg-background outline-ring/50 focus:-outline shadow-inner resize-none"
                    value={pathValue}
                    onChange={(event) => setPathValue(event.target.value)}
                    placeholder="M 10 10 L 100 100"
                />
            </SectionPanel>
        </TooltipProvider>
    );
}
