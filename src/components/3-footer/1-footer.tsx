import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { IconGrid, IconSnapToGrid2, IconAxis, IconFrame, IconControlPoints, IconFillSvg } from "../ui/icons";
import { Button } from "@/components/ui/shadcn/button";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import {
    FooterButtonsPopover,
    footerBtnClasses,
    footerIconFillOnClasses,
    footerIconOffClasses,
    footerIconOnClasses,
} from "./2-footer-buttons-popover.tsx";

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
                        className={footerBtnClasses}
                        onClick={() => { appSettings.canvas.snapToGrid = !snapToGrid; }}
                        aria-pressed={snapToGrid}
                        title={snapToGrid ? "Snap to grid is on" : "Snap to grid is off"}
                        type="button"
                    >
                        <IconSnapToGrid2 className={classNames("size-3", snapToGrid ? footerIconOnClasses : footerIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showGridToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerBtnClasses}
                        onClick={() => { appSettings.canvas.showGrid = !showGrid; }}
                        aria-pressed={showGrid}
                        title={showGrid ? "Grid is on" : "Grid is off"}
                        type="button"
                    >
                        <IconGrid className={classNames("size-3 stroke-1!", showGrid ? footerIconOnClasses : footerIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showViewBoxFrameToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerBtnClasses}
                        onClick={() => { appSettings.canvas.showViewBoxFrame = !showViewBoxFrame; }}
                        aria-pressed={showViewBoxFrame}
                        title={showViewBoxFrame ? "ViewBox frame on" : "ViewBox frame off"}
                        type="button"
                    >
                        <IconFrame className={classNames("size-3", showViewBoxFrame ? footerIconOnClasses : footerIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showShowHelpersToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerBtnClasses}
                        onClick={() => { appSettings.canvas.showHelpers = !showHelpers; }}
                        aria-pressed={showHelpers}
                        title={showHelpers ? "Control points on" : "Control points off"}
                        type="button"
                    >
                        <IconControlPoints className={classNames("size-3", showHelpers ? footerIconOnClasses : footerIconOffClasses)} />
                    </Button>
                )}

                {footerButtons.showFillPreviewToggle && (
                    <Button
                        variant="outline"
                        size="xs"
                        className={footerBtnClasses}
                        onClick={() => { appSettings.canvas.fillPreview = !fillPreview; }}
                        aria-pressed={fillPreview}
                        title={!fillPreview ? "Fill is on" : "Fill is off"}
                        type="button"
                    >
                        <IconFillSvg className={classNames("size-3", !fillPreview ? footerIconOnClasses : footerIconOffClasses, !fillPreview && footerIconFillOnClasses)} />
                    </Button>
                )}

                <FooterButtonsPopover />
            </div>
        </footer>
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
                className={classNames(footerBtnClasses, "-ml-0.75")}
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
