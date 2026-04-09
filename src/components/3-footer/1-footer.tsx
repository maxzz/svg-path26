import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { IconGrid, IconSnapToGrid, IconSnapToGrid2 } from "../ui/icons";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { IconAdjustmentsHorizontal } from "@/components/ui/icons/normal";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";

export function Footer() {
    const { showGrid, darkCanvas, showViewBoxFrame, snapToGrid, showHelpers, fillPreview } = useSnapshot(appSettings.canvas);
    const { buttons: footerButtons } = useSnapshot(appSettings.footer);

    return (
        <footer className="px-4 py-2 pr-2 text-xs text-muted-foreground border-t flex items-center justify-between">
            <PathStateInfo />
            
            <div className="flex items-center gap-1">
                {footerButtons.showTicksToggle && <TicksToggleInput />}

                {footerButtons.showSnapToGridToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className="px-1 pb-px h-4 text-[10px] border rounded"
                        onClick={() => { appSettings.canvas.snapToGrid = !snapToGrid; }}
                        aria-pressed={snapToGrid}
                        title={snapToGrid ? "Snap to grid on" : "Snap to grid off"}
                        type="button"
                    >
                        <IconSnapToGrid2 className={classNames("size-3", snapToGrid ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")} />
                    </Button>
                )}

                {footerButtons.showGridToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className="px-1 pb-px h-4 text-[10px] border rounded"
                        onClick={() => { appSettings.canvas.showGrid = !showGrid; }}
                        aria-pressed={showGrid}
                        title={showGrid ? "Grid on" : "Grid off"}
                        type="button"
                    >
                        <IconGrid className={classNames("size-3", showGrid ? "stroke-3! text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")} />
                    </Button>
                )}

                {footerButtons.showDarkCanvasToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className="px-1 pb-px h-4 text-[10px] border rounded"
                        onClick={() => { appSettings.canvas.darkCanvas = !darkCanvas; }}
                        aria-pressed={darkCanvas}
                        type="button"
                    >
                        {darkCanvas ? "Dark canvas" : "Light canvas"}
                    </Button>
                )}

                {footerButtons.showViewBoxFrameToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className="px-1 pb-px h-4 text-[10px] border rounded"
                        onClick={() => { appSettings.canvas.showViewBoxFrame = !showViewBoxFrame; }}
                        aria-pressed={showViewBoxFrame}
                        type="button"
                    >
                        {showViewBoxFrame ? "viewBox frame on" : "viewBox frame off"}
                    </Button>
                )}

                {footerButtons.showShowHelpersToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className="px-1 pb-px h-4 text-[10px] border rounded"
                        onClick={() => { appSettings.canvas.showHelpers = !showHelpers; }}
                        aria-pressed={showHelpers}
                        type="button"
                    >
                        {showHelpers ? "Point controls on" : "Point controls off"}
                    </Button>
                )}

                {footerButtons.showFillPreviewToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className="px-1 pb-px h-4 text-[10px] border rounded"
                        onClick={() => { appSettings.canvas.fillPreview = !fillPreview; }}
                        aria-pressed={fillPreview}
                        type="button"
                    >
                        {fillPreview ? "Fill preview on" : "Fill preview off"}
                    </Button>
                )}

                <FooterButtonsPopover />
            </div>
        </footer>
    );
}

function FooterButtonsPopover() {
    const { buttons } = useSnapshot(appSettings.footer);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-4 text-[10px] border rounded flex items-center justify-center"
                    title="Choose footer buttons"
                    aria-label="Choose footer buttons"
                    type="button"
                >
                    <IconAdjustmentsHorizontal className="size-3" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-3 pt-0 w-auto max-w-56 overflow-hidden" align="end">
                <h4 className="px-1 py-2 text-xs font-semibold">
                    Footer buttons
                </h4>

                <div className="grid gap-2 pb-1">
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
                            checked={buttons.showDarkCanvasToggle}
                            onCheckedChange={(checked) => { appSettings.footer.buttons.showDarkCanvasToggle = Boolean(checked); }}
                        />
                        <span>Dark canvas</span>
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
                        <span>Point controls</span>
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

function TicksToggleInput() {
    const { showTicks } = useSnapshot(appSettings.canvas);
    const { tickInterval } = useSnapshot(appSettings.pathEditor);
    return (
        <div className="flex items-center">
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
                className="-ml-0.75 px-1 pb-px h-4 text-[10px] border rounded"
                onClick={() => { appSettings.canvas.showTicks = !showTicks; }}
                aria-pressed={showTicks}
                type="button"
            >
                {showTicks ? "Ticks on" : "Ticks off"}
            </Button>
        </div>
    );
}
