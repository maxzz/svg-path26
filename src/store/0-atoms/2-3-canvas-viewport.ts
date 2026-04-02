import { atom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { type Point, type SizeWH, type ViewBox } from "@/svg-core/9-types-svg-model";
import { svgModelAtom } from "@/store/0-atoms/2-0-svg-model";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { eventToSvgPoint } from "@/components/2-editor/3-canvas/3-canvas-drag";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 16;
const DEFAULT_VIEWPORT_X = 0;
const DEFAULT_VIEWPORT_Y = 0;
const DEFAULT_VIEWPORT_WIDTH = 120;
const DEFAULT_VIEWPORT_HEIGHT = 90;

export const rootSvgElementSizeAtom = atom<SizeWH | null>(null);
export const canvasRootSvgElementAtom = atom<SVGSVGElement | null>(null);

export const viewPortXAtom = atom(DEFAULT_VIEWPORT_X);
export const viewPortYAtom = atom(DEFAULT_VIEWPORT_Y);
export const viewPortWidthAtom = atom(DEFAULT_VIEWPORT_WIDTH);
export const viewPortHeightAtom = atom(DEFAULT_VIEWPORT_HEIGHT);

// Get/Set the current view box of the canvas

export const canvasViewPortAtom = atom<ViewBox>(
    (get) => [
        get(viewPortXAtom),
        get(viewPortYAtom),
        get(viewPortWidthAtom),
        get(viewPortHeightAtom),
    ]
);

export const doSetViewPortAtom = atom(
    null,
    (_get, set, next: ViewBox) => {
        const [x, y, width, height] = next;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (!Number.isFinite(width) || !Number.isFinite(height)) return;
        if (width <= 0 || height <= 0) return;

        set(viewPortXAtom, x);
        set(viewPortYAtom, y);
        set(viewPortWidthAtom, Math.max(1e-3, width));
        set(viewPortHeightAtom, Math.max(1e-3, height));
    }
);

// Pan/zoom/fit view box

export const doPanViewPortAtom = atom(
    null,
    (get, set, delta: { dx: number; dy: number; }) => {
        if (appSettings.pathEditor.viewPortLocked) return;
        set(viewPortXAtom, get(viewPortXAtom) + delta.dx);
        set(viewPortYAtom, get(viewPortYAtom) + delta.dy);
    }
);

export const doZoomViewPortAtom = atom(
    null,
    (get, set, viewBoxArgs: { scale: number; center?: Point; }) => {
        if (appSettings.pathEditor.viewPortLocked) return;

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

        appSettings.pathEditor.zoom = clampZoom(appSettings.pathEditor.zoom / scale);
    }
);

export const doFitViewPortAtom = atom(
    null,
    (get, set) => {
        if (appSettings.pathEditor.viewPortLocked) return;

        const model = get(svgModelAtom).model;
        if (!model) {
            appSettings.pathEditor.zoom = 1;
            set(doSetViewPortAtom, getDefaultViewPort());
            return;
        }

        const bounds = model.getBounds();
        const widthRaw = Math.max(10, bounds.xmax - bounds.xmin);
        const heightRaw = Math.max(10, bounds.ymax - bounds.ymin);
        const padding = Math.max(widthRaw, heightRaw) * 0.12 + 2;
        const frame: ViewBox = [
            bounds.xmin - padding,
            bounds.ymin - padding,
            widthRaw + padding * 2,
            heightRaw + padding * 2,
        ];

        appSettings.pathEditor.zoom = 1;
        set(doSetViewPortAtom, fitFrameToCanvasAspect(frame, get(rootSvgElementSizeAtom)));
    }
);

export const doFitViewPortToPathViewBoxAtom = atom(
    null,
    (get, set) => {
        if (appSettings.pathEditor.viewPortLocked) return;

        appSettings.pathEditor.zoom = 1;
        set(doSetViewPortAtom, fitFrameToCanvasAspect(get(pathViewBoxAtom), get(rootSvgElementSizeAtom)));
    }
);

export const doAdjustViewPortToAspectAtom = atom(
    null,
    (get, set) => {
        const rootSvgElementSize = get(rootSvgElementSizeAtom);
        if (!rootSvgElementSize || rootSvgElementSize.width <= 0 || rootSvgElementSize.height <= 0) return;

        const aspect = rootSvgElementSize.width / rootSvgElementSize.height;
        const oldWidth = get(viewPortWidthAtom);
        const oldHeight = get(viewPortHeightAtom);
        const oldCenterX = get(viewPortXAtom) + oldWidth / 2;
        const oldCenterY = get(viewPortYAtom) + oldHeight / 2;

        let width = oldWidth;
        let height = oldHeight;
        if (width / height > aspect) {
            height = width / aspect;
        } else {
            width = height * aspect;
        }

        set(viewPortXAtom, oldCenterX - width / 2);
        set(viewPortYAtom, oldCenterY - height / 2);
        set(viewPortWidthAtom, width);
        set(viewPortHeightAtom, height);
    }
);

export const doWheelZoomViewPortAtom = atom(
    null,
    (get, set, event: WheelEvent) => {
        event.preventDefault();
        const rootSvgElement = get(canvasRootSvgElementAtom);
        if (!rootSvgElement) return;

        const viewPort = get(canvasViewPortAtom);
        const center = eventToSvgPoint(rootSvgElement, event.clientX, event.clientY, viewPort);
        if (!center) return;

        const scale = Math.pow(1.005, event.deltaY);
        set(doZoomViewPortAtom, { scale, center });
    }
);

function clampZoom(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
        return 1;
    }
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getDefaultViewPort(): ViewBox {
    return [DEFAULT_VIEWPORT_X, DEFAULT_VIEWPORT_Y, DEFAULT_VIEWPORT_WIDTH, DEFAULT_VIEWPORT_HEIGHT];
}

function fitFrameToCanvasAspect(frame: ViewBox, rootSvgElementSize: SizeWH | null): ViewBox {
    const centerX = frame[0] + frame[2] / 2;
    const centerY = frame[1] + frame[3] / 2;
    let width = Math.max(1e-3, frame[2]);
    let height = Math.max(1e-3, frame[3]);
    const aspect = (rootSvgElementSize && rootSvgElementSize.width > 0 && rootSvgElementSize.height > 0)
        ? rootSvgElementSize.width / rootSvgElementSize.height
        : 4 / 3;

    if (width / height > aspect) {
        height = width / aspect;
    } else {
        width = height * aspect;
    }

    return [
        centerX - width / 2,
        centerY - height / 2,
        width,
        height,
    ];
}
