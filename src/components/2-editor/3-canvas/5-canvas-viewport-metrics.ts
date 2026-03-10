import { useEffect, useState, type RefObject } from "react";

export type SvgViewBox = [number, number, number, number];

type SvgViewportSize = {
    width: number;
    height: number;
};

export function getSvgUnitsPerPixel(viewBox: SvgViewBox, size: SvgViewportSize | null): number {
    const [, , width, height] = viewBox;
    if (!size || size.width <= 0 || size.height <= 0) {
        return Math.max(width, height) / 1000;
    }
    return Math.max(width / size.width, height / size.height);
}

export function useSvgUnitsPerPixel(svgRef: RefObject<SVGSVGElement | null>, viewBox: SvgViewBox): number {
    const [size, setSize] = useState<SvgViewportSize | null>(null);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const updateSize = () => {
            const rect = svg.getBoundingClientRect();
            setSize({ width: rect.width, height: rect.height });
        };

        updateSize();

        const observer = new ResizeObserver(() => updateSize());
        observer.observe(svg);
        return () => observer.disconnect();
    }, [svgRef]);

    return getSvgUnitsPerPixel(viewBox, size);
}