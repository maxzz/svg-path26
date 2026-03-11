import { useEffect } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { strokeWidthAtom } from "@/store/0-atoms/2-0-svg-model-state";
import { canvasViewBoxAtom } from "@/store/0-atoms/2-3-canvas-viewbox-actions";

export type SvgViewBox = [number, number, number, number];

type SvgViewportSize = {
    width: number;
    height: number;
};

export const canvasSvgElementAtom = atom<SVGSVGElement | null>(null);
export const canvasViewportSizeAtom = atom<SvgViewportSize | null>(null);

export const canvasUnitsPerPixelAtom = atom(
    (get) => getSvgUnitsPerPixel(get(canvasViewBoxAtom), get(canvasViewportSizeAtom))
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
    const svgElement = useAtomValue(canvasSvgElementAtom);
    const setViewportSize = useSetAtom(canvasViewportSizeAtom);

    useEffect(
        () => {
            if (!svgElement) {
                setViewportSize(null);
                return;
            }

            const updateSize = () => {
                const rect = svgElement.getBoundingClientRect();
                setViewportSize({ width: rect.width, height: rect.height });
            };

            updateSize();

            const observer = new ResizeObserver(() => updateSize());
            observer.observe(svgElement);
            return () => observer.disconnect();
        }, [setViewportSize, svgElement]
    );
}

function getSvgUnitsPerPixel(viewBox: SvgViewBox, size: SvgViewportSize | null): number {
    const [, , width, height] = viewBox;
    
    if (!size || size.width <= 0 || size.height <= 0) {
        return Math.max(width, height) / 1000;
    }
    
    return Math.max(width / size.width, height / size.height);
}
