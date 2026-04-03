import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { Settings as IconSettings } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { StrokeInput, ZoomInput } from "@/components/4-dialogs/8-3-options/8-options-sliders";

export function SettingsPopover() {
    const { canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className="size-7" variant="outline" size="icon" title="View options">
                    <IconSettings className="size-4 stroke-1" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-3 pt-0 w-auto max-w-80 overflow-hidden" align="end">
                <div className="-mx-3 mb-3 pt-3 pb-2 border-b bg-foreground/10">
                    <h4 className="px-3 text-xs font-semibold leading-none">
                        View options
                    </h4>
                </div>

                <div className="min-w-40 grid gap-3">
                    <StrokeInput />
                    <ZoomInput />
                </div>
            </PopoverContent>
        </Popover>
    );
}
