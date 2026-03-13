import type { SvgCanvasPoint, SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { SvgPathModel } from "@/svg-core/2-svg-model";

export function isCommandCellLinkedToPoint(
    row: SvgSegmentSummary,
    point: SvgCanvasPoint | null,
): boolean {
    if (!point || point.segmentIndex !== row.index || point.kind !== "control") return false;
    const command = row.command.toUpperCase();
    return (
        (command === "S" && point.controlIndex === 0)
        || (command === "T" && point.controlIndex === 0)
    );
}

export function isCommandValueLinkedToPoint(
    row: SvgSegmentSummary,
    valueIndex: number,
    point: SvgCanvasPoint | null,
): boolean {
    if (!point || point.segmentIndex !== row.index) return false;
    const command = row.command.toUpperCase();

    if (point.kind === "control") {
        if (command === "C") {
            if (point.controlIndex === 0) {
                return valueIndex === 0 || valueIndex === 1;
            }
            return point.controlIndex === 1 && (valueIndex === 2 || valueIndex === 3);
        }
        if (command === "S" && point.controlIndex === 1) {
            return valueIndex === 0 || valueIndex === 1;
        }
        if (command === "Q" && point.controlIndex === 0) {
            return valueIndex === 0 || valueIndex === 1;
        }
        return false;
    }

    if (command === "Z") return false;
    if (command === "H" || command === "V") return valueIndex === 0;
    if (command === "A") return valueIndex === 5 || valueIndex === 6;
    if (row.values.length === 0) return false;
    if (row.values.length === 1) return valueIndex === 0;
    return valueIndex >= row.values.length - 2;
}

export function commandSummaryTooltip(command: string): string {
    const upper = command.toUpperCase();
    const relative = command === command.toLowerCase();
    const modeText = relative ? "Relative coordinates." : "Absolute coordinates.";
    const cells = commandCellNames(command);
    const cellsText = cells.length
        ? `Cells: ${cells.join(", ")}.`
        : "No value cells.";

    switch (upper) {
        case "M":
            return `Move command starts a new subpath at a point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "L":
            return `Line command draws a straight segment to the end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "H":
            return `Horizontal line command changes only X. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "V":
            return `Vertical line command changes only Y. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "C":
            return `Cubic Bezier command with two control points and an end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "S":
            return `Smooth cubic Bezier command; first control is reflected from previous segment. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "Q":
            return `Quadratic Bezier command with one control point and an end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "T":
            return `Smooth quadratic Bezier command; control is reflected from previous segment. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "A":
            return `Arc command draws an elliptical arc to an end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "Z":
            return "Close command draws a straight segment back to the subpath start. No value cells.";
        default:
            return `${command} command. ${modeText} ${cellsText}`;
    }
}

export function commandLabel(type: string): string {
    switch (type) {
        case "M": return "Move";
        case "L": return "Line";
        case "H": return "Horizontal";
        case "V": return "Vertical";
        case "C": return "Cubic";
        case "S": return "Smooth Cubic";
        case "Q": return "Quadratic";
        case "T": return "Smooth Quadratic";
        case "A": return "Arc";
        case "Z": return "Close";
        default: return type;
    }
}

function commandCellNames(command: string): string[] {
    const labels: Record<string, string[]> = {
        M: ["x", "y"],
        m: ["dx", "dy"],
        L: ["x", "y"],
        l: ["dx", "dy"],
        V: ["y"],
        v: ["dy"],
        H: ["x"],
        h: ["dx"],
        C: ["x1", "y1", "x2", "y2", "x", "y"],
        c: ["dx1", "dy1", "dx2", "dy2", "dx", "dy"],
        S: ["x2", "y2", "x", "y"],
        s: ["dx2", "dy2", "dx", "dy"],
        Q: ["x1", "y1", "x", "y"],
        q: ["dx1", "dy1", "dx", "dy"],
        T: ["x", "y"],
        t: ["dx", "dy"],
        A: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
        a: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "dx", "dy"],
    };
    return labels[command] ?? [];
}

export function commandValueTooltip(command: string, valueIndex: number): string {
    const relative = command === command.toLowerCase();
    const upper = command.toUpperCase();
    const xName = relative ? "dx" : "x";
    const yName = relative ? "dy" : "y";
    const xText = relative ? "Horizontal offset from previous point." : "Absolute X coordinate.";
    const yText = relative ? "Vertical offset from previous point." : "Absolute Y coordinate.";

    if (upper === "M" || upper === "L") {
        if (valueIndex === 0) return `${xName}: ${xText}`;
        if (valueIndex === 1) return `${yName}: ${yText}`;
    }
    if (upper === "H") return `${xName}: ${xText}`;
    if (upper === "V") return `${yName}: ${yText}`;
    if (upper === "C") {
        if (valueIndex === 0) return relative ? "dx1: First control point horizontal offset." : "x1: First control point X.";
        if (valueIndex === 1) return relative ? "dy1: First control point vertical offset." : "y1: First control point Y.";
        if (valueIndex === 2) return relative ? "dx2: Second control point horizontal offset." : "x2: Second control point X.";
        if (valueIndex === 3) return relative ? "dy2: Second control point vertical offset." : "y2: Second control point Y.";
        if (valueIndex === 4) return `${xName}: End point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 5) return `${yName}: End point ${relative ? "vertical offset." : "Y."}`;
    }
    if (upper === "S") {
        if (valueIndex === 0) return relative ? "dx2: Second control point horizontal offset." : "x2: Second control point X.";
        if (valueIndex === 1) return relative ? "dy2: Second control point vertical offset." : "y2: Second control point Y.";
        if (valueIndex === 2) return `${xName}: End point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 3) return `${yName}: End point ${relative ? "vertical offset." : "Y."}`;
    }
    if (upper === "Q") {
        if (valueIndex === 0) return relative ? "dx1: Control point horizontal offset." : "x1: Control point X.";
        if (valueIndex === 1) return relative ? "dy1: Control point vertical offset." : "y1: Control point Y.";
        if (valueIndex === 2) return `${xName}: End point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 3) return `${yName}: End point ${relative ? "vertical offset." : "Y."}`;
    }
    if (upper === "T") {
        if (valueIndex === 0) return `${xName}: End point ${relative ? "horizontal offset." : "X."} (control is auto-reflected).`;
        if (valueIndex === 1) return `${yName}: End point ${relative ? "vertical offset." : "Y."} (control is auto-reflected).`;
    }
    if (upper === "A") {
        if (valueIndex === 0) return "rx: Ellipse X radius.";
        if (valueIndex === 1) return "ry: Ellipse Y radius.";
        if (valueIndex === 2) return "x-axis-rotation: Arc ellipse rotation angle in degrees.";
        if (valueIndex === 3) return "large-arc-flag: 0 picks smaller arc, 1 picks larger arc.";
        if (valueIndex === 4) return "sweep-flag: 0 draws negative-angle sweep, 1 draws positive-angle sweep.";
        if (valueIndex === 5) return `${xName}: Arc end point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 6) return `${yName}: Arc end point ${relative ? "vertical offset." : "Y."}`;
    }

    return `${commandCellNames(command)[valueIndex] ?? `value ${valueIndex + 1}`}`;
}

export function computeExportViewBox(
    path: string,
    strokePadding: number,
    fallback: { x: number; y: number; width: number; height: number; },
) {
    try {
        const model = new SvgPathModel(path);
        const bounds = model.getBounds();
        const width = Math.max(1e-6, bounds.xmax - bounds.xmin);
        const height = Math.max(1e-6, bounds.ymax - bounds.ymin);
        const pad = Math.max(0, strokePadding);
        return {
            x: bounds.xmin - pad,
            y: bounds.ymin - pad,
            width: width + 2 * pad,
            height: height + 2 * pad,
        };
    } catch {
        return fallback;
    }
}
