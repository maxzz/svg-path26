import { type Bounds, type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";

export type CommandSelectionMode = "replace" | "add" | "remove";

export function getCommandSelectionMode(event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; }): CommandSelectionMode {
    if (event.ctrlKey || event.metaKey) return "remove";
    if (event.shiftKey) return "add";
    return "replace";
}

export function getMarqueeSelectionMode(event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; }): CommandSelectionMode | null {
    if (!event.shiftKey) return null;
    if (event.ctrlKey || event.metaKey) return "remove";
    return "add";
}

export function normalizeSelectedCommandIndices(indices: Iterable<number>, rowCount?: number): number[] {
    const next: number[] = [];
    const seen = new Set<number>();
    for (const index of indices) {
        if (!Number.isInteger(index)) continue;
        if (rowCount !== undefined && (index < 0 || index >= rowCount)) continue;
        if (seen.has(index)) continue;
        seen.add(index);
        next.push(index);
    }
    return next;
}

export function applyCommandSelection(current: Iterable<number>, nextIndices: Iterable<number>, mode: CommandSelectionMode, rowCount?: number): number[] {
    const currentIndices = normalizeSelectedCommandIndices(current, rowCount);
    const incomingIndices = normalizeSelectedCommandIndices(nextIndices, rowCount);
    if (mode === "replace") return incomingIndices;
    if (mode === "add") return normalizeSelectedCommandIndices([...currentIndices, ...incomingIndices], rowCount);

    const removals = new Set(incomingIndices);
    return currentIndices.filter((index) => !removals.has(index));
}

export function remapSelectedIndicesAfterDelete(current: Iterable<number>, deletedIndices: Iterable<number>, rowCount?: number): number[] {
    const currentIndices = normalizeSelectedCommandIndices(current, rowCount);
    const deleted = normalizeSelectedCommandIndices(deletedIndices).sort((a, b) => a - b);
    const deletedSet = new Set(deleted);

    return currentIndices.flatMap(
        (index) => {
            if (deletedSet.has(index)) return [];
            const shift = deleted.reduce((count, deletedIndex) => count + Number(deletedIndex < index), 0);
            return [index - shift];
        }
    );
}

export function getMarqueeSelectionIndices(args: {
    start: Point;
    current: Point;
    targetPoints: SvgCanvasPoint[];
    controlPoints: SvgCanvasPoint[];
    pathElements: Record<number, SVGPathElement | null>;
}): number[] {
    const selectionBounds = normalizeBounds(args.start, args.current);
    const selected = new Set<number>();

    [...args.targetPoints, ...args.controlPoints].forEach(
        (point) => {
            if (isPointInsideBounds(point, selectionBounds)) {
                selected.add(point.segmentIndex);
            }
        }
    );

    Object.entries(args.pathElements).forEach(
        ([key, element]) => {
            const index = Number.parseInt(key, 10);
            if (!element || !Number.isInteger(index) || selected.has(index)) return;
            if (doesPathIntersectBounds(element, selectionBounds)) {
                selected.add(index);
            }
        }
    );

    return [...selected].sort((a, b) => a - b);
}

function normalizeBounds(a: Point, b: Point): Bounds {
    return {
        xmin: Math.min(a.x, b.x),
        ymin: Math.min(a.y, b.y),
        xmax: Math.max(a.x, b.x),
        ymax: Math.max(a.y, b.y),
    };
}

function isPointInsideBounds(point: Point, bounds: Bounds): boolean {
    return point.x >= bounds.xmin && point.x <= bounds.xmax && point.y >= bounds.ymin && point.y <= bounds.ymax;
}

function doesPathIntersectBounds(element: SVGPathElement, bounds: Bounds): boolean {
    try {
        const box = element.getBBox();
        const pathBounds = {
            xmin: box.x,
            ymin: box.y,
            xmax: box.x + box.width,
            ymax: box.y + box.height,
        };
        if (!doBoundsIntersect(pathBounds, bounds)) return false;

        const length = element.getTotalLength();
        if (!Number.isFinite(length) || length <= 0) {
            return isPointInsideBounds({ x: box.x, y: box.y }, bounds);
        }

        const sampleCount = Math.max(8, Math.ceil(length / 4));
        let previous = element.getPointAtLength(0);
        if (isPointInsideBounds(previous, bounds)) return true;

        for (let i = 1; i <= sampleCount; i += 1) {
            const next = element.getPointAtLength((length * i) / sampleCount);
            if (isPointInsideBounds(next, bounds) || doesLineSegmentIntersectBounds(previous, next, bounds)) {
                return true;
            }
            previous = next;
        }
    } catch {
        return false;
    }

    return false;
}

function doBoundsIntersect(a: Bounds, b: Bounds): boolean {
    return !(a.xmax < b.xmin || a.xmin > b.xmax || a.ymax < b.ymin || a.ymin > b.ymax);
}

function doesLineSegmentIntersectBounds(start: Point, end: Point, bounds: Bounds): boolean {
    if (isPointInsideBounds(start, bounds) || isPointInsideBounds(end, bounds)) return true;

    const topLeft = { x: bounds.xmin, y: bounds.ymin };
    const topRight = { x: bounds.xmax, y: bounds.ymin };
    const bottomRight = { x: bounds.xmax, y: bounds.ymax };
    const bottomLeft = { x: bounds.xmin, y: bounds.ymax };

    return (
        doLineSegmentsIntersect(start, end, topLeft, topRight) ||
        doLineSegmentsIntersect(start, end, topRight, bottomRight) ||
        doLineSegmentsIntersect(start, end, bottomRight, bottomLeft) ||
        doLineSegmentsIntersect(start, end, bottomLeft, topLeft)
    );
}

function doLineSegmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
    const o1 = getOrientation(a, b, c);
    const o2 = getOrientation(a, b, d);
    const o3 = getOrientation(c, d, a);
    const o4 = getOrientation(c, d, b);

    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && isPointOnSegment(c, a, b)) return true;
    if (o2 === 0 && isPointOnSegment(d, a, b)) return true;
    if (o3 === 0 && isPointOnSegment(a, c, d)) return true;
    if (o4 === 0 && isPointOnSegment(b, c, d)) return true;
    return false;
}

function getOrientation(a: Point, b: Point, c: Point): 0 | 1 | 2 {
    const determinant = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
    if (Math.abs(determinant) < 1e-9) {
        return 0;
    }
    return determinant > 0 ? 1 : 2;
}

function isPointOnSegment(point: Point, start: Point, end: Point): boolean {
    return (
        point.x >= Math.min(start.x, end.x) &&
        point.x <= Math.max(start.x, end.x) &&
        point.y >= Math.min(start.y, end.y) &&
        point.y <= Math.max(start.y, end.y)
    );
}
