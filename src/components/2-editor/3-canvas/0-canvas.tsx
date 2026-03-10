import { useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { CanvasGrid } from "./1-canvas-grid";
import { CanvasHelperOverlays } from "./2-canvas-helper-overlays";
import { canvasDragStateAtom, eventToSvgPoint, useCanvasDragAndDrop } from "./3-canvas-drag";
import { PathCanvasImageEditOverlays } from "./4-canvas-image-edit-overlays";
import { appSettings } from "@/store/1-ui-settings";
import {
    canvasPreviewAtom,
    canvasViewBoxAtom,
    doFitViewBoxAtom,
    doZoomViewBoxAtom,
    fillPreviewAtom,
    focusedImageIdAtom,
    hoveredCommandIndexAtom,
    hoveredStandaloneSegmentPathAtom,
    imagesAtom,
    isImageEditModeAtom,
    parseErrorAtom,
    selectedCommandIndexAtom,
    selectedStandaloneSegmentPathAtom,
    strokeWidthAtom,
    svgPathInputAtom,
} from "@/store/0-atoms/2-svg-path-state";

export function PathCanvas() {
    const { darkCanvas } = useSnapshot(appSettings);

    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const strokeWidth = useAtomValue(strokeWidthAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const selectedSegmentPath = useAtomValue(selectedStandaloneSegmentPathAtom);
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const fillPreview = useAtomValue(fillPreviewAtom);
    const preview = useAtomValue(canvasPreviewAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const images = useAtomValue(imagesAtom);
    const [focusedImageId, setFocusedImageId] = useAtom(focusedImageIdAtom);

    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const fitViewBox = useSetAtom(doFitViewBoxAtom);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const dragState = useAtomValue(canvasDragStateAtom);
    const { onTouchEnd, onTouchMove, onTouchStart, startCanvasDrag, startImageDrag, } = useCanvasDragAndDrop(svgRef, viewBox);

    useEffect(() => {
        fitViewBox();
    }, [fitViewBox, pathValue]);

    return (
        <div
            className={classNames(
                "relative mx-auto aspect-4/3 w-full max-w-4xl overflow-hidden rounded-xl border",
                preview ? "bg-white" : (darkCanvas ? "bg-zinc-900" : "bg-white"),
            )}
        >
            <svg
                ref={svgRef}
                viewBox={viewBox.join(" ")}
                className="size-full touch-none"
                onWheel={(event) => {
                    event.preventDefault();
                    if (!svgRef.current) return;
                    const center = eventToSvgPoint(svgRef.current, event.clientX, event.clientY, viewBox);
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
                        setFocusedImageId(null);
                    }
                }}
            >
                {!preview && <CanvasGrid />}

                <path
                    d={parseError ? "M 0 0" : (pathValue || "M 0 0")}
                    className={classNames(getCanvasPathFillClasses(preview, fillPreview), getCanvasPathStrokeClasses(preview, darkCanvas))}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {!preview && hoveredSegmentPath && (
                    <path
                        d={hoveredSegmentPath}
                        className={hoveredSegmentPathClasses}
                        strokeWidth={Math.max(strokeWidth * 1.4, 0.8)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {!preview && selectedSegmentPath && (
                    <path
                        d={selectedSegmentPath}
                        className={selectedSegmentPathClasses}
                        strokeWidth={Math.max(strokeWidth * 1.6, 0.95)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {images.map(
                    (image) => (
                        <image
                            key={image.id}
                            href={image.data}
                            x={Math.min(image.x1, image.x2)}
                            y={Math.min(image.y1, image.y2)}
                            width={Math.abs(image.x2 - image.x1)}
                            height={Math.abs(image.y2 - image.y1)}
                            preserveAspectRatio={image.preserveAspectRatio ? "xMidYMid meet" : "none"}
                            opacity={image.opacity}
                        />
                    )
                )}

                <CanvasHelperOverlays />

                <PathCanvasImageEditOverlays
                    preview={preview}
                    imageEditMode={imageEditMode}
                    images={images}
                    focusedImageId={focusedImageId}
                    setFocusedImageId={setFocusedImageId}
                    svgRef={svgRef}
                    viewBox={viewBox}
                    startImageDrag={startImageDrag}
                />
            </svg>

            {parseError && (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-md bg-destructive/90 px-3 py-2 text-xs text-destructive-foreground">
                    {parseError}
                </div>
            )}
        </div>
    );
}

const canvasPathPreviewFillClasses = "fill-[oklch(0_0_0/0.18)]";
const canvasPathEditorFillClasses = "fill-[oklch(0.65_0.1_260/0.25)]";
const canvasPathNoFillClasses = "fill-none";
const canvasPathPreviewStrokeClasses = "stroke-black";
const canvasPathDarkStrokeClasses = "stroke-[oklch(0.9_0.05_260)]";
const canvasPathLightStrokeClasses = "stroke-[oklch(0.45_0.2_260)]";

const hoveredSegmentPathClasses = "fill-none stroke-[oklch(0.68_0.25_26)]";
const selectedSegmentPathClasses = "fill-none stroke-[oklch(0.68_0.2_240)]";

function getCanvasPathFillClasses(preview: boolean, fillPreview: boolean): string {
    if (!fillPreview) return canvasPathNoFillClasses;
    return preview ? canvasPathPreviewFillClasses : canvasPathEditorFillClasses;
}

function getCanvasPathStrokeClasses(preview: boolean, darkCanvas: boolean): string {
    if (preview) return canvasPathPreviewStrokeClasses;
    return darkCanvas ? canvasPathDarkStrokeClasses : canvasPathLightStrokeClasses;
}
