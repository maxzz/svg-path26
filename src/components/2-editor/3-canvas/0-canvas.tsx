import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { CanvasGrid } from "./1-canvas-grid";
import { CanvasHelperOverlays, CanvasPathOverlays } from "./2-canvas-helper-overlays";
import { canvasDragStateAtom, eventToSvgPoint, useCanvasDragAndDrop } from "./3-canvas-drag";
import { PathCanvasImageEditOverlays, PathCanvasImages } from "./4-canvas-image-edit-overlays";
import { canvasSvgElementAtom, useSyncCanvasViewportSize } from "./5-canvas-viewport-metrics";
import { appSettings } from "@/store/0-ui-settings";
import { hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { canvasViewBoxAtom, doFitViewBoxAtom, doZoomViewBoxAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { focusedImageIdAtom, isImageEditModeAtom } from "@/store/0-atoms/2-4-images";

export function PathCanvas() {
    const { darkCanvas } = useSnapshot(appSettings);
    const { canvasPreview: preview } = useSnapshot(appSettings.pathEditor);

    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const svgElement = useAtomValue(canvasSvgElementAtom);

    const setFocusedImageId = useSetAtom(focusedImageIdAtom);
    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setCanvasSvgElement = useSetAtom(canvasSvgElementAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const fitViewBox = useSetAtom(doFitViewBoxAtom);

    const dragState = useAtomValue(canvasDragStateAtom);
    const { onTouchEnd, onTouchMove, onTouchStart, startCanvasDrag } = useCanvasDragAndDrop(viewBox);

    useSyncCanvasViewportSize();

    useEffect(
        () => {
            fitViewBox();
        },
        [fitViewBox, pathValue]);

    return (
        <div className={classNames("relative mx-auto aspect-4/3 w-full overflow-hidden rounded-xl border", preview ? "bg-white" : (darkCanvas ? "bg-zinc-900" : "bg-white"))}>
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
                    zoomViewBox({ scale, center });
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
                {!preview && <CanvasGrid />}

                <PathCanvasImages />

                <CanvasPathOverlays />

                <CanvasHelperOverlays />

                <PathCanvasImageEditOverlays />
            </svg>

            {parseError && (
                <div className="absolute inset-x-4 bottom-4 px-3 py-2 text-xs text-destructive-foreground bg-destructive/90 rounded-md pointer-events-none">
                    {parseError}
                </div>
            )}
        </div>
    );
}
