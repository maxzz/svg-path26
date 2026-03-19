import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type TouchEvent } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type Point, type SvgCanvasPoint, type ViewBox } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasSvgElementAtom } from "../../../store/0-atoms/2-1-canvas-viewport";
import { doSetPointLocationWithoutHistoryAtom, draggedCanvasPointAtom, isCanvasDraggingAtom } from "@/store/0-atoms/2-2-editor-actions";
import { doPanViewBoxAtom, doZoomViewBoxAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { doCommitCurrentPathToHistoryAtom } from "@/store/0-atoms/1-2-history";
import { doUpdateImageAtom, isImageEditModeAtom, type EditorImage } from "@/store/0-atoms/2-4-images";

export type DragState =
    | { mode: "point"; pointerId: number; point: SvgCanvasPoint; startPath: string; }
    | { mode: "canvas"; pointerId: number; lastClientX: number; lastClientY: number; moved: boolean; }
    | { mode: "image"; pointerId: number; imageId: string; handle: ImageHandle; start: Point; initial: EditorImage; };

export type ImageHandle = "move" | "left" | "right" | "top" | "bottom" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

type TouchGestureState =
    | { mode: "pan"; lastClientX: number; lastClientY: number; }
    | { mode: "pinch"; lastDistance: number; lastCenter: Point; };

export const canvasDragStateAtom = atom<DragState | null>(null);

export const doStartCanvasDragAtom = atom(
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

export const doStartPointDragAtom = atom(
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

export const doStartImageDragAtom = atom(
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

export const doStopCanvasDragAtom = atom(
    null,
    (_get, set) => {
        set(canvasDragStateAtom, null);
        set(draggedCanvasPointAtom, null);
        set(isCanvasDraggingAtom, false);
    }
);

export function useCanvasDragAndDrop(viewBox: ViewBox) {
    const { canvasPreview, snapToGrid, pointPrecision, viewPortLocked } = useSnapshot(appSettings.pathEditor);

    const svgElement = useAtomValue(canvasSvgElementAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const [dragState, setDragState] = useAtom(canvasDragStateAtom);

    const doStopCanvasDrag = useSetAtom(doStopCanvasDragAtom);
    const doCommitCurrentPathToHistory = useSetAtom(doCommitCurrentPathToHistoryAtom);
    const setPathValue = useSetAtom(svgPathInputAtom);
    const setPointLocationWithoutHistory = useSetAtom(doSetPointLocationWithoutHistoryAtom);
    const doPanViewBox = useSetAtom(doPanViewBoxAtom);
    const doZoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const doUpdateImage = useSetAtom(doUpdateImageAtom);
    const doBeginCanvasDrag = useSetAtom(doStartCanvasDragAtom);
    const doStartImageDrag = useSetAtom(doStartImageDragAtom);

    const touchGestureRef = useRef<TouchGestureState | null>(null);
    const [, , vw, vh] = viewBox;

    useEffect(
        () => {
            if (!dragState) return;

            function onPointerMove(event: PointerEvent) {
                if (!dragState) return;
                if (event.pointerId !== dragState.pointerId) return;
                if (!svgElement) return;

                const next = eventToSvgPoint(svgElement, event.clientX, event.clientY, viewBox);
                if (!next) return;

                if (dragState.mode === "point") {
                    const baseDecimals = snapToGrid ? 0 : Math.max(0, pointPrecision);
                    const decimals = event.ctrlKey ? (baseDecimals ? 0 : 3) : baseDecimals;
                    const x = Number.parseFloat(next.x.toFixed(decimals));
                    const y = Number.parseFloat(next.y.toFixed(decimals));
                    setPointLocationWithoutHistory({
                        point: dragState.point,
                        to: { x, y },
                    });
                    return;
                }

                if (dragState.mode === "canvas") {
                    if (viewPortLocked) return;
                    const rect = svgElement.getBoundingClientRect();
                    if (!rect.width || !rect.height) return;
                    const dxPx = event.clientX - dragState.lastClientX;
                    const dyPx = event.clientY - dragState.lastClientY;
                    const dx = -(dxPx / rect.width) * vw;
                    const dy = -(dyPx / rect.height) * vh;
                    doPanViewBox({ dx, dy });
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
                doUpdateImage({
                    id: dragState.imageId,
                    patch,
                });
            }

            function onPointerUp(event: PointerEvent) {
                if (!dragState) return;
                if (event.pointerId !== dragState.pointerId) return;

                if (dragState.mode === "point") {
                    doCommitCurrentPathToHistory(dragState.startPath);
                }
                doStopCanvasDrag();
            }

            const controller = new AbortController();
            window.addEventListener("pointermove", onPointerMove, { signal: controller.signal });
            window.addEventListener("pointerup", onPointerUp, { signal: controller.signal });
            window.addEventListener("pointercancel", onPointerUp, { signal: controller.signal });
            return () => controller.abort();
        },
        [dragState, pointPrecision, snapToGrid, svgElement, vh, viewBox, viewPortLocked, vw]);

    useEffect(
        () => {
            if (!dragState) return;

            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key !== "Escape") return;
                event.preventDefault();

                if (dragState.mode === "point") {
                    setPathValue(dragState.startPath);
                } else if (dragState.mode === "image") {
                    doUpdateImage({
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

                doStopCanvasDrag();
            };

            const controller = new AbortController();
            window.addEventListener("keydown", onKeyDown, { signal: controller.signal });
            return () => controller.abort();
        },
        [dragState]);

    function onTouchStart(event: TouchEvent<SVGSVGElement>) {
        if (imageEditMode || canvasPreview) return;
        if (event.target !== event.currentTarget) return;
        if (!svgElement) return;

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
            const p1 = eventToSvgPoint(svgElement, first.clientX, first.clientY, viewBox);
            const p2 = eventToSvgPoint(svgElement, second.clientX, second.clientY, viewBox);
            if (!p1 || !p2) return;
            touchGestureRef.current = {
                mode: "pinch",
                lastDistance: distanceBetween(p1, p2),
                lastCenter: midpoint(p1, p2),
            };
        }
    }

    function onTouchMove(event: TouchEvent<SVGSVGElement>) {
        if (imageEditMode || canvasPreview) return;
        if (!svgElement || !touchGestureRef.current) return;
        if (event.touches.length === 0) return;
        event.preventDefault();

        if (event.touches.length === 2) {
            const p1 = eventToSvgPoint(svgElement, event.touches[0].clientX, event.touches[0].clientY, viewBox);
            const p2 = eventToSvgPoint(svgElement, event.touches[1].clientX, event.touches[1].clientY, viewBox);
            if (!p1 || !p2) return;
            const center = midpoint(p1, p2);
            const distance = distanceBetween(p1, p2);
            const previous = touchGestureRef.current;
            if (previous.mode === "pinch" && previous.lastDistance > 0 && distance > 0) {
                const scale = previous.lastDistance / distance;
                doZoomViewBox({ scale, center });
                doPanViewBox({
                    dx: previous.lastCenter.x - center.x,
                    dy: previous.lastCenter.y - center.y,
                });
            }
            touchGestureRef.current = {
                mode: "pinch",
                lastDistance: distance,
                lastCenter: center,
            };
        }
        else if (event.touches.length === 1) {
            const touch = event.touches[0];
            const previous = touchGestureRef.current;
            if (previous.mode === "pan" && svgElement) {
                const rect = svgElement.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                const dxPx = touch.clientX - previous.lastClientX;
                const dyPx = touch.clientY - previous.lastClientY;
                const dx = -(dxPx / rect.width) * vw;
                const dy = -(dyPx / rect.height) * vh;
                doPanViewBox({ dx, dy });
            }
            touchGestureRef.current = {
                mode: "pan",
                lastClientX: touch.clientX,
                lastClientY: touch.clientY,
            };
        }
    }

    function onTouchEnd(event: TouchEvent<SVGSVGElement>) {
        if (!svgElement) {
            touchGestureRef.current = null;
            return;
        }

        if (event.touches.length === 0) {
            touchGestureRef.current = null;
            return;
        }
        else if (event.touches.length === 1) {
            const touch = event.touches[0];
            touchGestureRef.current = {
                mode: "pan",
                lastClientX: touch.clientX,
                lastClientY: touch.clientY,
            };
            return;
        }
        else if (event.touches.length === 2) {
            const p1 = eventToSvgPoint(svgElement, event.touches[0].clientX, event.touches[0].clientY, viewBox);
            const p2 = eventToSvgPoint(svgElement, event.touches[1].clientX, event.touches[1].clientY, viewBox);
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
    }

    function startCanvasDrag(event: ReactPointerEvent<SVGSVGElement>) {
        if (event.pointerType === "touch") return;
        if (event.button !== 0 || imageEditMode || canvasPreview) return;
        doBeginCanvasDrag({
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
        });
    }

    return {
        dragState,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        startCanvasDrag,
        startImageDrag: doStartImageDrag,
    };
}

export function eventToSvgPoint(svg: SVGSVGElement | null, clientX: number, clientY: number, viewBox: ViewBox): Point | null {
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
