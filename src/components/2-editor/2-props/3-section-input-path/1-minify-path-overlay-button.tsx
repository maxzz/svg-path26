import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { IconSizeBigger, IconSizeSmaller } from "@/components/ui/icons/app-specific";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";

export function MinifyPathOverlayButton(props: { canToggle: boolean; }) {
    const { canToggle } = props;
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);

    const label = minifyOutput ? "Expand path" : "Minify path";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className="size-5"
                    variant="ghost"
                    size="icon"
                    onClick={() => appSettings.pathEditor.minifyOutput = !minifyOutput}
                    disabled={!canToggle}
                    aria-label={label}
                    type="button"
                >
                    {minifyOutput ? <IconSizeSmaller className="size-3" /> : <IconSizeBigger className="size-3" />}
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {canToggle ? label : "Nothing to minify"}
            </TooltipContent>
        </Tooltip>
    );
}

