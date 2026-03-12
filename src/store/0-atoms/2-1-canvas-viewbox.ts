import { atom } from "jotai";
import { type Point } from "@/svg-core/9-types-svg-model";
import { createAtomAppSetting } from "@/store/0-atoms/8-create-atom-app-settings";
import { svgModelAtom } from "@/store/0-atoms/2-0-svg-model";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 16;
const DEFAULT_VIEWPORT_X = 0;
const DEFAULT_VIEWPORT_Y = 0;
const DEFAULT_VIEWPORT_WIDTH = 120;
const DEFAULT_VIEWPORT_HEIGHT = 90;

export const zoomAtom = createAtomAppSetting("zoom");
export const viewPortXAtom = atom(DEFAULT_VIEWPORT_X);
export const viewPortYAtom = atom(DEFAULT_VIEWPORT_Y);
export const viewPortWidthAtom = atom(DEFAULT_VIEWPORT_WIDTH);
export const viewPortHeightAtom = atom(DEFAULT_VIEWPORT_HEIGHT);
export const viewPortLockedAtom = createAtomAppSetting("viewPortLocked");

// Canvas view box

export const canvasViewBoxAtom = atom<[number, number, number, number]>(
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
        if (!Number.isFinite(next.width) || !Number.isFinite(next.height)) return;
        if (next.width <= 0 || next.height <= 0) return;

        set(viewPortXAtom, next.x);
        set(viewPortYAtom, next.y);
        set(viewPortWidthAtom, next.width);
        set(viewPortHeightAtom, next.height);
    }
);

// Pan/zoom/fit view box

export const doPanViewBoxAtom = atom(
    null,
    (get, set, delta: { dx: number; dy: number; }) => {
        if (get(viewPortLockedAtom)) return;
        set(viewPortXAtom, get(viewPortXAtom) + delta.dx);
        set(viewPortYAtom, get(viewPortYAtom) + delta.dy);
    }
);

export const doZoomViewBoxAtom = atom(
    null,
    (get, set, viewBoxArgs: { scale: number; center?: Point; }) => {
        if (get(viewPortLockedAtom)) return;
        
        const scale = viewBoxArgs.scale;
        if (!Number.isFinite(scale) || scale <= 0) return;

        const x = get(viewPortXAtom);
        const y = get(viewPortYAtom);
        const width = get(viewPortWidthAtom);
        const height = get(viewPortHeightAtom);
        const center = viewBoxArgs.center ?? { x: x + width / 2, y: y + height / 2 };

        const nextWidth = width * scale;
        const nextHeight = height * scale;
        const nextX = x + (center.x - x) - scale * (center.x - x);
        const nextY = y + (center.y - y) - scale * (center.y - y);

        set(viewPortXAtom, nextX);
        set(viewPortYAtom, nextY);
        set(viewPortWidthAtom, Math.max(1e-3, nextWidth));
        set(viewPortHeightAtom, Math.max(1e-3, nextHeight));

        set(zoomAtom, clampZoom(get(zoomAtom) / scale));
    }
);

export const doFitViewBoxAtom = atom(
    null,
    (get, set) => {
        if (get(viewPortLockedAtom)) return;

        const model = get(svgModelAtom).model;
        if (!model) {
            set(viewPortXAtom, DEFAULT_VIEWPORT_X);
            set(viewPortYAtom, DEFAULT_VIEWPORT_Y);
            set(viewPortWidthAtom, DEFAULT_VIEWPORT_WIDTH);
            set(viewPortHeightAtom, DEFAULT_VIEWPORT_HEIGHT);
            return;
        }

        const bounds = model.getBounds();
        const widthRaw = Math.max(10, bounds.xmax - bounds.xmin);
        const heightRaw = Math.max(10, bounds.ymax - bounds.ymin);
        const padding = Math.max(widthRaw, heightRaw) * 0.12 + 2;

        let width = widthRaw + padding * 2;
        let height = heightRaw + padding * 2;
        const aspect = 4 / 3;
        if (width / height > aspect) {
            height = width / aspect;
        } else {
            width = height * aspect;
        }

        const zoom = clampZoom(get(zoomAtom));
        width /= zoom;
        height /= zoom;
        const centerX = (bounds.xmin + bounds.xmax) / 2;
        const centerY = (bounds.ymin + bounds.ymax) / 2;

        set(viewPortXAtom, centerX - width / 2);
        set(viewPortYAtom, centerY - height / 2);
        set(viewPortWidthAtom, width);
        set(viewPortHeightAtom, height);
    }
);

function clampZoom(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
        return 1;
    }
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}
