import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { isImageEditModeAtom } from "@/store/0-atoms/2-8-images";

import { CanvasMainPathOverlay } from "./2-main-path";
import { CtrlPts } from "./3-2-control-points-and-lines";
import { PathPtToCtrlPtLines } from "./3-3-path-to-ctrl-points";
import { CanvasHoveredSegmentOverlay, CanvasSegmentHitAreas, CanvasSelectedSegmentOverlay } from "./5-canvas-segment-overlays";
import { PathPts } from "./3-1-path-points";
import { PathCanvasImageEditOverlays } from "./6-images";
import { CanvasViewBoxFrame } from "./7-viewbox-frame";
import { CanvasSelectionMarquee } from "../../../ui/loacal-ui/3-selection-marquee";

export function CanvasAllOverlays() {
    const { showHelpers, canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);
    const imageEditMode = useAtomValue(isImageEditModeAtom);

    return (<>
        <CanvasMainPathOverlay />

        {!canvasPreview && showViewBoxFrame && <CanvasViewBoxFrame />}

        {!canvasPreview &&
            (<>
                <CanvasSegmentHitAreas />
                <CanvasHoveredSegmentOverlay />
                <CanvasSelectedSegmentOverlay />

                {!imageEditMode && showHelpers && (
                    <>
                        <PathPtToCtrlPtLines />
                        <CtrlPts />
                        <PathPts />
                    </>
                )}

                <CanvasSelectionMarquee />
            </>)
        }

        <PathCanvasImageEditOverlays />
    </>);
}
