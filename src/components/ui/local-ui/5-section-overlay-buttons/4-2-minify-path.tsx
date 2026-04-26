import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { cn } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { doNormalizePathAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { IconSizeBigger, IconSizeSmaller } from "@/components/ui/icons/app-specific";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { overlayButtonActiveClasses, overlayButtonClasses } from "@/components/2-editor/2-props/8-shared-classes/0-classes";

export function OverlayButton_MinifyPath() {
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const label = `Now ${minifyOutput ? "Minifying" : "Expanding"}. Set ${minifyOutput ? "Expanding" : "Minifying"}`;
    
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={cn(overlayButtonClasses, minifyOutput && overlayButtonActiveClasses)}
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        appSettings.pathEditor.minifyOutput = !minifyOutput;
                        doNormalize();
                    }}
                    aria-label={label}
                    title={label}
                    type="button"
                >
                    {minifyOutput ? <IconSizeSmaller className="size-3 stroke-2!" /> : <IconSizeBigger className="size-3 stroke-2!" />}
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
