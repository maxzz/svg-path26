export const DARK_CANVAS_COLORS = {
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

export const LIGHT_CANVAS_COLORS = {
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

export function getCanvasColors(darkCanvas: boolean) {
    return darkCanvas ? DARK_CANVAS_COLORS : LIGHT_CANVAS_COLORS;
}

export function getEditorStroke(darkCanvas: boolean): string {
    return getCanvasColors(darkCanvas).editorStroke;
}

export function getControlHaloFill(selected: boolean, darkCanvas: boolean): string {
    const colors = getCanvasColors(darkCanvas);
    return selected ? colors.controlActive : colors.controlHover;
}

export function getControlLineStroke(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    const colors = getCanvasColors(darkCanvas);
    if (selected) return colors.handleActive;
    if (hovered) return colors.handleHover;
    return colors.handleIdle;
}

export function getControlPointFill(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    const colors = getCanvasColors(darkCanvas);
    if (selected) return colors.segmentActive;
    if (hovered) return colors.segmentHover;
    return colors.controlPointIdle;
}

export function getTargetPointFill(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    const colors = getCanvasColors(darkCanvas);
    if (selected) return colors.segmentActive;
    if (hovered) return colors.segmentHover;
    return colors.targetPointIdle;
}

export function getTargetPointStroke(selected: boolean, darkCanvas: boolean): string {
    if (!selected) return "transparent";
    return getCanvasColors(darkCanvas).targetPointStroke;
}