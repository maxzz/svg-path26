import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { ArrowLeftRight, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { allSubPathsEnabledAtom, hasCompoundSubPathsAtom, subPathAccordionValuesAtom, subPathsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";

export function PathCommandsOverlay() {
    const hasCompoundSubPaths = useAtomValue(hasCompoundSubPathsAtom);
    return (
        <div className="mr-1 flex items-center gap-0.5">
            {hasCompoundSubPaths && <BtnAllSubPaths />}
            {hasCompoundSubPaths && <BtnSubPathAllAccordions />}
            <BtnScrollOnHover />
        </div>
    );
}

function BtnAllSubPaths() {
    const [allEnabled, setAllEnabled] = useAtom(allSubPathsEnabledAtom);
    const label = allEnabled ? "Mute all subpaths" : "Enable all subpaths";
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={cn(overlayButtonClasses, allEnabled && overlayButtonActiveClasses)}
                    onClick={() => setAllEnabled((current) => !current)}
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label={label}
                    aria-pressed={allEnabled}
                >
                    {allEnabled ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}

function BtnSubPathAllAccordions() {
    const subPaths = useAtomValue(subPathsAtom);
    const [openSubPaths, setOpenSubPaths] = useAtom(subPathAccordionValuesAtom);
    const allValues = subPaths.map((subPath) => `subpath-${subPath.index}`);
    const allExpanded = allValues.length > 0 && openSubPaths.length === allValues.length;
    const label = allExpanded ? "Collapse all subpaths" : "Expand all subpaths";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={cn(overlayButtonClasses, allExpanded && overlayButtonActiveClasses)}
                    onClick={() => setOpenSubPaths(allExpanded ? [] : allValues)}
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label={label}
                    aria-pressed={allExpanded}
                >
                    {allExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}

function BtnScrollOnHover() {
    const { scrollOnHover } = useSnapshot(appSettings.canvas);
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={cn(overlayButtonClasses, scrollOnHover && overlayButtonActiveClasses)}
                    onClick={() => appSettings.canvas.scrollOnHover = !scrollOnHover}
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label={scrollOnHover ? "Disable scroll on hover" : "Enable scroll on hover"}
                    aria-pressed={scrollOnHover}
                >
                    <ArrowLeftRight className="size-3" />
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {scrollOnHover ? "Disable scroll on hover" : "Enable scroll on hover"}
            </TooltipContent>
        </Tooltip>
    );
}

const overlayButtonClasses = "size-5 rounded-sm text-muted-foreground hover:text-foreground";
const overlayButtonActiveClasses = "bg-background/80 text-foreground";
