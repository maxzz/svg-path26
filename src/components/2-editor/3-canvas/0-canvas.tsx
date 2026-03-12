import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { CanvasGrid } from "./1-canvas-grid";
import { CanvasHelperOverlays } from "./2-canvas-helper-overlays";
import { canvasDragStateAtom, eventToSvgPoint, useCanvasDragAndDrop } from "./3-canvas-drag";
import { PathCanvasImageEditOverlays, PathCanvasImages } from "./4-canvas-image-edit-overlays";
import {
    canvasStrokeWidthAtom,
    canvasSvgElementAtom,
    hoveredSegmentStrokeWidthAtom,
    selectedSegmentStrokeWidthAtom,
    useSyncCanvasViewportSize,
} from "./5-canvas-viewport-metrics";
import { appSettings } from "@/store/0-ui-settings";
import {
    hoveredCanvasPointAtom,
    hoveredCommandIndexAtom,
    hoveredStandaloneSegmentPathAtom,
    selectedCommandIndexAtom,
    selectedStandaloneSegmentPathAtom,
} from "@/store/0-atoms/2-2-editor-actions";
import { parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { canvasViewBoxAtom, doFitViewBoxAtom, doZoomViewBoxAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { focusedImageIdAtom, isImageEditModeAtom } from "@/store/0-atoms/2-4-images";

export function PathCanvas() {
    const { darkCanvas } = useSnapshot(appSettings);
    const { canvasPreview: preview, fillPreview } = useSnapshot(appSettings.pathEditor);

    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const selectedSegmentPath = useAtomValue(selectedStandaloneSegmentPathAtom);
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const hoveredSegmentStrokeWidth = useAtomValue(hoveredSegmentStrokeWidthAtom);
    const selectedSegmentStrokeWidth = useAtomValue(selectedSegmentStrokeWidthAtom);
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

    useEffect(() => {
        fitViewBox();
    }, [fitViewBox, pathValue]);

    return (
        <div
            className={classNames(
                "relative mx-auto aspect-4/3 w-full overflow-hidden rounded-xl border",
                preview ? "bg-white" : (darkCanvas ? "bg-zinc-900" : "bg-white"),
            )}
        >
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

                <path
                    d={parseError ? "M 0 0" : (pathValue || "M 0 0")}
                    className={classNames(getCanvasPathFillClasses(preview, fillPreview), getCanvasPathStrokeClasses(preview, darkCanvas))}
                    strokeWidth={canvasStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {!preview && hoveredSegmentPath && (
                    <path
                        d={hoveredSegmentPath}
                        className={hoveredSegmentPathClasses}
                        strokeWidth={hoveredSegmentStrokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {!preview && selectedSegmentPath && (
                    <path
                        d={selectedSegmentPath}
                        className={selectedSegmentPathClasses}
                        strokeWidth={selectedSegmentStrokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                <PathCanvasImages />

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

const canvasPathPreviewFillClasses = "fill-black/20";
const canvasPathEditorFillClasses = "fill-blue-500/25";
const canvasPathNoFillClasses = "fill-none";
const canvasPathPreviewStrokeClasses = "stroke-black";
const canvasPathDarkStrokeClasses = "stroke-slate-200";
const canvasPathLightStrokeClasses = "stroke-blue-700";

const hoveredSegmentPathClasses = "fill-none stroke-red-400";
const selectedSegmentPathClasses = "fill-none stroke-sky-500";

function getCanvasPathFillClasses(preview: boolean, fillPreview: boolean): string {
    if (!fillPreview) return canvasPathNoFillClasses;
    return preview ? canvasPathPreviewFillClasses : canvasPathEditorFillClasses;
}

function getCanvasPathStrokeClasses(preview: boolean, darkCanvas: boolean): string {
    if (preview) return canvasPathPreviewStrokeClasses;
    return darkCanvas ? canvasPathDarkStrokeClasses : canvasPathLightStrokeClasses;
}
