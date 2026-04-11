import { useAtomValue } from "jotai";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";

// Viewbox Frame Overlay

export function CanvasViewBoxFrame() {
    const viewBox = useAtomValue(pathViewBoxAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return (
        <rect
            x={viewBox[0]}
            y={viewBox[1]}
            width={viewBox[2]}
            height={viewBox[3]}
            className="fill-none stroke-[#121212b8] dark:stroke-[#ffffffb8]"
            strokeWidth={Math.max(unitsPerPixel * 1.5, unitsPerPixel)}
            strokeDasharray={`${unitsPerPixel * 6} ${unitsPerPixel * 3}`}
            pointerEvents="none"
        />
    );
}
