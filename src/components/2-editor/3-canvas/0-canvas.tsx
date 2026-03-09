import { useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { CanvasGrid } from "./1-canvas-grid";
import { CanvasHelperOverlays } from "./2-canvas-helper-overlays";
import { buildImageHandles, canvasDragStateAtom, eventToSvgPoint, useCanvasDragAndDrop } from "./3-canvas-drag";
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
    const [, setHoveredCommandIndex] = useAtom(hoveredCommandIndexAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const fitViewBox = useSetAtom(doFitViewBoxAtom);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const dragState = useAtomValue(canvasDragStateAtom);
    const { onTouchEnd, onTouchMove, onTouchStart, startCanvasDrag, startImageDrag, } = useCanvasDragAndDrop(svgRef, viewBox);

    const [vx, vy, vw, vh] = viewBox;

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
                    fill={
                        fillPreview
                            ? (preview ? "oklch(0 0 0 / 0.18)" : "oklch(0.65 0.1 260 / 0.25)")
                            : "none"
                    }
                    stroke={
                        preview
                            ? "black"
                            : (darkCanvas ? "oklch(0.9 0.05 260)" : "oklch(0.45 0.2 260)")
                    }
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {!preview && hoveredSegmentPath && (
                    <path
                        d={hoveredSegmentPath}
                        fill="none"
                        stroke={darkCanvas ? "oklch(0.68 0.25 26)" : "oklch(0.68 0.25 26)"}
                        strokeWidth={Math.max(strokeWidth * 1.4, 0.8)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {!preview && selectedSegmentPath && (
                    <path
                        d={selectedSegmentPath}
                        fill="none"
                        stroke="oklch(0.68 0.2 240)"
                        strokeWidth={Math.max(strokeWidth * 1.6, 0.95)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {images.map((image) => (
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
                ))}

                <CanvasHelperOverlays />

                {!preview && imageEditMode && images.map((image) => (
                    <g
                        key={`edit:${image.id}`}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            const start = eventToSvgPoint(svgRef.current, event.clientX, event.clientY, viewBox);
                            if (!start) return;
                            startImageDrag({ pointerId: event.pointerId, imageId: image.id, handle: "move", start, initial: image });
                            setFocusedImageId(image.id);
                        }}
                    >
                        <rect
                            x={Math.min(image.x1, image.x2)}
                            y={Math.min(image.y1, image.y2)}
                            width={Math.abs(image.x2 - image.x1)}
                            height={Math.abs(image.y2 - image.y1)}
                            fill="transparent"
                            stroke={image.id === focusedImageId ? "oklch(0.68 0.2 240)" : "oklch(0.6 0 0 / 0.8)"}
                            strokeWidth={Math.max(vw, vh) / 900}
                            className="cursor-move"
                        />
                        {buildImageHandles(image).map((handle) => (
                            <circle
                                key={`${image.id}:${handle.type}`}
                                cx={handle.x}
                                cy={handle.y}
                                r={Math.max(vw, vh) / 180}
                                fill={image.id === focusedImageId ? "oklch(0.68 0.2 240)" : "oklch(0.65 0 0)"}
                                className="cursor-pointer"
                                onPointerDown={(event) => {
                                    event.stopPropagation();
                                    const start = eventToSvgPoint(svgRef.current, event.clientX, event.clientY, viewBox);
                                    if (!start) return;
                                    startImageDrag({ pointerId: event.pointerId, imageId: image.id, handle: handle.type, start, initial: image });
                                    setFocusedImageId(image.id);
                                }}
                            />
                        ))}
                    </g>
                ))}
            </svg>

            {parseError && (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-md bg-destructive/90 px-3 py-2 text-xs text-destructive-foreground">
                    {parseError}
                </div>
            )}
        </div>
    );
}
