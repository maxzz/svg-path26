import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { isImageEditModeAtom } from "@/store/0-atoms/2-8-images";

import { CanvasMainPathOverlay } from "./2-main-path";
import { CtrlPts } from "./3-2-ctrl-points";
import { CtrlPtToPathPtLines } from "./3-3-ctrl-to-path-points";
import { SegmentHoveredOverlay, SegmentHitAreas, SegmentSelectedOverlay } from "./5-segment-selected-hover-hit";
import { PathPts } from "./3-1-path-points";
import { PathImageEditOverlays } from "./6-images";
import { CanvasViewBoxFrame } from "./7-viewbox-frame";
import { CanvasSelectionMarquee } from "../../../ui/local-ui/3-selection-marquee";

export function CanvasAllOverlays() {
    const { showHelpers, canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);
    const imageEditMode = useAtomValue(isImageEditModeAtom);

    return (<>
        <CanvasMainPathOverlay />

        {!canvasPreview && showViewBoxFrame && <CanvasViewBoxFrame />}

        {!canvasPreview &&
            (<>
                <SegmentHitAreas />
                <SegmentHoveredOverlay />
                <SegmentSelectedOverlay />

                {!imageEditMode && showHelpers && (
                    <>
                        <CtrlPtToPathPtLines />
                        <CtrlPts />
                        <PathPts />
                    </>
                )}

                <CanvasSelectionMarquee />
            </>)
        }

        <PathImageEditOverlays />
    </>);
}
