import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { IconAdjustmentsHorizontal } from "@/components/ui/icons/normal";

export function FooterButtonsSelector() {
    const { buttons } = useSnapshot(appSettings.footer);
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={footerBtnClasses}
                    title="Choose footer buttons"
                    aria-label="Choose footer buttons"
                    type="button"
                >
                    <IconAdjustmentsHorizontal className="size-3" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-3 pt-0 w-auto max-w-56 overflow-hidden" align="end">
                <h4 className="-mx-3 mb-2 px-3 py-2 text-xs font-semibold border-b">
                    Footer buttons
                </h4>

                <div className="grid gap-2">
                    <label className="flex items-center gap-2 text-[11px] select-none cursor-pointer">
                        <Checkbox
                            checked={buttons.showTicksToggle}
                            onCheckedChange={(checked) => { appSettings.footer.buttons.showTicksToggle = Boolean(checked); }}
                        />
                        <span>Ticks</span>
                    </label>

                    <label className="flex items-center gap-2 text-[11px] select-none cursor-pointer">
                        <Checkbox
                            checked={buttons.showSnapToGridToggle}
                            onCheckedChange={(checked) => { appSettings.footer.buttons.showSnapToGridToggle = Boolean(checked); }}
                        />
                        <span>Snap to grid</span>
                    </label>

                    <label className="flex items-center gap-2 text-[11px] select-none cursor-pointer">
                        <Checkbox
                            checked={buttons.showGridToggle}
                            onCheckedChange={(checked) => { appSettings.footer.buttons.showGridToggle = Boolean(checked); }}
                        />
                        <span>Grid</span>
                    </label>

                    <label className="flex items-center gap-2 text-[11px] select-none cursor-pointer">
                        <Checkbox
                            checked={buttons.showViewBoxFrameToggle}
                            onCheckedChange={(checked) => { appSettings.footer.buttons.showViewBoxFrameToggle = Boolean(checked); }}
                        />
                        <span>ViewBox frame</span>
                    </label>

                    <label className="flex items-center gap-2 text-[11px] select-none cursor-pointer">
                        <Checkbox
                            checked={buttons.showShowHelpersToggle}
                            onCheckedChange={(checked) => { appSettings.footer.buttons.showShowHelpersToggle = Boolean(checked); }}
                        />
                        <span>Control points</span>
                    </label>

                    <label className="flex items-center gap-2 text-[11px] select-none cursor-pointer">
                        <Checkbox
                            checked={buttons.showFillPreviewToggle}
                            onCheckedChange={(checked) => { appSettings.footer.buttons.showFillPreviewToggle = Boolean(checked); }}
                        />
                        <span>Fill path</span>
                    </label>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export const footerBtnClasses = "px-0.5! size-5 text-[10px] border rounded";
export const footerIconOnClasses = "text-emerald-700 dark:text-emerald-300";
export const footerIconOffClasses = "text-muted-foreground ";
export const footerIconFillOnClasses = "text-emerald-700 dark:text-emerald-300 fill-emerald-200/50! dark:fill-emerald-300/30!";
