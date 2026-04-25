import { useEffect, useMemo, useRef, useState } from "react";
import { type SizeWH } from "@/svg-core/9-types-svg-model";

const FALLBACK_VIEWPORT_PIXELS = 160;

export function usePreviewUnitsPerPixel(viewBoxWidth: number, viewBoxHeight: number) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [viewportSize, setViewportSize] = useState<SizeWH | null>(null);

    useEffect(
        () => {
            const svg = svgRef.current;
            if (!svg) {
                setViewportSize(null);
                return;
            }

            const updateSize = () => {
                const rect = svg.getBoundingClientRect();
                setViewportSize({ width: rect.width, height: rect.height });
            };

            updateSize();
            const observer = new ResizeObserver(() => updateSize());
            observer.observe(svg);
            return () => observer.disconnect();
        },
        []);

    const unitsPerPixel = useMemo(
        () => getSvgUnitsPerPixel(viewBoxWidth, viewBoxHeight, viewportSize),
        [viewBoxWidth, viewBoxHeight, viewportSize]
    );

    return { svgRef, unitsPerPixel };
}

function getSvgUnitsPerPixel(width: number, height: number, viewPortSize: SizeWH | null): number {
    if (!viewPortSize || viewPortSize.width <= 0 || viewPortSize.height <= 0) {
        return Math.max(width, height) / FALLBACK_VIEWPORT_PIXELS;
    }

    return Math.max(width / viewPortSize.width, height / viewPortSize.height);
}
