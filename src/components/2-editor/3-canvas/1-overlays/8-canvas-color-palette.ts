import { classNames } from "@/utils";

export function getEditorStroke(): string {
    return "stroke-canvas-editor-stroke";
}

export function getControlHaloFill(selected: boolean): string {
    return selected
        ? "fill-canvas-control-active"
        : "fill-canvas-control-hover";
}

export function getControlLineStroke(selected: boolean, hovered: boolean): string {
    if (selected) return "stroke-canvas-handle-active";
    if (hovered) return "stroke-canvas-handle-hover";
    return "stroke-canvas-handle-idle";
}

export function getControlPointFill(selected: boolean, hovered: boolean): string {
    if (selected) return "stroke-canvas-segment-active fill-canvas-segment-active";
    if (hovered) return "stroke-canvas-segment-hover fill-none";
    return "stroke-canvas-control-point-idle fill-none";
}

export function getTargetPointFill(selected: boolean, hovered: boolean): string {
    if (selected) return "stroke-canvas-segment-active fill-canvas-segment-active";
    if (hovered) return "stroke-canvas-segment-hover fill-none";
    return "stroke-canvas-target-point-idle fill-none";
}

export function getTargetPointStroke(selected: boolean): string {
    if (!selected) return "stroke-transparent";
    return "stroke-canvas-target-point-stroke";
}

export function getSegmentActiveStroke(): string {
    return "stroke-canvas-segment-active";
}

export function getSegmentHoverStroke(): string {
    return "stroke-canvas-segment-hover";
}

//

export function getCanvasPathClasses(canvasPreview: boolean, fillPreview: boolean): string {
    return classNames(
        !fillPreview ? "fill-none" : (canvasPreview ? "fill-black/20" : "fill-blue-500/25"),
        canvasPreview ? "stroke-black" : "stroke-blue-700 dark:stroke-white"
    );
}

//

export function getPointInteractionClassName(movable: boolean): string {
    return movable ? "cursor-pointer transition-all" : "cursor-default";
}
