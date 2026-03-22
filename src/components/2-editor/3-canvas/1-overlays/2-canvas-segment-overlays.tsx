import { useAtomValue, useSetAtom } from "jotai";
import { canvasStrokeWidthAtom, hoveredSegmentStrokeWidthAtom, selectedSegmentStrokeWidthAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { hoveredCanvasPointAtom, hoveredCommandIndexAtom, hoveredStandaloneSegmentPathAtom, selectedCommandIndexAtom, selectedStandaloneSegmentPathAtom } from "@/store/0-atoms/2-2-editor-actions";
import { standaloneSegmentPathsAtom } from "@/store/0-atoms/2-0-svg-model";

export const DARK_SEGMENT_ACTIVE = "#009cff";
export const DARK_SEGMENT_HOVER = "#ff4343";

export function CanvasSegmentHitAreas() {
    const segmentPaths = useAtomValue(standaloneSegmentPathsAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);

    return segmentPaths.map(
        (segmentPath, index) => {
            if (!segmentPath) return null;

            return (
                <path
                    key={`segment-hit:${index}`}
                    d={segmentPath}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(canvasStrokeWidth * 10, canvasStrokeWidth * 4)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedCommandIndex(index);
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
                />
            );
        }
    );
}

export function CanvasHoveredSegmentOverlay() {
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const hoveredSegmentStrokeWidth = useAtomValue(hoveredSegmentStrokeWidthAtom);
    if (!hoveredSegmentPath) return null;

    return (
        <path
            fill="none"
            stroke={DARK_SEGMENT_HOVER}
            strokeWidth={hoveredSegmentStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={hoveredSegmentPath}
        />
    );
}

export function CanvasSelectedSegmentOverlay() {
    const selectedSegmentPath = useAtomValue(selectedStandaloneSegmentPathAtom);
    const selectedSegmentStrokeWidth = useAtomValue(selectedSegmentStrokeWidthAtom);
    if (!selectedSegmentPath) return null;

    return (
        <path
            fill="none"
            stroke={DARK_SEGMENT_ACTIVE}
            strokeWidth={selectedSegmentStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={selectedSegmentPath}
        />
    );
}