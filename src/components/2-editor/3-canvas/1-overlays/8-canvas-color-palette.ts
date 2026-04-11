import { classNames } from "@/utils";

const DARK_THEME_CANVAS_COLORS = {
    segmentActive: "#009cff",
    segmentHover: "#ff4343",
    editorStroke: "#9c00ff63",
    controlActive: "#9c00ffa0",
    controlHover: "#ffad40",
    handleActive: "#9c00ffa0",
    handleHover: "#ffad40",
    handleIdle: "#ffffff54",
    controlPointIdle: "#ffffff",
    targetPointIdle: "#ffffff",
    targetPointStroke: "#ffffff38",
} as const;

const LIGHT_THEME_CANVAS_COLORS = {
    segmentActive: "#009cff",
    segmentHover: "#ff4343",
    editorStroke: "#7c3aed3d",
    controlActive: "#7c3aed38",
    controlHover: "#d977063d",
    handleActive: "#7c3aed",
    handleHover: "#d97706",
    handleIdle: "#64748bad",
    controlPointIdle: "#64748b",
    targetPointIdle: "#334155",
    targetPointStroke: "#0f172a29",
} as const;

export function getCanvasColors(isDarkTheme: boolean) {
    return isDarkTheme ? DARK_THEME_CANVAS_COLORS : LIGHT_THEME_CANVAS_COLORS;
}

export function getEditorStroke(isDarkTheme: boolean): string {
    return getCanvasColors(isDarkTheme).editorStroke;
}

export function getControlHaloFill(selected: boolean, isDarkTheme: boolean): string {
    const colors = getCanvasColors(isDarkTheme);
    return selected ? colors.controlActive : colors.controlHover;
}

export function getControlLineStroke(selected: boolean, hovered: boolean, isDarkTheme: boolean): string {
    const colors = getCanvasColors(isDarkTheme);
    if (selected) return colors.handleActive;
    if (hovered) return colors.handleHover;
    return colors.handleIdle;
}

export function getControlPointFill(selected: boolean, hovered: boolean, isDarkTheme: boolean): string {
    const colors = getCanvasColors(isDarkTheme);
    if (selected) return colors.segmentActive;
    if (hovered) return colors.segmentHover;
    return colors.controlPointIdle;
}

export function getTargetPointFill(selected: boolean, hovered: boolean, isDarkTheme: boolean): string {
    const colors = getCanvasColors(isDarkTheme);
    if (selected) return colors.segmentActive;
    if (hovered) return colors.segmentHover;
    return colors.targetPointIdle;
}

export function getTargetPointStroke(selected: boolean, isDarkTheme: boolean): string {
    if (!selected) return "transparent";
    return getCanvasColors(isDarkTheme).targetPointStroke;
}

export function getSegmentActiveStroke(isDarkTheme: boolean): string {
    return getCanvasColors(isDarkTheme).segmentActive;
}

export function getSegmentHoverStroke(isDarkTheme: boolean): string {
    return getCanvasColors(isDarkTheme).segmentHover;
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
