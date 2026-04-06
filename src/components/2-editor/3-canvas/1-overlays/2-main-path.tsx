import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { getCanvasPathClasses } from "./8-canvas-color-palette";

// Main Path Overlay

export function CanvasMainPathOverlay() {
    const { darkCanvas, canvasPreview, fillPreview } = useSnapshot(appSettings.canvas);

    const svgPathInput = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);

    return (
        <path
            className={getCanvasPathClasses(canvasPreview, fillPreview, darkCanvas)}
            d={parseError || !svgPathInput ? "M 0 0" : svgPathInput}
            strokeWidth={canvasStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
        />
    );
}
