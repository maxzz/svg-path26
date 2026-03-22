export const DARK_SEGMENT_ACTIVE = "#009cff";
export const DARK_SEGMENT_HOVER = "#ff4343";
export const DARK_EDITOR_STROKE = "#9c00ff63";
export const DARK_CONTROL_ACTIVE = "#9c00ffa0";
export const DARK_CONTROL_HOVER = "#ffad40";

export const LIGHT_EDITOR_STROKE = "#7c3aed3d";
export const LIGHT_CONTROL_ACTIVE = "#7c3aed38";
export const LIGHT_CONTROL_HOVER = "#d977063d";
export const LIGHT_HANDLE_ACTIVE = "#7c3aed";
export const LIGHT_HANDLE_HOVER = "#d97706";
export const LIGHT_HANDLE_IDLE = "#64748bad";
export const LIGHT_CONTROL_POINT_IDLE = "#64748b";
export const LIGHT_TARGET_POINT_IDLE = "#334155";
export const LIGHT_TARGET_POINT_STROKE = "#0f172a29";

export function getEditorStroke(darkCanvas: boolean): string {
    return darkCanvas ? DARK_EDITOR_STROKE : LIGHT_EDITOR_STROKE;
}

export function getControlHaloFill(selected: boolean, darkCanvas: boolean): string {
    if (darkCanvas) return selected ? DARK_CONTROL_ACTIVE : DARK_CONTROL_HOVER;
    return selected ? LIGHT_CONTROL_ACTIVE : LIGHT_CONTROL_HOVER;
}

export function getControlLineStroke(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    if (darkCanvas) {
        if (selected) return DARK_CONTROL_ACTIVE;
        if (hovered) return DARK_CONTROL_HOVER;
        return "rgba(255, 255, 255, 0.33)";
    }

    if (selected) return LIGHT_HANDLE_ACTIVE;
    if (hovered) return LIGHT_HANDLE_HOVER;
    return LIGHT_HANDLE_IDLE;
}

export function getControlPointFill(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    if (selected) return DARK_SEGMENT_ACTIVE;
    if (hovered) return DARK_SEGMENT_HOVER;
    return darkCanvas ? "#ffffff" : LIGHT_CONTROL_POINT_IDLE;
}

export function getTargetPointFill(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    if (selected) return DARK_SEGMENT_ACTIVE;
    if (hovered) return DARK_SEGMENT_HOVER;
    return darkCanvas ? "#ffffff" : LIGHT_TARGET_POINT_IDLE;
}

export function getTargetPointStroke(selected: boolean, darkCanvas: boolean): string {
    if (!selected) return "transparent";
    return darkCanvas ? "#ffffff38" : LIGHT_TARGET_POINT_STROKE;
}