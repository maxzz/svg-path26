import { cn } from "@/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { CopyClipboardOverlayButton } from "../../../ui/loacal-ui/5-section-overlay-buttons/4-1-copy-clipboard";
import { OverlayButton_MinifyPath } from "../../../ui/loacal-ui/5-section-overlay-buttons/4-2-minify-path";
import { IconHomeToCloud } from "@/components/ui/icons/app-specific";
import { Button } from "@/components/ui/shadcn/button";
import { overlayButtonClasses } from "../8-shared-classes/0-classes";

export function PathInputOverlay({ pathValue }: { pathValue: string; }) {
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
                <Button className={cn(overlayButtonClasses)} variant="ghost" size="icon">
                    <IconHomeToCloud className="size-4" />
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                Home to Cloud
            </TooltipContent>
        </Tooltip>
    );
}
