import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { IconSizeSmaller, IconSizeBigger } from "@/components/ui/icons/app-specific";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { CopyClipboardOverlayButton } from "../../../ui/loacal-ui/4-copy-clipboard-overlay-button";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
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
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);

    return (
        <div className="flex items-center 1gap-1">
            <Button
                className="size-5"
                variant="ghost"
                size="icon"
                onClick={() => appSettings.pathEditor.minifyOutput = !minifyOutput}
                disabled={!hasPath}
                title={minifyOutput ? "Expand path" : "Minify path"}
                aria-label={minifyOutput ? "Expand path" : "Minify path"}
            >
                {minifyOutput ? <IconSizeSmaller className="size-3" /> : <IconSizeBigger className="size-3" />}
            </Button>

            <CopyClipboardOverlayButton
                copyText={pathValue}
                canCopy={hasPath}
                idleLabel="Copy path"
                successLabel="Path copied"
            />
        </div>
    );
}
