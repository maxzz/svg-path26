import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { pathViewBoxAtom } from "@/store/0-atoms/2-6-path-viewbox";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { PathCanvasImageEditOverlays } from "../4-canvas-overlays-image";
import { CanvasHoveredSegmentOverlay, CanvasSegmentHitAreas, CanvasSelectedSegmentOverlay } from "./2-canvas-segment-overlays";
import { CanvasControlLines, CanvasControlPoints } from "./3-canvas-control-overlays";
import { CanvasTargetPoints } from "./4-canvas-target-point-overlays";

export function CanvasHelperOverlays() {
    const { showHelpers, canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    const imageEditMode = useAtomValue(isImageEditModeAtom);

    return (<>
        <CanvasMainPathOverlay />

        {!canvasPreview && showViewBoxFrame && <CanvasViewBoxFrame />}

        {!canvasPreview && (<>
            <CanvasSegmentHitAreas />
            <CanvasHoveredSegmentOverlay />
            <CanvasSelectedSegmentOverlay />

            {!imageEditMode && showHelpers && (<>
                <CanvasControlLines />
                <CanvasControlPoints />
                <CanvasTargetPoints />
            </>)}
        </>)}

        <PathCanvasImageEditOverlays />
    </>);
}

// Main Path Overlay

function CanvasMainPathOverlay() {
    const { darkCanvas, canvasPreview, fillPreview } = useSnapshot(appSettings.canvas);

    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);

    return (
        <path
            className={getCanvasPathClasses(canvasPreview, fillPreview, darkCanvas)}
            strokeWidth={canvasStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={parseError || !pathValue ? "M 0 0" : pathValue}
        />
    );
}


function getCanvasPathClasses(canvasPreview: boolean, fillPreview: boolean, darkCanvas: boolean): string {
    return classNames(
        !fillPreview ? "fill-none" : (canvasPreview ? "fill-black/20" : "fill-blue-500/25"),
        canvasPreview ? "stroke-black" : (darkCanvas ? "stroke-white" : "stroke-blue-700")
    );
}

// Viewbox Frame Overlay

function CanvasViewBoxFrame() {
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

//

