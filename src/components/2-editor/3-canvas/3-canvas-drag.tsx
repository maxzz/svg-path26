import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type TouchEvent } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type Point, type SvgCanvasPoint, type ViewBox } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { controlPointsAtom, targetPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { canvasRootSvgElementAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { canvasSegmentHitAreaElementsAtom, doSetPointLocationWithoutHistoryAtom, doSuppressNextCanvasFocusClearAtom, doTranslateSelectedSegmentsWithoutHistoryAtom, draggedCanvasPointAtom, isCanvasDraggingAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-editor-actions";
import { applyCommandSelection, getMarqueeSelectionMode, getMarqueeSelectionIndices, type CommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils";
import { doPanViewPortAtom, doZoomViewPortAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { doCommitCurrentPathToHistoryAtom } from "@/store/0-atoms/1-2-history";
import { doUpdateImageAtom, isImageEditModeAtom, type EditorImage } from "@/store/0-atoms/2-8-images";
import { notice } from "@/components/ui/loacal-ui/7-toaster/7-toaster";

export type DragState =
    | { mode: "point"; pointerId: number; point: SvgCanvasPoint; startPath: string; }
    | { mode: "selection"; pointerId: number; segmentIndices: number[]; startPath: string; startClientX: number; startClientY: number; moved: boolean; viewBox: ViewBox; }
    | { mode: "canvas"; pointerId: number; lastClientX: number; lastClientY: number; moved: boolean; }
    | { mode: "marquee"; pointerId: number; start: Point; current: Point; startClientX: number; startClientY: number; moved: boolean; selectionMode: CommandSelectionMode; initialSelection: number[]; }
    | { mode: "image"; pointerId: number; imageId: string; handle: ImageHandle; start: Point; initial: EditorImage; };

export type ImageHandle = "move" | "left" | "right" | "top" | "bottom" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

type TouchGestureState =
    | { mode: "pan"; lastClientX: number; lastClientY: number; }
    | { mode: "pinch"; lastDistance: number; lastCenter: Point; };

type EdgeAutoPanDirection = { x: -1 | 0 | 1; y: -1 | 0 | 1; };

type EdgeAutoPanState = {
    clientX: number;
    clientY: number;
    direction: EdgeAutoPanDirection | null;
    activationTimeoutId: number | null;
    repeatIntervalId: number | null;
    accumulatedDx: number;
    accumulatedDy: number;
};

type LiveDragContext = {
    dragState: DragState | null;
    rootSvgElement: SVGSVGElement | null;
    viewPort: ViewBox;
    targetPoints: SvgCanvasPoint[];
    controlPoints: SvgCanvasPoint[];
    segmentHitAreaElements: Record<number, SVGPathElement | null>;
    snapToGrid: boolean;
    dragPrecision: number;
    viewPortLocked: boolean;
};

const EDGE_AUTO_PAN_ZONE_PX = 20;
const EDGE_AUTO_PAN_DELAY_MS = 1000;
const EDGE_AUTO_PAN_INTERVAL_MS = 120;
const EDGE_AUTO_PAN_STEP_PX = 8;
const EDGE_AUTO_PAN_MOVEMENT_TOLERANCE_PX = 2;

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

export const doStartMarqueeDragAtom = atom(
    null,
    (_get, set, args: {
        pointerId: number;
        start: Point;
        clientX: number;
        clientY: number;
        selectionMode: CommandSelectionMode;
        initialSelection: number[];
    }) => {
        set(draggedCanvasPointAtom, null);
        set(isCanvasDraggingAtom, true);
        set(canvasDragStateAtom, {
            mode: "marquee",
            pointerId: args.pointerId,
            start: args.start,
            current: args.start,
            startClientX: args.clientX,
            startClientY: args.clientY,
            moved: false,
            selectionMode: args.selectionMode,
            initialSelection: args.initialSelection,
        });
    }
);

export const doStartSelectedSegmentsDragAtom = atom(
    null,
    (get, set, args: { pointerId: number; clientX: number; clientY: number; startPath: string; segmentIndices?: number[]; }) => {
        const selection = args.segmentIndices?.length ? args.segmentIndices : get(selectedCommandIndicesAtom);
        if (!selection.length) return;

        const pathViewBox = get(pathViewBoxAtom);
        if (!isValidViewBox(pathViewBox)) {
            notice.info("Path viewBox is undefined, so the selected items cannot be moved.");
            return;
        }

        set(draggedCanvasPointAtom, null);
        set(isCanvasDraggingAtom, true);
        set(canvasDragStateAtom, {
            mode: "selection",
            pointerId: args.pointerId,
            segmentIndices: selection,
            startPath: args.startPath,
            startClientX: args.clientX,
            startClientY: args.clientY,
            moved: false,
            viewBox: pathViewBox,
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

export function useCanvasDragAndDrop(viewPort: ViewBox) {
    const { canvasPreview, snapToGrid } = useSnapshot(appSettings.canvas);
    const { dragPrecision, viewPortLocked } = useSnapshot(appSettings.pathEditor);

    const rootSvgElement = useAtomValue(canvasRootSvgElementAtom);
    const targetPoints = useAtomValue(targetPointsAtom);
    const controlPoints = useAtomValue(controlPointsAtom);
    const segmentHitAreaElements = useAtomValue(canvasSegmentHitAreaElementsAtom);
    const selectedCommandIndices = useAtomValue(selectedCommandIndicesAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const [dragState, setDragState] = useAtom(canvasDragStateAtom);

    const doStopCanvasDrag = useSetAtom(doStopCanvasDragAtom);
    const doCommitCurrentPathToHistory = useSetAtom(doCommitCurrentPathToHistoryAtom);
    const setPathValue = useSetAtom(svgPathInputAtom);
    const setPointLocationWithoutHistory = useSetAtom(doSetPointLocationWithoutHistoryAtom);
    const doTranslateSelectedSegmentsWithoutHistory = useSetAtom(doTranslateSelectedSegmentsWithoutHistoryAtom);
    const setSelectedCommandIndices = useSetAtom(selectedCommandIndicesAtom);
    const doSuppressNextCanvasFocusClear = useSetAtom(doSuppressNextCanvasFocusClearAtom);
    const doBeginCanvasDrag = useSetAtom(doStartCanvasDragAtom);
    const doPanViewPort = useSetAtom(doPanViewPortAtom);
    const doZoomViewPort = useSetAtom(doZoomViewPortAtom);
    const doUpdateImage = useSetAtom(doUpdateImageAtom);
    const doBeginMarqueeDrag = useSetAtom(doStartMarqueeDragAtom);
    const doStartImageDrag = useSetAtom(doStartImageDragAtom);

    const touchGestureRef = useRef<TouchGestureState | null>(null);
    const pointerCtrlKeyRef = useRef(false);
    const edgeAutoPanRef = useRef<EdgeAutoPanState>({
        clientX: 0,
        clientY: 0,
        direction: null,
        activationTimeoutId: null,
        repeatIntervalId: null,
        accumulatedDx: 0,
        accumulatedDy: 0,
    });
    const liveRef = useRef<LiveDragContext>({
        dragState,
        rootSvgElement,
        viewPort,
        targetPoints,
        controlPoints,
        segmentHitAreaElements,
        snapToGrid,
        dragPrecision,
        viewPortLocked,
    });
    liveRef.current = {
        dragState,
        rootSvgElement,
        viewPort,
        targetPoints,
        controlPoints,
        segmentHitAreaElements,
        snapToGrid,
        dragPrecision,
        viewPortLocked,
    };
    const [, , vw, vh] = viewPort;

    const stopEdgeAutoPanScheduling = useCallback(
        () => {
            const state = edgeAutoPanRef.current;
            if (state.activationTimeoutId !== null) {
                window.clearTimeout(state.activationTimeoutId);
                state.activationTimeoutId = null;
            }
            if (state.repeatIntervalId !== null) {
                window.clearInterval(state.repeatIntervalId);
                state.repeatIntervalId = null;
            }
            state.direction = null;
        },
        []);

    const resetEdgeAutoPan = useCallback(
        () => {
            stopEdgeAutoPanScheduling();
            edgeAutoPanRef.current.accumulatedDx = 0;
            edgeAutoPanRef.current.accumulatedDy = 0;
        },
        [stopEdgeAutoPanScheduling]);

    const replaceDragState = useCallback(
        (nextDragState: DragState) => {
            liveRef.current.dragState = nextDragState;
            setDragState(nextDragState);
        },
        [setDragState]);

    const applyViewPortPan = useCallback(
        (dx: number, dy: number): ViewBox => {
            doPanViewPort({ dx, dy });
            const [x, y, width, height] = liveRef.current.viewPort;
            const nextViewPort: ViewBox = [x + dx, y + dy, width, height];
            liveRef.current.viewPort = nextViewPort;
            return nextViewPort;
        },
        [doPanViewPort]);

    const stopActiveDrag = useCallback(
        () => {
            resetEdgeAutoPan();
            liveRef.current.dragState = null;
            doStopCanvasDrag();
        },
        [doStopCanvasDrag, resetEdgeAutoPan]);

    const applyDragAtClientPosition = useCallback(
        (clientX: number, clientY: number, viewPortOverride?: ViewBox) => {
            const current = liveRef.current;
            const activeDragState = current.dragState;
            const activeRootSvgElement = current.rootSvgElement;
            if (!activeDragState || !activeRootSvgElement) return;

            const activeViewPort = viewPortOverride ?? current.viewPort;
            const next = eventToSvgPoint(activeRootSvgElement, clientX, clientY, activeViewPort);
            if (!next) return;

            if (activeDragState.mode === "point") {
                const baseDecimals = current.snapToGrid ? 0 : Math.max(0, current.dragPrecision);
                const decimals = pointerCtrlKeyRef.current ? (baseDecimals ? 0 : 3) : baseDecimals;
                const x = Number.parseFloat(next.x.toFixed(decimals));
                const y = Number.parseFloat(next.y.toFixed(decimals));
                setPointLocationWithoutHistory({
                    point: activeDragState.point,
                    to: { x, y },
                });
                return;
            }

            if (activeDragState.mode === "selection") {
                const dxPx = clientX - activeDragState.startClientX;
                const dyPx = clientY - activeDragState.startClientY;
                const delta = clientDeltaToSvgDelta(activeRootSvgElement, dxPx, dyPx, activeDragState.viewBox);
                if (!delta) return;

                const totalDx = delta.x + edgeAutoPanRef.current.accumulatedDx;
                const totalDy = delta.y + edgeAutoPanRef.current.accumulatedDy;
                const moved = activeDragState.moved
                    || Math.abs(dxPx) > 1
                    || Math.abs(dyPx) > 1
                    || Math.abs(totalDx) > 1e-6
                    || Math.abs(totalDy) > 1e-6;
                if (moved !== activeDragState.moved) {
                    replaceDragState({ ...activeDragState, moved });
                }
                if (!moved) return;

                doTranslateSelectedSegmentsWithoutHistory({
                    segmentIndices: activeDragState.segmentIndices,
                    dx: totalDx,
                    dy: totalDy,
                    startPath: activeDragState.startPath,
                });
                return;
            }

            if (activeDragState.mode === "canvas") {
                if (current.viewPortLocked) return;
                const rect = activeRootSvgElement.getBoundingClientRect();
                if (!rect.width || !rect.height) return;

                const dxPx = clientX - activeDragState.lastClientX;
                const dyPx = clientY - activeDragState.lastClientY;
                const dx = -(dxPx / rect.width) * activeViewPort[2];
                const dy = -(dyPx / rect.height) * activeViewPort[3];
                applyViewPortPan(dx, dy);
                replaceDragState({
                    ...activeDragState,
                    moved: activeDragState.moved || Math.abs(dxPx) > 1 || Math.abs(dyPx) > 1,
                    lastClientX: clientX,
                    lastClientY: clientY,
                });
                return;
            }

            if (activeDragState.mode === "marquee") {
                const moved = activeDragState.moved
                    || Math.abs(clientX - activeDragState.startClientX) > 1
                    || Math.abs(clientY - activeDragState.startClientY) > 1;
                replaceDragState({
                    ...activeDragState,
                    current: next,
                    moved,
                });
                if (!moved) return;

                const nextSelection = applyCommandSelection(
                    activeDragState.initialSelection,
                    getMarqueeSelectionIndices({
                        start: activeDragState.start,
                        current: next,
                        targetPoints: current.targetPoints,
                        controlPoints: current.controlPoints,
                        pathElements: current.segmentHitAreaElements,
                    }),
                    activeDragState.selectionMode,
                );
                setSelectedCommandIndices(nextSelection);
                return;
            }

            const dx = next.x - activeDragState.start.x;
            const dy = next.y - activeDragState.start.y;
            const patch = patchImageByHandle(activeDragState.initial, activeDragState.handle, dx, dy);
            doUpdateImage({
                id: activeDragState.imageId,
                patch,
            });
        },
        [applyViewPortPan, doTranslateSelectedSegmentsWithoutHistory, doUpdateImage, replaceDragState, setPointLocationWithoutHistory, setSelectedCommandIndices]);

    const runEdgeAutoPanTick = useCallback(
        () => {
            const activeDragState = liveRef.current.dragState;
            const activeRootSvgElement = liveRef.current.rootSvgElement;
            if (!activeDragState || !activeRootSvgElement || !supportsEdgeAutoPan(activeDragState.mode) || liveRef.current.viewPortLocked) {
                stopEdgeAutoPanScheduling();
                return;
            }

            const rect = activeRootSvgElement.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                stopEdgeAutoPanScheduling();
                return;
            }

            const edgeDirection = getEdgeAutoPanDirection(
                rect,
                edgeAutoPanRef.current.clientX,
                edgeAutoPanRef.current.clientY,
                EDGE_AUTO_PAN_ZONE_PX,
            );
            if (!edgeDirection) {
                stopEdgeAutoPanScheduling();
                return;
            }

            const dx = (EDGE_AUTO_PAN_STEP_PX / rect.width) * liveRef.current.viewPort[2] * edgeDirection.x;
            const dy = (EDGE_AUTO_PAN_STEP_PX / rect.height) * liveRef.current.viewPort[3] * edgeDirection.y;
            if (dx === 0 && dy === 0) return;

            const nextViewPort = applyViewPortPan(dx, dy);
            edgeAutoPanRef.current.accumulatedDx += dx;
            edgeAutoPanRef.current.accumulatedDy += dy;
            applyDragAtClientPosition(edgeAutoPanRef.current.clientX, edgeAutoPanRef.current.clientY, nextViewPort);
        },
        [applyDragAtClientPosition, applyViewPortPan, stopEdgeAutoPanScheduling]);

    const scheduleEdgeAutoPan = useCallback(
        (clientX: number, clientY: number) => {
            const activeDragState = liveRef.current.dragState;
            const activeRootSvgElement = liveRef.current.rootSvgElement;
            const autoPanState = edgeAutoPanRef.current;

            const previousClientX = autoPanState.clientX;
            const previousClientY = autoPanState.clientY;
            const previousDirection = autoPanState.direction;

            autoPanState.clientX = clientX;
            autoPanState.clientY = clientY;

            if (!activeDragState || !activeRootSvgElement || !supportsEdgeAutoPan(activeDragState.mode) || liveRef.current.viewPortLocked) {
                stopEdgeAutoPanScheduling();
                return;
            }

            const rect = activeRootSvgElement.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                stopEdgeAutoPanScheduling();
                return;
            }

            const nextDirection = getEdgeAutoPanDirection(rect, clientX, clientY, EDGE_AUTO_PAN_ZONE_PX);
            if (!nextDirection) {
                stopEdgeAutoPanScheduling();
                return;
            }

            const movedEnough = Math.abs(previousClientX - clientX) > EDGE_AUTO_PAN_MOVEMENT_TOLERANCE_PX
                || Math.abs(previousClientY - clientY) > EDGE_AUTO_PAN_MOVEMENT_TOLERANCE_PX;
            const directionChanged = previousDirection?.x !== nextDirection.x || previousDirection?.y !== nextDirection.y;
            if (!movedEnough && !directionChanged) return;

            stopEdgeAutoPanScheduling();
            autoPanState.direction = nextDirection;
            autoPanState.activationTimeoutId = window.setTimeout(
                () => {
                    autoPanState.activationTimeoutId = null;
                    runEdgeAutoPanTick();
                    autoPanState.repeatIntervalId = window.setInterval(runEdgeAutoPanTick, EDGE_AUTO_PAN_INTERVAL_MS);
                },
                EDGE_AUTO_PAN_DELAY_MS,
            );
        },
        [runEdgeAutoPanTick, stopEdgeAutoPanScheduling]);

    useEffect(
        () => {
            if (!dragState) return;
            resetEdgeAutoPan();

            function onPointerMove(event: PointerEvent) {
                const activeDragState = liveRef.current.dragState;
                if (!activeDragState) return;
                if (event.pointerId !== activeDragState.pointerId) return;

                pointerCtrlKeyRef.current = event.ctrlKey;
                scheduleEdgeAutoPan(event.clientX, event.clientY);
                applyDragAtClientPosition(event.clientX, event.clientY);
            }

            function onPointerUp(event: PointerEvent) {
                const activeDragState = liveRef.current.dragState;
                if (!activeDragState) return;
                if (event.pointerId !== activeDragState.pointerId) return;

                if (activeDragState.mode === "point") {
                    doCommitCurrentPathToHistory(activeDragState.startPath);
                } else if (activeDragState.mode === "selection" && activeDragState.moved) {
                    doCommitCurrentPathToHistory(activeDragState.startPath);
                } else if (activeDragState.mode === "marquee") {
                    if (!activeDragState.moved) {
                        setSelectedCommandIndices(activeDragState.initialSelection);
                    }
                    doSuppressNextCanvasFocusClear();
                } else if (activeDragState.mode === "canvas" && activeDragState.moved) {
                    doSuppressNextCanvasFocusClear();
                }
                pointerCtrlKeyRef.current = false;
                stopActiveDrag();
            }

            const controller = new AbortController();
            window.addEventListener("pointermove", onPointerMove, { signal: controller.signal });
            window.addEventListener("pointerup", onPointerUp, { signal: controller.signal });
            window.addEventListener("pointercancel", onPointerUp, { signal: controller.signal });
            return () => {
                resetEdgeAutoPan();
                controller.abort();
            };
        },
        [applyDragAtClientPosition, doCommitCurrentPathToHistory, doSuppressNextCanvasFocusClear, dragState?.pointerId, resetEdgeAutoPan, scheduleEdgeAutoPan, setSelectedCommandIndices, stopActiveDrag]);

    useEffect(
        () => {
            if (!dragState) return;

            const onKeyDown = (event: KeyboardEvent) => {
                const activeDragState = liveRef.current.dragState;
                if (!activeDragState) return;
                if (event.key !== "Escape") return;
                event.preventDefault();

                if (activeDragState.mode === "point") {
                    setPathValue(activeDragState.startPath);
                } else if (activeDragState.mode === "selection") {
                    setPathValue(activeDragState.startPath);
                } else if (activeDragState.mode === "marquee") {
                    setSelectedCommandIndices(activeDragState.initialSelection);
                } else if (activeDragState.mode === "image") {
                    doUpdateImage({
                        id: activeDragState.imageId,
                        patch: {
                            x1: activeDragState.initial.x1,
                            y1: activeDragState.initial.y1,
                            x2: activeDragState.initial.x2,
                            y2: activeDragState.initial.y2,
                            preserveAspectRatio: activeDragState.initial.preserveAspectRatio,
                            opacity: activeDragState.initial.opacity,
                        },
                    });
                }

                pointerCtrlKeyRef.current = false;
                stopActiveDrag();
            };

            const controller = new AbortController();
            window.addEventListener("keydown", onKeyDown, { signal: controller.signal });
            return () => controller.abort();
        },
        [doUpdateImage, dragState?.pointerId, setPathValue, setSelectedCommandIndices, stopActiveDrag]);

    function onTouchStart(event: TouchEvent<SVGSVGElement>) {
        if (imageEditMode || canvasPreview) return;
        if (event.target !== event.currentTarget) return;
        if (!rootSvgElement) return;

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
            const p1 = eventToSvgPoint(rootSvgElement, first.clientX, first.clientY, viewPort);
            const p2 = eventToSvgPoint(rootSvgElement, second.clientX, second.clientY, viewPort);
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
        if (!rootSvgElement || !touchGestureRef.current) return;
        if (event.touches.length === 0) return;
        event.preventDefault();

        if (event.touches.length === 2) {
            const p1 = eventToSvgPoint(rootSvgElement, event.touches[0].clientX, event.touches[0].clientY, viewPort);
            const p2 = eventToSvgPoint(rootSvgElement, event.touches[1].clientX, event.touches[1].clientY, viewPort);
            if (!p1 || !p2) return;
            const center = midpoint(p1, p2);
            const distance = distanceBetween(p1, p2);
            const previous = touchGestureRef.current;
            if (previous.mode === "pinch" && previous.lastDistance > 0 && distance > 0) {
                const scale = previous.lastDistance / distance;
                doZoomViewPort({ scale, center });
                applyViewPortPan(previous.lastCenter.x - center.x, previous.lastCenter.y - center.y);
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
            if (previous.mode === "pan" && rootSvgElement) {
                const rect = rootSvgElement.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                const dxPx = touch.clientX - previous.lastClientX;
                const dyPx = touch.clientY - previous.lastClientY;
                const dx = -(dxPx / rect.width) * vw;
                const dy = -(dyPx / rect.height) * vh;
                applyViewPortPan(dx, dy);
            }
            touchGestureRef.current = {
                mode: "pan",
                lastClientX: touch.clientX,
                lastClientY: touch.clientY,
            };
        }
    }

    function onTouchEnd(event: TouchEvent<SVGSVGElement>) {
        if (!rootSvgElement) {
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
            const p1 = eventToSvgPoint(rootSvgElement, event.touches[0].clientX, event.touches[0].clientY, viewPort);
            const p2 = eventToSvgPoint(rootSvgElement, event.touches[1].clientX, event.touches[1].clientY, viewPort);
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

    function startCanvasPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
        if (event.pointerType === "touch") return;
        if (event.button !== 0 || imageEditMode || canvasPreview) return;

        const marqueeSelectionMode = getMarqueeSelectionMode(event);
        if (marqueeSelectionMode) {
            const start = eventToSvgPoint(rootSvgElement, event.clientX, event.clientY, viewPort);
            if (!start) return;

            doBeginMarqueeDrag({
                pointerId: event.pointerId,
                start,
                clientX: event.clientX,
                clientY: event.clientY,
                selectionMode: marqueeSelectionMode,
                initialSelection: selectedCommandIndices,
            });
            return;
        }

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
        startCanvasPointerDown,
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

function clientDeltaToSvgDelta(svg: SVGSVGElement | null, dxPx: number, dyPx: number, viewBox: ViewBox): Point | null {
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
        x: (dxPx / rect.width) * viewBox[2],
        y: (dyPx / rect.height) * viewBox[3],
    };
}

function supportsEdgeAutoPan(mode: DragState["mode"]): boolean {
    return mode === "point" || mode === "selection" || mode === "image";
}

function getEdgeAutoPanDirection(rect: DOMRect, clientX: number, clientY: number, activationZonePx: number): EdgeAutoPanDirection | null {
    const x: EdgeAutoPanDirection["x"] = clientX <= rect.left + activationZonePx
        ? -1
        : clientX >= rect.right - activationZonePx
            ? 1
            : 0;
    const y: EdgeAutoPanDirection["y"] = clientY <= rect.top + activationZonePx
        ? -1
        : clientY >= rect.bottom - activationZonePx
            ? 1
            : 0;

    if (x === 0 && y === 0) return null;
    return { x, y };
}

function isValidViewBox(viewBox: unknown): viewBox is ViewBox {
    return Array.isArray(viewBox)
        && viewBox.length === 4
        && viewBox.every((value) => Number.isFinite(value))
        && viewBox[2] > 0
        && viewBox[3] > 0;
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
