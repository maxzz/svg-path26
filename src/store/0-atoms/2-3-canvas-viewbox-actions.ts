import { atom, type Atom, type PrimitiveAtom } from "jotai";
import type { SvgPathModel } from "@/svg-core/2-svg-model";
import type { Point } from "@/svg-core/9-types-svg-model";
import {
    svgModelAtom,
    viewPortHeightAtom,
    viewPortLockedAtom,
    viewPortWidthAtom,
    viewPortXAtom,
    viewPortYAtom,
    zoomAtom,
} from "@/store/0-atoms/2-0-svg-model-state";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 16;

type NumberAtom = PrimitiveAtom<number>;
type BooleanAtom = PrimitiveAtom<boolean>;
type SvgModelStateAtom = Atom<{ model: SvgPathModel | null; error: string | null; }>;

export function createCanvasViewBoxAtoms(
    args: {
        viewPortXAtom: NumberAtom;
        viewPortYAtom: NumberAtom;
        viewPortWidthAtom: NumberAtom;
        viewPortHeightAtom: NumberAtom;
        viewPortLockedAtom: BooleanAtom;
        zoomAtom: NumberAtom;
        svgModelAtom: SvgModelStateAtom;
    }
) {
    const canvasViewBoxAtom = atom<[number, number, number, number]>(
        (get) => [
            get(args.viewPortXAtom),
            get(args.viewPortYAtom),
            get(args.viewPortWidthAtom),
            get(args.viewPortHeightAtom),
        ]
    );

    const doSetViewBoxAtom = atom(
        null,
        (_get, set, next: { x: number; y: number; width: number; height: number; }) => {
            if (!Number.isFinite(next.width) || !Number.isFinite(next.height)) return;
            if (next.width <= 0 || next.height <= 0) return;

            set(args.viewPortXAtom, next.x);
            set(args.viewPortYAtom, next.y);
            set(args.viewPortWidthAtom, next.width);
            set(args.viewPortHeightAtom, next.height);
        }
    );

    const doPanViewBoxAtom = atom(
        null,
        (get, set, delta: { dx: number; dy: number; }) => {
            if (get(args.viewPortLockedAtom)) return;
            set(args.viewPortXAtom, get(args.viewPortXAtom) + delta.dx);
            set(args.viewPortYAtom, get(args.viewPortYAtom) + delta.dy);
        }
    );

    const doZoomViewBoxAtom = atom(
        null,
        (get, set, viewBoxArgs: { scale: number; center?: Point; }) => {
            if (get(args.viewPortLockedAtom)) return;
            const scale = viewBoxArgs.scale;
            if (!Number.isFinite(scale) || scale <= 0) return;

            const x = get(args.viewPortXAtom);
            const y = get(args.viewPortYAtom);
            const width = get(args.viewPortWidthAtom);
            const height = get(args.viewPortHeightAtom);
            const center = viewBoxArgs.center ?? { x: x + width / 2, y: y + height / 2 };

            const nextWidth = width * scale;
            const nextHeight = height * scale;
            const nextX = x + (center.x - x) - scale * (center.x - x);
            const nextY = y + (center.y - y) - scale * (center.y - y);

            set(args.viewPortXAtom, nextX);
            set(args.viewPortYAtom, nextY);
            set(args.viewPortWidthAtom, Math.max(1e-3, nextWidth));
            set(args.viewPortHeightAtom, Math.max(1e-3, nextHeight));

            set(args.zoomAtom, clampZoom(get(args.zoomAtom) / scale));
        }
    );

    const doFitViewBoxAtom = atom(
        null,
        (get, set) => {
            if (get(args.viewPortLockedAtom)) return;
            const model = get(args.svgModelAtom).model;
            if (!model) {
                set(args.viewPortXAtom, 0);
                set(args.viewPortYAtom, 0);
                set(args.viewPortWidthAtom, 120);
                set(args.viewPortHeightAtom, 90);
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

            const zoom = clampZoom(get(args.zoomAtom));
            width /= zoom;
            height /= zoom;
            const centerX = (bounds.xmin + bounds.xmax) / 2;
            const centerY = (bounds.ymin + bounds.ymax) / 2;

            set(args.viewPortXAtom, centerX - width / 2);
            set(args.viewPortYAtom, centerY - height / 2);
            set(args.viewPortWidthAtom, width);
            set(args.viewPortHeightAtom, height);
        }
    );

    return {
        canvasViewBoxAtom,
        doSetViewBoxAtom,
        doPanViewBoxAtom,
        doZoomViewBoxAtom,
        doFitViewBoxAtom,
    };
}

const canvasViewBoxActions = createCanvasViewBoxAtoms({
    viewPortXAtom,
    viewPortYAtom,
    viewPortWidthAtom,
    viewPortHeightAtom,
    viewPortLockedAtom,
    zoomAtom,
    svgModelAtom,
});

export const canvasViewBoxAtom = canvasViewBoxActions.canvasViewBoxAtom;
export const doSetViewBoxAtom = canvasViewBoxActions.doSetViewBoxAtom;
export const doPanViewBoxAtom = canvasViewBoxActions.doPanViewBoxAtom;
export const doZoomViewBoxAtom = canvasViewBoxActions.doZoomViewBoxAtom;
export const doFitViewBoxAtom = canvasViewBoxActions.doFitViewBoxAtom;

function clampZoom(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 1;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}
