import { useEffect, type ReactNode } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { Button } from "@/components/ui/shadcn/button";
import { IconZoomIn, IconZoomNormal, IconZoomOut } from "@/components/ui/icons/normal";
import { CanvasGrid } from "./2-canvas-grid";
import { CanvasHelperOverlays } from "./1-canvas-overlays";
import { useCanvasDragAndDrop } from "./3-canvas-drag";
import { PathCanvasImages } from "./4-canvas-overlays-image";
import { canvasSvgElementAtom, useSyncCanvasViewportSize } from "../../../store/0-atoms/2-1-canvas-viewport-derives";
import { appSettings } from "@/store/0-ui-settings";
import { doClearCanvasFocusAtom } from "@/store/0-atoms/2-2-editor-actions";
import { parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { canvasViewBoxAtom, canvasViewportSizeAtom, doAdjustViewPortToAspectAtom, doFitViewPortAtom, doWheelZoomViewPortAtom, doZoomViewPortAtom } from "@/store/0-atoms/2-1-canvas-viewport";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";

export function PathCanvas() {
    const { canvasPreview } = useSnapshot(appSettings.canvas);
    return (
        <PathCanvasElement>
            <PathCanvasImages />
            {!canvasPreview && <CanvasGrid />}
            <CanvasHelperOverlays />
        </PathCanvasElement>
    );
}

export function PathCanvasElement({ children }: { children: ReactNode; }) {
    const { darkCanvas, canvasPreview } = useSnapshot(appSettings.canvas);

    const svgPathInput = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);

    const doClearCanvasFocus = useSetAtom(doClearCanvasFocusAtom);
    const setCanvasSvgElement = useSetAtom(canvasSvgElementAtom);
    const doWheelZoomViewPort = useSetAtom(doWheelZoomViewPortAtom);
    const doFitViewPort = useSetAtom(doFitViewPortAtom);
    const doAdjustViewPortToAspect = useSetAtom(doAdjustViewPortToAspectAtom);
    const viewportSize = useAtomValue(canvasViewportSizeAtom);

    const { onTouchEnd, onTouchMove, onTouchStart, startCanvasDrag } = useCanvasDragAndDrop(viewBox);

    useSyncCanvasViewportSize();

    useEffect(
        () => {
            doFitViewPort();
        },
        [svgPathInput]);

    useEffect(
        () => {
            doAdjustViewPortToAspect();
        },
        [viewportSize]);

    return (
        <div className={classNames("absolute w-full h-full overflow-hidden", canvasPreview ? "bg-white" : (darkCanvas ? "bg-zinc-900" : "bg-white"))}>
            <svg
                ref={(node) => setCanvasSvgElement(node)}
                viewBox={viewBox.join(" ")}
                className="size-full touch-none"
                onWheel={doWheelZoomViewPort}
                onPointerDown={startCanvasDrag}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={doClearCanvasFocus}
            >
                {children}
            </svg>

            <ViewportZoomControls />

            {parseError && (
                <div className="absolute inset-x-4 bottom-4 px-3 py-2 text-xs text-destructive-foreground bg-destructive/90 rounded-md pointer-events-none">
                    {parseError}
                </div>
            )}
        </div>
    );
}

function ViewportZoomControls() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const doFitViewPort = useSetAtom(doFitViewPortAtom);
    const doZoomViewPort = useSetAtom(doZoomViewPortAtom);
    const buttonClasses = classNames("size-7 rounded-full", darkCanvas ? "text-slate-500 bg-slate-100/10! border-slate-100/10!" : "text-slate-500 bg-slate-500/10! border-slate-500/10!");
    return (
        <div className="absolute bottom-3 right-3 flex items-center gap-0.5 z-10">
            <Button variant="outline" size="icon" className={buttonClasses} title="Zoom out" onClick={() => doZoomViewPort({ scale: 10 / 9 })}>
                <IconZoomOut className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className={buttonClasses} title="Fit" onClick={() => doFitViewPort()}>
                <IconZoomNormal className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className={buttonClasses} title="Zoom in" onClick={() => doZoomViewPort({ scale: 9 / 10 })}>
                <IconZoomIn className="size-3.5" />
            </Button>
        </div>
    );
}
