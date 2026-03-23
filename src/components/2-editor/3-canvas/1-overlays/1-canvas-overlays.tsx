import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";

import { CanvasMainPathOverlay } from "./2-main-path";
import { CanvasControlLines, CanvasControlPoints } from "./3-control-points-and-lines";
import { CanvasHoveredSegmentOverlay, CanvasSegmentHitAreas, CanvasSelectedSegmentOverlay } from "./4-canvas-segment-overlays";
import { CanvasTargetPoints } from "./5-target-points";
import { PathCanvasImageEditOverlays } from "./6-images";
import { CanvasViewBoxFrame } from "./7-viewbox-frame";
import { CanvasSelectionMarquee } from "../../../ui/loacal-ui/3-selection-marquee";

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

            {!imageEditMode && showHelpers && (
                <>
                    <CanvasControlLines />
                    <CanvasControlPoints />
                    <CanvasTargetPoints />
                </>
            )}

            <CanvasSelectionMarquee />
        </>)}

        <PathCanvasImageEditOverlays />
    </>);
}
