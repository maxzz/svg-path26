import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { cn } from "@/utils";
import { appSettings } from "@/store/1-ui-settings";
import {
    canvasPreviewAtom,
    canvasViewBoxAtom,
    controlLinesAtom,
    controlPointsAtom,
    doFitViewBoxAtom,
    doFocusPointCommandAtom,
    doPanViewBoxAtom,
    doSetPointLocationAtom,
    doUpdateImageAtom,
    doZoomViewBoxAtom,
    draggedCanvasPointAtom,
    fillPreviewAtom,
    focusedImageIdAtom,
    hoveredCommandIndexAtom,
    hoveredStandaloneSegmentPathAtom,
    imagesAtom,
    isCanvasDraggingAtom,
    isImageEditModeAtom,
    parseErrorAtom,
    pointPrecisionAtom,
    selectedCommandIndexAtom,
    selectedStandaloneSegmentPathAtom,
    showTicksAtom,
    snapToGridAtom,
    strokeWidthAtom,
    svgPathInputAtom,
    targetPointsAtom,
    tickIntervalAtom,
    viewPortLockedAtom,
    viewPortXAtom,
    viewPortYAtom,
} from "@/store/0-atoms/2-svg-path-state";
import type { EditorImage } from "@/store/0-atoms/2-svg-path-state";
import type { Point, SvgCanvasPoint } from "@/svg-core/model";

type DragState =
    | { mode: "point"; pointerId: number; point: SvgCanvasPoint; startPath: string; }
    | { mode: "canvas"; pointerId: number; lastClientX: number; lastClientY: number; moved: boolean; }
    | { mode: "image"; pointerId: number; imageId: string; handle: ImageHandle; start: Point; initial: EditorImage; };

type ImageHandle = "move" | "left" | "right" | "top" | "bottom" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

type TouchGestureState =
    | { mode: "pan"; lastClientX: number; lastClientY: number; }
    | { mode: "pinch"; lastDistance: number; lastCenter: Point; };

export function PathCanvas() {
    const settings = useSnapshot(appSettings);
    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const strokeWidth = useAtomValue(strokeWidthAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const viewPortX = useAtomValue(viewPortXAtom);
    const viewPortY = useAtomValue(viewPortYAtom);
    const targetPoints = useAtomValue(targetPointsAtom);
    const controlPoints = useAtomValue(controlPointsAtom);
    const controlLines = useAtomValue(controlLinesAtom);
    const selectedSegmentPath = useAtomValue(selectedStandaloneSegmentPathAtom);
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const snapToGrid = useAtomValue(snapToGridAtom);
    const pointPrecision = useAtomValue(pointPrecisionAtom);
    const showTicks = useAtomValue(showTicksAtom);
    const tickInterval = useAtomValue(tickIntervalAtom);
    const fillPreview = useAtomValue(fillPreviewAtom);
    const preview = useAtomValue(canvasPreviewAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const images = useAtomValue(imagesAtom);
    const [focusedImageId, setFocusedImageId] = useAtom(focusedImageIdAtom);
    const viewPortLocked = useAtomValue(viewPortLockedAtom);

    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const [, setHoveredCommandIndex] = useAtom(hoveredCommandIndexAtom);
    const [, setDraggedCanvasPoint] = useAtom(draggedCanvasPointAtom);
    const [, setCanvasDragging] = useAtom(isCanvasDraggingAtom);

    const setPathValue = useSetAtom(svgPathInputAtom);
    const setPointLocation = useSetAtom(doSetPointLocationAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const panViewBox = useSetAtom(doPanViewBoxAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const fitViewBox = useSetAtom(doFitViewBoxAtom);
    const updateImage = useSetAtom(doUpdateImageAtom);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const touchGestureRef = useRef<TouchGestureState | null>(null);

    const [vx, vy, vw, vh] = viewBox;
    const grid = useMemo(() => buildGrid(vx, vy, vw, vh), [vx, vy, vw, vh]);

    useEffect(() => {
        fitViewBox();
    }, [fitViewBox, pathValue]);

    useEffect(() => {
        if (!dragState) return;

        const onPointerMove = (event: PointerEvent) => {
            if (event.pointerId !== dragState.pointerId) return;
            if (!svgRef.current) return;
            const next = eventToSvgPoint(svgRef.current, event.clientX, event.clientY, viewBox);
            if (!next) return;

            if (dragState.mode === "point") {
                const baseDecimals = snapToGrid ? 0 : Math.max(0, pointPrecision);
                const decimals = event.ctrlKey ? (baseDecimals ? 0 : 3) : baseDecimals;
                const x = Number.parseFloat(next.x.toFixed(decimals));
                const y = Number.parseFloat(next.y.toFixed(decimals));
                setPointLocation({
                    point: dragState.point,
                    to: { x, y },
                });
                return;
            }

            if (dragState.mode === "canvas") {
                if (viewPortLocked) return;
                const rect = svgRef.current.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                const dxPx = event.clientX - dragState.lastClientX;
                const dyPx = event.clientY - dragState.lastClientY;
                const dx = -(dxPx / rect.width) * vw;
                const dy = -(dyPx / rect.height) * vh;
                panViewBox({ dx, dy });
                setDragState({
                    ...dragState,
                    moved: dragState.moved || Math.abs(dxPx) > 1 || Math.abs(dyPx) > 1,
                    lastClientX: event.clientX,
                    lastClientY: event.clientY,
                });
                return;
            }

            const dx = next.x - dragState.start.x;
            const dy = next.y - dragState.start.y;
            const patch = patchImageByHandle(dragState.initial, dragState.handle, dx, dy);
            updateImage({
                id: dragState.imageId,
                patch,
            });
        };

        const onPointerUp = (event: PointerEvent) => {
            if (event.pointerId !== dragState.pointerId) return;
            setDragState(null);
            setDraggedCanvasPoint(null);
            setCanvasDragging(false);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
        };
    }, [dragState, panViewBox, pointPrecision, setCanvasDragging, setDraggedCanvasPoint, setPointLocation, snapToGrid, updateImage, vh, viewBox, viewPortLocked, vw]);

    useEffect(() => {
        if (!dragState) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();

            if (dragState.mode === "point") {
                setPathValue(dragState.startPath);
            } else if (dragState.mode === "image") {
                updateImage({
                    id: dragState.imageId,
                    patch: {
                        x1: dragState.initial.x1,
                        y1: dragState.initial.y1,
                        x2: dragState.initial.x2,
                        y2: dragState.initial.y2,
                        preserveAspectRatio: dragState.initial.preserveAspectRatio,
                        opacity: dragState.initial.opacity,
                    },
                });
            }

            setDragState(null);
            setDraggedCanvasPoint(null);
            setCanvasDragging(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [dragState, setCanvasDragging, setDraggedCanvasPoint, setPathValue, updateImage]);

    return (
        <div
            className={cn(
                "relative mx-auto aspect-4/3 w-full max-w-4xl overflow-hidden rounded-xl border",
                preview ? "bg-white" : (settings.darkCanvas ? "bg-zinc-900" : "bg-white"),
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
                    setCanvasDragging(true);
                    setDragState({
                        mode: "canvas",
                        pointerId: event.pointerId,
                        lastClientX: event.clientX,
                        lastClientY: event.clientY,
                        moved: false,
                    });
                }}
                onTouchStart={(event) => {
                    if (imageEditMode || preview) return;
                    if (event.target !== event.currentTarget) return;
                    if (!svgRef.current) return;
                    if (event.touches.length === 1) {
                        const touch = event.touches[0];
                        touchGestureRef.current = {
                            mode: "pan",
                            lastClientX: touch.clientX,
                            lastClientY: touch.clientY,
                        };
                        return;
                    }
                    if (event.touches.length === 2) {
                        const first = event.touches[0];
                        const second = event.touches[1];
                        const p1 = eventToSvgPoint(svgRef.current, first.clientX, first.clientY, viewBox);
                        const p2 = eventToSvgPoint(svgRef.current, second.clientX, second.clientY, viewBox);
                        if (!p1 || !p2) return;
                        touchGestureRef.current = {
                            mode: "pinch",
                            lastDistance: distanceBetween(p1, p2),
                            lastCenter: midpoint(p1, p2),
                        };
                    }
                }}
                onTouchMove={(event) => {
                    if (imageEditMode || preview) return;
                    if (!svgRef.current || !touchGestureRef.current) return;
                    if (event.touches.length === 0) return;
                    event.preventDefault();

                    if (event.touches.length === 2) {
                        const p1 = eventToSvgPoint(svgRef.current, event.touches[0].clientX, event.touches[0].clientY, viewBox);
                        const p2 = eventToSvgPoint(svgRef.current, event.touches[1].clientX, event.touches[1].clientY, viewBox);
                        if (!p1 || !p2) return;
                        const center = midpoint(p1, p2);
                        const distance = distanceBetween(p1, p2);
                        const previous = touchGestureRef.current;
                        if (previous.mode === "pinch" && previous.lastDistance > 0 && distance > 0) {
                            const scale = previous.lastDistance / distance;
                            zoomViewBox({ scale, center });
                            panViewBox({
                                dx: previous.lastCenter.x - center.x,
                                dy: previous.lastCenter.y - center.y,
                            });
                        }
                        touchGestureRef.current = {
                            mode: "pinch",
                            lastDistance: distance,
                            lastCenter: center,
                        };
                        return;
                    }

                    if (event.touches.length === 1) {
                        const touch = event.touches[0];
                        const previous = touchGestureRef.current;
                        if (previous.mode === "pan" && svgRef.current) {
                            const rect = svgRef.current.getBoundingClientRect();
                            if (!rect.width || !rect.height) return;
                            const dxPx = touch.clientX - previous.lastClientX;
                            const dyPx = touch.clientY - previous.lastClientY;
                            const dx = -(dxPx / rect.width) * vw;
                            const dy = -(dyPx / rect.height) * vh;
                            panViewBox({ dx, dy });
                        }
                        touchGestureRef.current = {
                            mode: "pan",
                            lastClientX: touch.clientX,
                            lastClientY: touch.clientY,
                        };
                    }
                }}
                onTouchEnd={(event) => {
                    if (!svgRef.current) {
                        touchGestureRef.current = null;
                        return;
                    }
                    if (event.touches.length === 0) {
                        touchGestureRef.current = null;
                        return;
                    }
                    if (event.touches.length === 1) {
                        const touch = event.touches[0];
                        touchGestureRef.current = {
                            mode: "pan",
                            lastClientX: touch.clientX,
                            lastClientY: touch.clientY,
                        };
                        return;
                    }
                    if (event.touches.length === 2) {
                        const p1 = eventToSvgPoint(svgRef.current, event.touches[0].clientX, event.touches[0].clientY, viewBox);
                        const p2 = eventToSvgPoint(svgRef.current, event.touches[1].clientX, event.touches[1].clientY, viewBox);
                        if (!p1 || !p2) {
                            touchGestureRef.current = null;
                            return;
                        }
                        touchGestureRef.current = {
                            mode: "pinch",
                            lastDistance: distanceBetween(p1, p2),
                            lastCenter: midpoint(p1, p2),
                        };
                        return;
                    }
                    touchGestureRef.current = null;
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        if (dragState?.mode === "canvas" && dragState.moved) return;
                        setSelectedCommandIndex(null);
                        setHoveredCommandIndex(null);
                        setFocusedImageId(null);
                    }
                }}
            >
                {settings.showGrid && !preview && (
                    <>
                        {grid.xValues.map((x) => (
                            <line
                                key={`gx:${x}`}
                                x1={x}
                                y1={vy}
                                x2={x}
                                y2={vy + vh}
                                stroke={showTicks && isTick(x, tickInterval) ? "oklch(0.45 0 0 / 0.55)" : "oklch(0.45 0 0 / 0.35)"}
                                strokeWidth={Math.max(vw, vh) / 1300}
                            />
                        ))}
                        {grid.yValues.map((y) => (
                            <line
                                key={`gy:${y}`}
                                x1={vx}
                                y1={y}
                                x2={vx + vw}
                                y2={y}
                                stroke={showTicks && isTick(y, tickInterval) ? "oklch(0.45 0 0 / 0.55)" : "oklch(0.45 0 0 / 0.35)"}
                                strokeWidth={Math.max(vw, vh) / 1300}
                            />
                        ))}
                        <line
                            x1={0}
                            y1={vy}
                            x2={0}
                            y2={vy + vh}
                            stroke="oklch(0.7 0 0 / 0.7)"
                            strokeWidth={Math.max(vw, vh) / 500}
                        />
                        <line
                            x1={vx}
                            y1={0}
                            x2={vx + vw}
                            y2={0}
                            stroke="oklch(0.7 0 0 / 0.7)"
                            strokeWidth={Math.max(vw, vh) / 500}
                        />
                    </>
                )}

                {!preview && showTicks && settings.showGrid && (
                    <>
                        {grid.xValues.filter((x) => x !== 0 && isTick(x, tickInterval)).map((x) => (
                            <text
                                key={`tx:${x}`}
                                x={x}
                                y={viewPortY + Math.max(vh / 35, 1)}
                                textAnchor="middle"
                                fontSize={Math.max(vw, vh) / 45}
                                fill={settings.darkCanvas ? "oklch(0.7 0 0)" : "oklch(0.5 0 0)"}
                                style={{ userSelect: "none" }}
                            >
                                {formatTick(x)}
                            </text>
                        ))}
                        {grid.yValues.filter((y) => y !== 0 && isTick(y, tickInterval)).map((y) => (
                            <text
                                key={`ty:${y}`}
                                x={viewPortX + Math.max(vw / 70, 1)}
                                y={y}
                                dominantBaseline="middle"
                                fontSize={Math.max(vw, vh) / 45}
                                fill={settings.darkCanvas ? "oklch(0.7 0 0)" : "oklch(0.5 0 0)"}
                                style={{ userSelect: "none" }}
                            >
                                {formatTick(y)}
                            </text>
                        ))}
                    </>
                )}

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
                            : (settings.darkCanvas ? "oklch(0.9 0.05 260)" : "oklch(0.45 0.2 260)")
                    }
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {!preview && hoveredSegmentPath && (
                    <path
                        d={hoveredSegmentPath}
                        fill="none"
                        stroke="oklch(0.68 0.25 26)"
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

                {!preview && !imageEditMode && settings.showHelpers && controlLines.map((line, index) => (
                    <line
                        key={`line:${index}`}
                        x1={line.from.x}
                        y1={line.from.y}
                        x2={line.to.x}
                        y2={line.to.y}
                        stroke={settings.darkCanvas ? "oklch(0.65 0 0 / 0.6)" : "oklch(0.45 0 0 / 0.6)"}
                        strokeWidth={Math.max(vw, vh) / 1400}
                    />
                ))}

                {!preview && !imageEditMode && settings.showHelpers && controlPoints.map((point) => (
                    <circle
                        key={point.id}
                        cx={point.x}
                        cy={point.y}
                        r={point.movable ? 1.45 : 1.2}
                        fill={
                            point.segmentIndex === selectedCommandIndex
                                ? "oklch(0.68 0.18 240)"
                                : "oklch(0.63 0 0)"
                        }
                        stroke="transparent"
                        className={cn(point.movable ? "cursor-pointer" : "cursor-default")}
                        onPointerDown={(event) => {
                            if (!point.movable) return;
                            event.stopPropagation();
                            setFocusPointCommand(point);
                            setSelectedCommandIndex(point.segmentIndex);
                            setDraggedCanvasPoint(point);
                            setCanvasDragging(true);
                            setDragState({
                                mode: "point",
                                point,
                                pointerId: event.pointerId,
                                startPath: pathValue,
                            });
                        }}
                        onMouseEnter={() => setHoveredCommandIndex(point.segmentIndex)}
                        onMouseLeave={() => setHoveredCommandIndex(null)}
                    />
                ))}

                {!preview && !imageEditMode && settings.showHelpers && targetPoints.map((point) => (
                    <circle
                        key={point.id}
                        cx={point.x}
                        cy={point.y}
                        r={point.segmentIndex === selectedCommandIndex ? 2.15 : 1.7}
                        fill={
                            point.segmentIndex === selectedCommandIndex
                                ? "oklch(0.68 0.2 240)"
                                : "oklch(0.84 0.22 30)"
                        }
                        stroke={point.segmentIndex === selectedCommandIndex ? "oklch(1 0 0 / 0.75)" : "transparent"}
                        strokeWidth={point.segmentIndex === selectedCommandIndex ? 0.5 : 0}
                        className={cn(point.movable ? "cursor-pointer transition-all" : "cursor-default")}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            setFocusPointCommand(point);
                            setSelectedCommandIndex(point.segmentIndex);
                            if (!point.movable) return;
                            setDraggedCanvasPoint(point);
                            setCanvasDragging(true);
                            setDragState({
                                mode: "point",
                                point,
                                pointerId: event.pointerId,
                                startPath: pathValue,
                            });
                        }}
                        onMouseEnter={() => setHoveredCommandIndex(point.segmentIndex)}
                        onMouseLeave={() => setHoveredCommandIndex(null)}
                    />
                ))}

                {!preview && imageEditMode && images.map((image) => (
                    <g
                        key={`edit:${image.id}`}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            const start = eventToSvgPoint(svgRef.current, event.clientX, event.clientY, viewBox);
                            if (!start) return;
                            setDragState({
                                mode: "image",
                                pointerId: event.pointerId,
                                imageId: image.id,
                                handle: "move",
                                start,
                                initial: image,
                            });
                            setFocusedImageId(image.id);
                            setCanvasDragging(true);
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
                                    setDragState({
                                        mode: "image",
                                        pointerId: event.pointerId,
                                        imageId: image.id,
                                        handle: handle.type,
                                        start,
                                        initial: image,
                                    });
                                    setFocusedImageId(image.id);
                                    setCanvasDragging(true);
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

function eventToSvgPoint(
    svg: SVGSVGElement | null,
    clientX: number,
    clientY: number,
    viewBox: [number, number, number, number],
): Point | null {
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const [x, y, width, height] = viewBox;
    return {
        x: x + ((clientX - rect.left) / rect.width) * width,
        y: y + ((clientY - rect.top) / rect.height) * height,
    };
}

function distanceBetween(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
    };
}

function buildGrid(x: number, y: number, width: number, height: number) {
    const base = Math.max(width, height) / 16;
    const step = niceStep(base);
    const xStart = Math.floor(x / step) * step;
    const yStart = Math.floor(y / step) * step;

    const xValues: number[] = [];
    for (let value = xStart; value <= x + width + step * 0.5; value += step) {
        xValues.push(Number.parseFloat(value.toFixed(6)));
    }

    const yValues: number[] = [];
    for (let value = yStart; value <= y + height + step * 0.5; value += step) {
        yValues.push(Number.parseFloat(value.toFixed(6)));
    }

    return { xValues, yValues };
}

function niceStep(input: number): number {
    if (!Number.isFinite(input) || input <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(input));
    const normalized = input / power;
    if (normalized <= 1) return power;
    if (normalized <= 2) return 2 * power;
    if (normalized <= 5) return 5 * power;
    return 10 * power;
}

function isTick(value: number, interval: number): boolean {
    const safe = Math.max(1, Math.floor(interval));
    return Math.round(value / safe) * safe === Math.round(value);
}

function formatTick(value: number): string {
    if (Math.abs(value) >= 1000) return value.toFixed(0);
    if (Math.abs(value) >= 100) return value.toFixed(1);
    if (Math.abs(value) >= 1) return value.toFixed(2).replace(/\.?0+$/, "");
    return value.toFixed(3).replace(/\.?0+$/, "");
}

function buildImageHandles(image: EditorImage): Array<{ type: ImageHandle; x: number; y: number; }> {
    const left = image.x1;
    const right = image.x2;
    const top = image.y1;
    const bottom = image.y2;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;

    return [
        { type: "left", x: left, y: cy },
        { type: "right", x: right, y: cy },
        { type: "top", x: cx, y: top },
        { type: "bottom", x: cx, y: bottom },
        { type: "topLeft", x: left, y: top },
        { type: "topRight", x: right, y: top },
        { type: "bottomLeft", x: left, y: bottom },
        { type: "bottomRight", x: right, y: bottom },
    ];
}

function patchImageByHandle(image: EditorImage, handle: ImageHandle, dx: number, dy: number) {
    const next = { ...image };

    if (handle === "move") {
        next.x1 += dx;
        next.x2 += dx;
        next.y1 += dy;
        next.y2 += dy;
        return next;
    }

    if (handle === "left" || handle === "topLeft" || handle === "bottomLeft") {
        next.x1 += dx;
    }
    if (handle === "right" || handle === "topRight" || handle === "bottomRight") {
        next.x2 += dx;
    }
    if (handle === "top" || handle === "topLeft" || handle === "topRight") {
        next.y1 += dy;
    }
    if (handle === "bottom" || handle === "bottomLeft" || handle === "bottomRight") {
        next.y2 += dy;
    }

    if (image.preserveAspectRatio && handle !== "left" && handle !== "right" && handle !== "top" && handle !== "bottom") {
        const baseWidth = image.x2 - image.x1;
        const baseHeight = image.y2 - image.y1;
        if (baseWidth !== 0 && baseHeight !== 0) {
            const ratio = Math.abs(baseWidth / baseHeight);
            const width = next.x2 - next.x1;
            const signY = Math.sign(next.y2 - next.y1) || 1;
            next.y2 = next.y1 + (Math.abs(width) / ratio) * signY;
        }
    }

    return next;
}
