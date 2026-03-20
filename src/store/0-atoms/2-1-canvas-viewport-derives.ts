import { useEffect } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { strokeWidthAtom } from "@/store/0-atoms/2-2-editor-actions";
import { type SvgViewportSize, canvasViewPortAtom, canvasViewportSizeAtom } from "@/store/0-atoms/2-1-canvas-viewport";

export const canvasRootSvgElementAtom = atom<SVGSVGElement | null>(null);

export const canvasUnitsPerPixelAtom = atom(
    (get) => getSvgUnitsPerPixel(get(canvasViewPortAtom), get(canvasViewportSizeAtom))
);

export const canvasStrokeWidthAtom = atom(
    (get) => get(canvasUnitsPerPixelAtom) * get(strokeWidthAtom)
);

export const hoveredSegmentStrokeWidthAtom = atom(
    (get) => Math.max(get(canvasStrokeWidthAtom) * 1.4, get(canvasUnitsPerPixelAtom) * 0.8)
);

export const selectedSegmentStrokeWidthAtom = atom(
    (get) => Math.max(get(canvasStrokeWidthAtom) * 1.6, get(canvasUnitsPerPixelAtom) * 0.95)
);

export function useSyncCanvasViewportSize() {
    const rootSvgElement = useAtomValue(canvasRootSvgElementAtom);
    const setViewportSize = useSetAtom(canvasViewportSizeAtom);

    useEffect(
        () => {
            if (!rootSvgElement) {
                setViewportSize(null);
                return;
            }

            const updateSize = () => {
                const rect = rootSvgElement.getBoundingClientRect();
                setViewportSize({ width: rect.width, height: rect.height });
            };

            updateSize();

            const observer = new ResizeObserver(() => updateSize());
            observer.observe(rootSvgElement);
            return () => observer.disconnect();
        },
        [setViewportSize, rootSvgElement]);
}

function getSvgUnitsPerPixel(viewBox: ViewBox, viePortSize: SvgViewportSize | null): number {
    const [, , width, height] = viewBox;

    if (!viePortSize || viePortSize.width <= 0 || viePortSize.height <= 0) {
        return Math.max(width, height) / 1000;
    }

    return Math.max(width / viePortSize.width, height / viePortSize.height);
}
