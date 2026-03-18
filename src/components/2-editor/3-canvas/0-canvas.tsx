import { useEffect, type ReactNode } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { Button } from "@/components/ui/shadcn/button";
import { IconZoomIn, IconZoomNormal, IconZoomOut } from "@/components/ui/icons/normal";
import { CanvasGrid } from "./2-canvas-grid";
import { CanvasHelperOverlays } from "./1-canvas-overlays";
import { canvasDragStateAtom, eventToSvgPoint, useCanvasDragAndDrop } from "./3-canvas-drag";
import { PathCanvasImages } from "./4-canvas-overlays-image";
import { canvasSvgElementAtom, useSyncCanvasViewportSize } from "../../../store/0-atoms/2-1-canvas-viewport";
import { appSettings } from "@/store/0-ui-settings";
import { hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { canvasViewBoxAtom, canvasViewportSizeAtom, doAdjustViewBoxToAspectAtom, doFitViewBoxAtom, doZoomViewBoxAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { focusedImageIdAtom, isImageEditModeAtom } from "@/store/0-atoms/2-4-images";

export function PathCanvas() {
    const { canvasPreview } = useSnapshot(appSettings.pathEditor);
    return (
        <PathCanvasElement>
            <PathCanvasImages />
            {!canvasPreview && <CanvasGrid />}
            <CanvasHelperOverlays />
        </PathCanvasElement>
    );
}

export function PathCanvasElement({ children }: { children: ReactNode; }) {
    const { darkCanvas } = useSnapshot(appSettings);
    const { canvasPreview: preview } = useSnapshot(appSettings.pathEditor);

    const svgPathInput = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const svgElement = useAtomValue(canvasSvgElementAtom);

    const setFocusedImageId = useSetAtom(focusedImageIdAtom);
    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setCanvasSvgElement = useSetAtom(canvasSvgElementAtom);
    const doZoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const doFitViewBox = useSetAtom(doFitViewBoxAtom);
    const doAdjustViewBoxToAspect = useSetAtom(doAdjustViewBoxToAspectAtom);
    const viewportSize = useAtomValue(canvasViewportSizeAtom);

    const dragState = useAtomValue(canvasDragStateAtom);
    const { onTouchEnd, onTouchMove, onTouchStart, startCanvasDrag } = useCanvasDragAndDrop(viewBox);

    useSyncCanvasViewportSize();

    useEffect(
        () => {
            doFitViewBox();
        },
        [svgPathInput]);

    useEffect(
        () => {
            doAdjustViewBoxToAspect();
        },
        [viewportSize]);

    return (
        <div className={classNames("absolute w-full h-full overflow-hidden", preview ? "bg-white" : (darkCanvas ? "bg-zinc-900" : "bg-white"))}>
            <svg
                ref={(node) => setCanvasSvgElement(node)}
                viewBox={viewBox.join(" ")}
                className="size-full touch-none"
                onWheel={(event) => {
                    event.preventDefault();
                    if (!svgElement) return;
                    const center = eventToSvgPoint(svgElement, event.clientX, event.clientY, viewBox);
                    if (!center) return;
                    const scale = Math.pow(1.005, event.deltaY);
                    doZoomViewBox({ scale, center });
                }}
                onPointerDown={(event) => {
                    if (event.pointerType === "touch") return;
                    if (event.button !== 0 || imageEditMode || preview) return;
                    startCanvasDrag({ pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        if (dragState?.mode === "canvas" && dragState.moved) return;
                        setSelectedCommandIndex(null);
                        setHoveredCommandIndex(null);
                        setHoveredCanvasPoint(null);
                        setFocusedImageId(null);
                    }
                }}
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
    const doFitViewBox = useSetAtom(doFitViewBoxAtom);
    const doZoomViewBox = useSetAtom(doZoomViewBoxAtom);

    return (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5">
            <Button variant="outline" size="icon" className="size-7 rounded-full" title="Zoom out" onClick={() => doZoomViewBox({ scale: 10 / 9 })}>
                <IconZoomOut className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="size-7 rounded-full" title="Fit" onClick={() => doFitViewBox()}>
                <IconZoomNormal className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="size-7 rounded-full" title="Zoom in" onClick={() => doZoomViewBox({ scale: 9 / 10 })}>
                <IconZoomIn className="size-3.5" />
            </Button>
        </div>
    );
}
