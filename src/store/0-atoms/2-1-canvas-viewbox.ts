import { atom } from "jotai";
import { type Point } from "@/svg-core/9-types-svg-model";
import { svgModelAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { createAtomAppSetting } from "./8-create-atom-app-settings";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 16;
const DEFAULT_VIEWPORT_X = appSettings.pathEditor.viewBox.x;
const DEFAULT_VIEWPORT_Y = appSettings.pathEditor.viewBox.y;
const DEFAULT_VIEWPORT_WIDTH = appSettings.pathEditor.viewBox.width;
const DEFAULT_VIEWPORT_HEIGHT = appSettings.pathEditor.viewBox.height;

export const canvasViewportSizeAtom = atom<{ width: number; height: number; } | null>(null);

const storedViewBoxAtom = createAtomAppSetting("viewBox");

export const viewPortXAtom = atom(
    (get) => get(storedViewBoxAtom).x,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.x) : nextValue;
        if (!Number.isFinite(next)) return;
        set(storedViewBoxAtom, { ...current, x: next });
    }
);

export const viewPortYAtom = atom(
    (get) => get(storedViewBoxAtom).y,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.y) : nextValue;
        if (!Number.isFinite(next)) return;
        set(storedViewBoxAtom, { ...current, y: next });
    }
);

export const viewPortWidthAtom = atom(
    (get) => get(storedViewBoxAtom).width,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.width) : nextValue;
        if (!Number.isFinite(next) || next <= 0) return;
        set(storedViewBoxAtom, { ...current, width: Math.max(1e-3, next) });
    }
);

export const viewPortHeightAtom = atom(
    (get) => get(storedViewBoxAtom).height,
    (get, set, nextValue: SetStateAction<number>) => {
        const current = get(storedViewBoxAtom);
        const next = typeof nextValue === "function" ? nextValue(current.height) : nextValue;
        if (!Number.isFinite(next) || next <= 0) return;
        set(storedViewBoxAtom, { ...current, height: Math.max(1e-3, next) });
    }
);

// Canvas view box

export type ViewBox = [number, number, number, number];

export const canvasViewBoxAtom = atom<ViewBox>(
    (get) => [
        get(viewPortXAtom),
        get(viewPortYAtom),
        get(viewPortWidthAtom),
        get(viewPortHeightAtom),
    ]
);

export const doSetViewBoxAtom = atom(
    null,
    (_get, set, next: { x: number; y: number; width: number; height: number; }) => {
        if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return;
        if (!Number.isFinite(next.width) || !Number.isFinite(next.height)) return;
        if (next.width <= 0 || next.height <= 0) return;

        set(storedViewBoxAtom, {
            x: next.x,
            y: next.y,
            width: Math.max(1e-3, next.width),
            height: Math.max(1e-3, next.height),
        });
    }
);

// Pan/zoom/fit view box

export const doPanViewBoxAtom = atom(
    null,
    (get, set, delta: { dx: number; dy: number; }) => {
        if (appSettings.pathEditor.viewPortLocked) return;
        const current = get(storedViewBoxAtom);
        set(storedViewBoxAtom, {
            ...current,
            x: current.x + delta.dx,
            y: current.y + delta.dy,
        });
    }
);

export const doZoomViewBoxAtom = atom(
    null,
    (get, set, viewBoxArgs: { scale: number; center?: Point; }) => {
        if (appSettings.pathEditor.viewPortLocked) return;
        
        const scale = viewBoxArgs.scale;
        if (!Number.isFinite(scale) || scale <= 0) return;

        const current = get(storedViewBoxAtom);
        const { x, y, width, height } = current;
        const center = viewBoxArgs.center ?? { x: x + width / 2, y: y + height / 2 };

        const nextWidth = width * scale;
        const nextHeight = height * scale;
        const nextX = x + (center.x - x) - scale * (center.x - x);
        const nextY = y + (center.y - y) - scale * (center.y - y);

        set(storedViewBoxAtom, {
            x: nextX,
            y: nextY,
            width: Math.max(1e-3, nextWidth),
            height: Math.max(1e-3, nextHeight),
        });

        appSettings.pathEditor.zoom = clampZoom(appSettings.pathEditor.zoom / scale);
    }
);

export const doFitViewBoxAtom = atom(
    null,
    (get, set) => {
        if (appSettings.pathEditor.viewPortLocked) return;

        const model = get(svgModelAtom).model;
        if (!model) {
            set(storedViewBoxAtom, {
                x: DEFAULT_VIEWPORT_X,
                y: DEFAULT_VIEWPORT_Y,
                width: DEFAULT_VIEWPORT_WIDTH,
                height: DEFAULT_VIEWPORT_HEIGHT,
            });
            return;
        }

        const bounds = model.getBounds();
        const widthRaw = Math.max(10, bounds.xmax - bounds.xmin);
        const heightRaw = Math.max(10, bounds.ymax - bounds.ymin);
        const padding = Math.max(widthRaw, heightRaw) * 0.12 + 2;

        let width = widthRaw + padding * 2;
        let height = heightRaw + padding * 2;
        const viewport = get(canvasViewportSizeAtom);
        const aspect = (viewport && viewport.width > 0 && viewport.height > 0)
            ? viewport.width / viewport.height
            : 4 / 3;
        if (width / height > aspect) {
            height = width / aspect;
        } else {
            width = height * aspect;
        }

        const zoom = clampZoom(appSettings.pathEditor.zoom);
        width /= zoom;
        height /= zoom;
        const centerX = (bounds.xmin + bounds.xmax) / 2;
        const centerY = (bounds.ymin + bounds.ymax) / 2;

        set(storedViewBoxAtom, {
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
        });
    }
);

export const doAdjustViewBoxToAspectAtom = atom(
    null,
    (get, set) => {
        const viewport = get(canvasViewportSizeAtom);
        if (!viewport || viewport.width <= 0 || viewport.height <= 0) return;

        const aspect = viewport.width / viewport.height;
        const current = get(storedViewBoxAtom);
        const oldWidth = current.width;
        const oldHeight = current.height;
        const oldCenterX = current.x + oldWidth / 2;
        const oldCenterY = current.y + oldHeight / 2;

        let width = oldWidth;
        let height = oldHeight;
        if (width / height > aspect) {
            height = width / aspect;
        } else {
            width = height * aspect;
        }

        set(storedViewBoxAtom, {
            x: oldCenterX - width / 2,
            y: oldCenterY - height / 2,
            width,
            height,
        });
    }
);

function clampZoom(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
        return 1;
    }
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}
