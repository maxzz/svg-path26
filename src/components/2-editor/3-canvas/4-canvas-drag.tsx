import { useEffect, useRef } from "react";
import type { RefObject, TouchEventHandler } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import {
    canvasPreviewAtom,
    doPanViewBoxAtom,
    doSetPointLocationAtom,
    doUpdateImageAtom,
    doZoomViewBoxAtom,
    draggedCanvasPointAtom,
    isCanvasDraggingAtom,
    isImageEditModeAtom,
    pointPrecisionAtom,
    snapToGridAtom,
    svgPathInputAtom,
    viewPortLockedAtom,
} from "@/store/0-atoms/2-svg-path-state";
import type { EditorImage } from "@/store/0-atoms/2-svg-path-state";
import type { Point, SvgCanvasPoint } from "@/svg-core/model";

export type DragState =
    | { mode: "point"; pointerId: number; point: SvgCanvasPoint; startPath: string; }
    | { mode: "canvas"; pointerId: number; lastClientX: number; lastClientY: number; moved: boolean; }
    | { mode: "image"; pointerId: number; imageId: string; handle: ImageHandle; start: Point; initial: EditorImage; };

export type ImageHandle = "move" | "left" | "right" | "top" | "bottom" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

type TouchGestureState =
    | { mode: "pan"; lastClientX: number; lastClientY: number; }
    | { mode: "pinch"; lastDistance: number; lastCenter: Point; };

export const canvasDragStateAtom = atom<DragState | null>(null);

export const startCanvasDragAtom = atom(
    null,
    (_get, set, args: { pointerId: number; clientX: number; clientY: number; }) => {
        set(draggedCanvasPointAtom, null);
        set(isCanvasDraggingAtom, true);
        set(canvasDragStateAtom, {
            mode: "canvas",
            pointerId: args.pointerId,
            lastClientX: args.clientX,
            lastClientY: args.clientY,
            moved: false,
        });
    }
);

export const startPointDragAtom = atom(
    null,
    (_get, set, args: { point: SvgCanvasPoint; pointerId: number; startPath: string; }) => {
        set(draggedCanvasPointAtom, args.point);
        set(isCanvasDraggingAtom, true);
        set(canvasDragStateAtom, {
            mode: "point",
            point: args.point,
            pointerId: args.pointerId,
            startPath: args.startPath,
        });
    }
);

export const startImageDragAtom = atom(
    null,
    (_get, set, args: { pointerId: number; imageId: string; handle: ImageHandle; start: Point; initial: EditorImage; }) => {
        set(draggedCanvasPointAtom, null);
        set(isCanvasDraggingAtom, true);
        set(canvasDragStateAtom, {
            mode: "image",
            pointerId: args.pointerId,
            imageId: args.imageId,
            handle: args.handle,
            start: args.start,
            initial: args.initial,
        });
    }
);

export const stopCanvasDragAtom = atom(
    null,
    (_get, set) => {
        set(canvasDragStateAtom, null);
        set(draggedCanvasPointAtom, null);
        set(isCanvasDraggingAtom, false);
    }
);

export function useCanvasDragAndDrop(
    svgRef: RefObject<SVGSVGElement | null>,
    viewBox: [number, number, number, number],
) {
    const dragState = useAtomValue(canvasDragStateAtom);
    const preview = useAtomValue(canvasPreviewAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const snapToGrid = useAtomValue(snapToGridAtom);
    const pointPrecision = useAtomValue(pointPrecisionAtom);
    const viewPortLocked = useAtomValue(viewPortLockedAtom);

    const setDragState = useSetAtom(canvasDragStateAtom);
    const stopCanvasDrag = useSetAtom(stopCanvasDragAtom);
    const setPathValue = useSetAtom(svgPathInputAtom);
    const setPointLocation = useSetAtom(doSetPointLocationAtom);
    const panViewBox = useSetAtom(doPanViewBoxAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const updateImage = useSetAtom(doUpdateImageAtom);
    const startCanvasDrag = useSetAtom(startCanvasDragAtom);
    const startImageDrag = useSetAtom(startImageDragAtom);

    const touchGestureRef = useRef<TouchGestureState | null>(null);
    const [, , vw, vh] = viewBox;

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
            stopCanvasDrag();
        };

        const controller = new AbortController();
        window.addEventListener("pointermove", onPointerMove, { signal: controller.signal });
        window.addEventListener("pointerup", onPointerUp, { signal: controller.signal });
        window.addEventListener("pointercancel", onPointerUp, { signal: controller.signal });
        return () => controller.abort();
    }, [dragState, panViewBox, pointPrecision, setDragState, setPointLocation, snapToGrid, stopCanvasDrag, svgRef, updateImage, vh, viewBox, viewPortLocked, vw]);

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

            stopCanvasDrag();
        };

        const controller = new AbortController();
        window.addEventListener("keydown", onKeyDown, { signal: controller.signal });
        return () => controller.abort();
    }, [dragState, setPathValue, stopCanvasDrag, updateImage]);

    const onTouchStart: TouchEventHandler<SVGSVGElement> = (event) => {
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
    };

    const onTouchMove: TouchEventHandler<SVGSVGElement> = (event) => {
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
    };

    const onTouchEnd: TouchEventHandler<SVGSVGElement> = (event) => {
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
    };

    return {
        dragState,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        startCanvasDrag,
        startImageDrag,
    };
}

export function eventToSvgPoint(
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

export function buildImageHandles(image: EditorImage): Array<{ type: ImageHandle; x: number; y: number; }> {
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

function distanceBetween(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
    };
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