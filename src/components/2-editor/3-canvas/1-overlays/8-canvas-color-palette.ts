import { classNames } from "@/utils";

export function getEditorStroke(): string {
    const rvClasses = "stroke-canvas-editor-stroke";
    return rvClasses;
}

export function getControlHaloFill(selected: boolean): string {
    const rvClasses =
        selected
            ? "fill-canvas-control-active"
            : "fill-canvas-control-hover";
    return rvClasses;
}

export function getControlLineStroke(selected: boolean, hovered: boolean): string {
    const rvClasses =
        selected
            ? "stroke-canvas-handle-active"
            : hovered
                ? "stroke-canvas-handle-hover"
                : "stroke-canvas-handle-idle";
    return rvClasses;
}

export function getControlPointFill(selected: boolean, hovered: boolean): string {
    const rvClasses =
        selected
            ? "stroke-canvas-segment-active fill-canvas-segment-active"
            : hovered
                ? "stroke-canvas-segment-hover fill-none"
                : "stroke-canvas-control-point-idle fill-none";
    return rvClasses;
}

export function getTargetPointFill(selected: boolean, hovered: boolean): string {
    const rvClasses =
        selected
            ? "stroke-canvas-segment-active fill-canvas-segment-active"
            : hovered
                ? "stroke-canvas-segment-hover fill-none"
                : "stroke-canvas-target-point-idle fill-none";
    return rvClasses;
}

export function getTargetPointStroke(selected: boolean): string {
    const rvClasses =
        selected
            ? "stroke-canvas-target-point-stroke"
            : "stroke-transparent";
    return rvClasses;
}

export function getSegmentActiveStroke(): string {
    const rvClasses = "stroke-canvas-segment-active";
    return rvClasses;
}

export function getSegmentHoverStroke(): string {
    const rvClasses = "stroke-canvas-segment-hover";
    return rvClasses;
}

//

export function getCanvasPathFillClasses(canvasPreview: boolean, fillPreview: boolean): string {
    return fillPreview
        ? "fill-none"
        : canvasPreview
            ? "fill-black/20"
            : "fill-blue-500/25";
}

export function getCanvasPathStrokeClasses(canvasPreview: boolean): string {
    return canvasPreview
        ? "stroke-black"
        : "stroke-blue-700 dark:stroke-white";
}

export function getCanvasPathClasses(canvasPreview: boolean, fillPreview: boolean): string {
    return classNames(
        getCanvasPathFillClasses(canvasPreview, fillPreview),
        getCanvasPathStrokeClasses(canvasPreview)
    );
}

export function getCanvasSubPathStrokeClasses(canvasPreview: boolean, muted: boolean): string {
    return classNames(
        getCanvasPathStrokeClasses(canvasPreview),
        muted && "opacity-40"
    );
}

//

export function getPointInteractionClassName(movable: boolean): string {
    const rvClasses =
        movable
            ? "cursor-pointer transition-all"
            : "cursor-default";
    return rvClasses;
}
