import { useEffect } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { type SizeWH } from "@/svg-core/9-types-svg-model";
import { canvasRootSvgElementAtom, rootSvgElementSizeAtom, viewPortHeightAtom, viewPortWidthAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { strokeWidthAtom } from "@/store/0-atoms/2-4-0-editor-actions";

export const canvasUnitsPerPixelAtom = atom(
    (get) => getSvgUnitsPerPixel(get(viewPortWidthAtom), get(viewPortHeightAtom), get(rootSvgElementSizeAtom))
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
    const setRootSvgElementSize = useSetAtom(rootSvgElementSizeAtom);

    useEffect(
        () => {
            if (!rootSvgElement) {
                setRootSvgElementSize(null);
                return;
            }

            const updateSize = () => {
                const rect = rootSvgElement.getBoundingClientRect();
                setRootSvgElementSize({ width: rect.width, height: rect.height });
            };

            updateSize();

            const observer = new ResizeObserver(() => updateSize());
            observer.observe(rootSvgElement);
            return () => observer.disconnect();
        },
        [rootSvgElement]);
}

function getSvgUnitsPerPixel(width: number, height: number, viePortSize: SizeWH | null): number {
    if (!viePortSize || viePortSize.width <= 0 || viePortSize.height <= 0) {
        return Math.max(width, height) / 1000;
    }

    return Math.max(width / viePortSize.width, height / viePortSize.height);
}
