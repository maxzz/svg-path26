import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";

// Viewbox Frame Overlay

export function CanvasViewBoxFrame() {
    const viewBox = useAtomValue(pathViewBoxAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const { darkCanvas } = useSnapshot(appSettings.canvas);

    return (
        <rect
            x={viewBox[0]}
            y={viewBox[1]}
            width={viewBox[2]}
            height={viewBox[3]}
            strokeWidth={Math.max(unitsPerPixel * 1.5, unitsPerPixel)}
            strokeDasharray={`${unitsPerPixel * 6} ${unitsPerPixel * 3}`}
            stroke={darkCanvas ? "rgba(255,255,255,0.72)" : "rgba(18,18,18,0.72)"}
            fill="none"
            pointerEvents="none"
        />
    );
}
