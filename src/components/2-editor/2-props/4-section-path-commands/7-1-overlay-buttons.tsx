import { useSnapshot } from "valtio";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { appSettings } from "@/store/0-ui-settings";

export function ScrollOnHoverToggleOverlay() {
    const { scrollOnHover } = useSnapshot(appSettings.canvas);
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={cn("mr-1 size-6 rounded-sm text-muted-foreground hover:text-foreground", scrollOnHover && "bg-background/80 text-foreground")}
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
