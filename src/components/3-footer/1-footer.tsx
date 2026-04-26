import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { IconGrid, IconSnapToGrid2, IconAxis, IconFrame, IconControlPoints, IconFillSvg } from "../ui/icons";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { IconAdjustmentsHorizontal } from "@/components/ui/icons/normal";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";

export function Footer() {
    const { showGrid, showViewBoxFrame, snapToGrid, showHelpers, fillPreview } = useSnapshot(appSettings.canvas);
    const { buttons: footerButtons } = useSnapshot(appSettings.footer);

    return (
        <footer className="px-4 pt-1 pb-1.5 pr-2 text-xs text-muted-foreground border-t flex items-center justify-between">
            <PathStateInfo />

            <div className="flex items-center gap-1">
                {footerButtons.showTicksToggle && <TicksToggleInput />}

                {footerButtons.showSnapToGridToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerButtonClasses}
                        onClick={() => { appSettings.canvas.snapToGrid = !snapToGrid; }}
                        aria-pressed={snapToGrid}
                        title={snapToGrid ? "Snap to grid is on" : "Snap to grid is off"}
                        type="button"
                    >
                        <IconSnapToGrid2 className={classNames("size-3", snapToGrid ? buttonIconOnClasses : buttonIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showGridToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerButtonClasses}
                        onClick={() => { appSettings.canvas.showGrid = !showGrid; }}
                        aria-pressed={showGrid}
                        title={showGrid ? "Grid is on" : "Grid is off"}
                        type="button"
                    >
                        <IconGrid className={classNames("size-3 stroke-3!", showGrid ? buttonIconOnClasses : buttonIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showViewBoxFrameToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerButtonClasses}
                        onClick={() => { appSettings.canvas.showViewBoxFrame = !showViewBoxFrame; }}
                        aria-pressed={showViewBoxFrame}
                        title={showViewBoxFrame ? "ViewBox frame on" : "ViewBox frame off"}
                        type="button"
                    >
                        <IconFrame className={classNames("size-3", showViewBoxFrame ? buttonIconOnClasses : buttonIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showShowHelpersToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerButtonClasses}
                        onClick={() => { appSettings.canvas.showHelpers = !showHelpers; }}
                        aria-pressed={showHelpers}
                        title={showHelpers ? "Control points on" : "Control points off"}
                        type="button"
                    >
                        <IconControlPoints className={classNames("size-3", showHelpers ? buttonIconOnClasses : buttonIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showFillPreviewToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerButtonClasses}
                        onClick={() => { appSettings.canvas.fillPreview = !fillPreview; }}
                        aria-pressed={fillPreview}
                        title={!fillPreview ? "Fill is on" : "Fill is off"}
                        type="button"
                    >
                        <IconFillSvg className={classNames("size-3", !fillPreview ? buttonIconOnClasses : buttonIconOffClasses, !fillPreview && buttonIconFillOnClasses)} />
                    </Button>
                )}

                <FooterButtonsPopover />
            </div>
        </footer>
    );
}

const buttonIconOnClasses = "text-emerald-700 dark:text-emerald-300";
const buttonIconOffClasses = "text-muted-foreground ";
const buttonIconFillOnClasses = "text-emerald-700 dark:text-emerald-300 fill-emerald-200/50! dark:fill-emerald-300/30!";

const footerButtonClasses = "px-0.5! size-5 text-[10px] border rounded";

function FooterButtonsPopover() {
    const { buttons } = useSnapshot(appSettings.footer);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={footerButtonClasses}
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

function TicksToggleInput() {
    const { showTicks } = useSnapshot(appSettings.canvas);
    const { tickInterval } = useSnapshot(appSettings.pathEditor);
    return (
        <div className="flex items-center" title={showTicks ? "Ticks on" : "Ticks off"}>
            <input
                className="pl-2 pr-0.5 h-5 w-12 max-w-20 scale-80 text-[10px] text-center rounded border bg-background disabled:opacity-20"
                disabled={!showTicks}
                type="number"
                value={tickInterval}
                min={1}
                step={1}
                aria-label="Tick interval"
                onChange={(event) => {
                    appSettings.pathEditor.tickInterval = Math.max(1, Number(event.target.value) || 1);
                }}
            />
            <Button
                variant="outline"
                size="xs"
                className={classNames(footerButtonClasses, "-ml-0.75")}
                onClick={() => { appSettings.canvas.showTicks = !showTicks; }}
                aria-pressed={showTicks}
                type="button"
            >
                <IconAxis className={classNames("size-3", showTicks ? "stroke-2! text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")} />
            </Button>
        </div>
    );
}

function PathStateInfo() {
    const commandCount = useAtomValue(commandCountAtom);
    const error = useAtomValue(parseErrorAtom);
    return (
        <div className="min-w-0 text-[10px] flex items-center gap-2 whitespace-nowrap">
            <span className="shrink-0">
                Commands parsed: {commandCount}
            </span>

            {error
                ? (
                    <span className="px-2 py-1 max-w-55 text-xs text-destructive bg-destructive/10 truncate rounded">
                        {error}
                    </span>
                ) : (
                    <span className="px-2 py-1 max-w-55 text-emerald-700 dark:text-emerald-300 truncate rounded">
                        Path parsed successfully.
                    </span>
                )
            }
        </div>
    );
}
