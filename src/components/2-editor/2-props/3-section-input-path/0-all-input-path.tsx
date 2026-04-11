import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { CopyClipboardOverlayButton } from "../../../ui/loacal-ui/4-copy-clipboard-overlay-button";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { IconSizeMore, IconSizeLess } from "@/components/ui/icons/app-specific";
import { Button } from "@/components/ui/shadcn/button";

export function Section_PathInput() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom);
    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="path-input" label="Path Input" contentClassName="px-px py-0.5" overlay={<CopyPathOverlay pathValue={pathValue} />}>
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

function CopyPathOverlay({ pathValue }: { pathValue: string; }) {
    const hasPath = pathValue.trim().length > 0;
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => appSettings.pathEditor.minifyOutput = !minifyOutput}
                disabled={!hasPath}
                aria-label="Copy path"
            >
                {minifyOutput ? <IconSizeLess className="size-3" /> : <IconSizeMore className="size-4" />}
            </Button>

            <CopyClipboardOverlayButton
                copyText={pathValue}
                canCopy={hasPath}
                idleLabel="Copy path"
                successLabel="Path copied"
            />
        </>
    );
}
