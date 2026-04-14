import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { doNormalizePathAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { IconSizeBigger, IconSizeSmaller } from "@/components/ui/icons/app-specific";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";

export function OverlayButton_MinifyPath() {
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const label = `Now ${minifyOutput ? "Minifying" : "Expanding"}. Set ${minifyOutput ? "Expanding" : "Minifying"}`;
    
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={classNames("size-5")}
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
                    {minifyOutput ? <IconSizeSmaller className="size-3" /> : <IconSizeBigger className="size-3" />}
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
