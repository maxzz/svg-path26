import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { canvasStrokeWidthAtom, hoveredSegmentStrokeWidthAtom, selectedSegmentStrokeWidthAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { doRegisterCanvasSegmentHitAreaAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, hoveredStandaloneSegmentPathAtom, selectedStandaloneSegmentPathsAtom } from "@/store/0-atoms/2-2-editor-actions";
import { getCommandSelectionMode } from "@/store/0-atoms/2-2-editor-selection-utils";
import { standaloneSegmentPathsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { getSegmentActiveStroke, getSegmentHoverStroke } from "./8-canvas-color-palette";

export function CanvasSegmentHitAreas() {
    const segmentPaths = useAtomValue(standaloneSegmentPathsAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const doRegisterSegmentHitArea = useSetAtom(doRegisterCanvasSegmentHitAreaAtom);
    const doSelectCommand = useSetAtom(doSelectCommandAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);

    return segmentPaths.map(
        (segmentPath, index) => {
            if (!segmentPath) return null;

            return (
                <path
                    key={`segment-hit:${index}`}
                    ref={(element) => {
                        doRegisterSegmentHitArea({ index, element });
                    }}
                    d={segmentPath}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(canvasStrokeWidth * 10, canvasStrokeWidth * 4)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onPointerDown={(event) => {
                        event.stopPropagation();
                        doSelectCommand({ index, mode: getCommandSelectionMode(event) });
                        setHoveredCommandIndex(index);
                        setHoveredCanvasPoint(null);
                    }}
                    onMouseEnter={() => {
                        setHoveredCommandIndex(index);
                        setHoveredCanvasPoint(null);
                    }}
                    onMouseLeave={() => {
                        setHoveredCommandIndex(null);
                    }}
                    data-selection-hit="true"
                />
            );
        }
    );
}

export function CanvasHoveredSegmentOverlay() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const hoveredSegmentStrokeWidth = useAtomValue(hoveredSegmentStrokeWidthAtom);
    if (!hoveredSegmentPath) return null;

    return (
        <path
            fill="none"
            stroke={getSegmentHoverStroke(darkCanvas)}
            strokeWidth={hoveredSegmentStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={hoveredSegmentPath}
            pointerEvents="none"
        />
    );
}

export function CanvasSelectedSegmentOverlay() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const selectedSegmentPaths = useAtomValue(selectedStandaloneSegmentPathsAtom);
    const selectedSegmentStrokeWidth = useAtomValue(selectedSegmentStrokeWidthAtom);
    if (!selectedSegmentPaths.length) return null;

    return selectedSegmentPaths.map(
        (selectedSegmentPath, index) => (
            <path
                key={`selected-segment:${index}:${selectedSegmentPath}`}
                fill="none"
                stroke={getSegmentActiveStroke(darkCanvas)}
                strokeWidth={selectedSegmentStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                d={selectedSegmentPath}
                pointerEvents="none"
            />
        )
    );
}