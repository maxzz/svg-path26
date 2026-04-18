import { useAtom } from "jotai";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { CopyClipboardOverlayButton } from "../../../ui/loacal-ui/5-section-overlay-buttons/4-1-copy-clipboard";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { OverlayButton_MinifyPath } from "../../../ui/loacal-ui/5-section-overlay-buttons/4-2-minify-path";
import { IconHomeToCloud } from "@/components/ui/icons/app-specific";
import { Button } from "@/components/ui/shadcn/button";

export function Section_PathInput() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom);
    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="path-input" label="Path Input" contentClassName="px-px py-0.5" overlay={<PathInputOverlay pathValue={pathValue} />}>
                <textarea
                    id="svg-path-input"
                    className="pl-4 py-1 w-full min-h-8 field-sizing-content font-mono tracking-tight text-xs bg-background outline-ring/50 focus:-outline shadow-inner resize-y"
                    value={pathValue}
                    onChange={(event) => setPathValue(event.target.value)}
                    placeholder="M 10 10 L 100 100"
                />
            </SectionPanel>
        </TooltipProvider>
    );
}

function PathInputOverlay({ pathValue }: { pathValue: string; }) {
    const hasPath = pathValue.trim().length > 0;
    return (
        <div className="mr-1 flex items-center gap-0.5">

            <BtnHomeToCloud />

            <OverlayButton_MinifyPath />

            <CopyClipboardOverlayButton
                copyText={pathValue}
                canCopy={hasPath}
                idleLabel="Copy path"
                successLabel="Path copied"
            />
        </div>
    );
}

function BtnHomeToCloud() {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button className="size-5" variant="ghost" size="icon">
                    <IconHomeToCloud className="size-4" />
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                Home to Cloud
            </TooltipContent>
        </Tooltip>
    );
}
