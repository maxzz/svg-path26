import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";

// Viewbox Frame Overlay

export function CanvasViewBoxFrame() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const viewBox = useAtomValue(pathViewBoxAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return (
        <rect
            x={viewBox[0]}
            y={viewBox[1]}
            width={viewBox[2]}
            height={viewBox[3]}
            fill="none"
            stroke={darkCanvas ? "rgba(255,255,255,0.72)" : "rgba(18,18,18,0.72)"}
            strokeDasharray={`${unitsPerPixel * 6} ${unitsPerPixel * 3}`}
            strokeWidth={Math.max(unitsPerPixel * 1.5, unitsPerPixel)}
            pointerEvents="none"
        />
    );
}
