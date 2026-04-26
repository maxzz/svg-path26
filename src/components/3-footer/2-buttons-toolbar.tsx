import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { IconGrid, IconSnapToGrid2, IconAxis, IconFrame, IconControlPoints, IconFillSvg } from "../ui/icons";
import { Button } from "@/components/ui/shadcn/button";
import { FooterButtonsSelector, footerBtnClasses, footerIconFillOnClasses, footerIconOffClasses, footerIconOnClasses } from "./3-buttons-selector";

export function FooterButtonsToolbar() {
    const { showGrid, showViewBoxFrame, showHelpers, fillPreview } = useSnapshot(appSettings.canvas);
    const { buttons: footerButtons } = useSnapshot(appSettings.footer);

    return (
        <div className="flex items-center gap-1">
            {footerButtons.showTicksToggle && <TicksToggleInput />}

            {footerButtons.showSnapToGridToggle && <SnapToGridInput />}

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

            <FooterButtonsSelector />
        </div>
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

function SnapToGridInput() {
    const { snapToGrid } = useSnapshot(appSettings.canvas);
    const { dragPrecision } = useSnapshot(appSettings.pathEditor);
    return (
        <div className="flex items-center">
            <input
                className="pl-2 pr-0.5 h-5 w-12 max-w-20 scale-80 text-[10px] text-center rounded border bg-background disabled:opacity-20"
                //disabled={!snapToGrid}
                type="number"
                value={dragPrecision}
                min={0}
                max={8}
                step={1}
                aria-label="Drag precision"
                title="Drag precision"
                onChange={(event) => {
                    const nextValue = Math.max(0, Math.min(8, Number(event.target.value) || 0));
                    appSettings.pathEditor.dragPrecision = nextValue;
                }}
            />
            <Button
                variant="outline"
                size="xs"
                className={classNames(footerBtnClasses, "-ml-0.75")}
                onClick={() => { appSettings.canvas.snapToGrid = !snapToGrid; }}
                title={snapToGrid ? "Snap to grid is on" : "Snap to grid is off"}
                aria-pressed={snapToGrid}
                type="button"
            >
                <IconSnapToGrid2 className={classNames("size-3", snapToGrid ? footerIconOnClasses : footerIconOffClasses)} />
            </Button>
        </div>
    );
}
