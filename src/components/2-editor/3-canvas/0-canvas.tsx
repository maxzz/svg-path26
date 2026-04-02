import { useEffect, useRef, type ReactNode } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { Button } from "@/components/ui/shadcn/button";
import { IconZoomIn, IconZoomNormal, IconZoomOut } from "@/components/ui/icons/normal";
import { CanvasGrid } from "./8-canvas-grid";
import { CanvasHelperOverlays } from "./1-overlays/1-canvas-overlays";
import { useCanvasDragAndDrop } from "./3-canvas-drag";
import { PathCanvasImages } from "./1-overlays/6-images";
import { useSyncCanvasViewportSize } from "../../../store/0-atoms/2-3-canvas-viewport-derives";
import { appSettings } from "@/store/0-ui-settings";
import { doClearCanvasFocusAtom } from "@/store/0-atoms/2-4-editor-actions";
import { parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { canvasRootSvgElementAtom, canvasViewPortAtom, rootSvgElementSizeAtom, doAdjustViewPortToAspectAtom, doFitViewPortAtom, doWheelZoomViewPortAtom, doZoomViewPortAtom } from "@/store/0-atoms/2-3-canvas-viewport";
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
    const hasNonEmptyPathRef = useRef(false);

    const canvasRootSvgElement = useAtomValue(canvasRootSvgElementAtom);
    const svgPathInput = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const viewPort = useAtomValue(canvasViewPortAtom);

    const doClearCanvasFocus = useSetAtom(doClearCanvasFocusAtom);
    const setCanvasRootSvgElement = useSetAtom(canvasRootSvgElementAtom);
    const doWheelZoomViewPort = useSetAtom(doWheelZoomViewPortAtom);
    const doFitViewPort = useSetAtom(doFitViewPortAtom);
    const doAdjustViewPortToAspect = useSetAtom(doAdjustViewPortToAspectAtom);
    const rootSvgElementSize = useAtomValue(rootSvgElementSizeAtom);

    const { onTouchEnd, onTouchMove, onTouchStart, startCanvasPointerDown } = useCanvasDragAndDrop();

    useSyncCanvasViewportSize();

    useEffect(
        () => {
            const hasPath = svgPathInput.trim().length > 0;
            if (!hasPath) {
                hasNonEmptyPathRef.current = false;
                return;
            }
            if (hasNonEmptyPathRef.current) return;

            hasNonEmptyPathRef.current = true;
            doFitViewPort();
        },
        [doFitViewPort, svgPathInput]);

    useEffect(
        () => {
            doAdjustViewPortToAspect();
        },
        [rootSvgElementSize]);

    useEffect(
        () => {
            if (!canvasRootSvgElement) return;
            const controller = new AbortController();
            canvasRootSvgElement.addEventListener("wheel", doWheelZoomViewPort, { passive: false, signal: controller.signal });
            return () => {
                controller.abort();
            };
        },
        [canvasRootSvgElement, doWheelZoomViewPort]);

    return (
        <div className={classNames("absolute w-full h-full overflow-hidden", canvasPreview ? "bg-white" : (darkCanvas ? "bg-[#040d1c]" : "bg-white"))}>
            <svg
                ref={(node) => setCanvasRootSvgElement(node)}
                viewBox={viewPort.join(" ")}
                className="size-full touch-none"
                onPointerDown={startCanvasPointerDown}
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
