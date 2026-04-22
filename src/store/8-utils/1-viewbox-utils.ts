import { type ViewBox } from "@/svg-core/9-types-svg-model";

// I/O functions

export function viewBoxToString(viewBox: ViewBox): string {
    return `${viewBox[0]},${viewBox[1]},${viewBox[2]},${viewBox[3]}`;
}

export function parseViewBoxString(viewBox: string, fallback: ViewBox = DEFAULT_VIEWBOX): ViewBox {
    const parsed = viewBox.split(",").map((value) => Number(value));
    if (parsed.length !== 4 || parsed.some((value) => !Number.isFinite(value))) {
        return [fallback[0], fallback[1], fallback[2], fallback[3]];
    }
    return [parsed[0], parsed[1], parsed[2], parsed[3]];
}

export function isViewBoxString(value: string): boolean {
    const parts = value.split(",");
    if (parts.length !== 4) {
        return false;
    }
    return parts.every((part) => Number.isFinite(Number(part)));
}

// Comparison functions

export function areViewBoxesEqual(left: ViewBox, right: ViewBox, epsilon = VIEWBOX_EPS): boolean {
    return left.every(
        (value, index) => Math.abs(value - right[index]) < epsilon
    );
}

// Validation functions

export function sanitizeViewBox(viewBox: ViewBox, minSize = MIN_VIEWBOX_SIZE): ViewBox | null {
    const [x, y, width, height] = viewBox;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        return null;
    }
    if (width <= 0 || height <= 0) {
        return null;
    }
    return [x, y, Math.max(minSize, width), Math.max(minSize, height)];
}

// Constants

const VIEWBOX_EPS = 1e-9;
const MIN_VIEWBOX_SIZE = 1e-3;
const DEFAULT_VIEWBOX: ViewBox = [0, 0, 1, 1];
