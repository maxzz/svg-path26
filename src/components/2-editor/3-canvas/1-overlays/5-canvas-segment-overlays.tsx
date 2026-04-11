import { type PointerEvent } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { canvasStrokeWidthAtom, hoveredSegmentStrokeWidthAtom, selectedSegmentStrokeWidthAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { doRegisterCanvasSegmentHitAreaAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, hoveredStandaloneSegmentPathAtom, selectedCommandIndicesAtom, selectedStandaloneSegmentPathsAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils";
import { standaloneSegmentPathsAtom } from "@/store/0-atoms/2-0-svg-model";
import { doStartSelectedSegmentsDragAtom } from "../3-canvas-drag";
import { getSegmentActiveStroke, getSegmentHoverStroke } from "./8-canvas-color-palette";

// Selected segment overlay

export function CanvasSelectedSegmentOverlay() {
    const selectedSegmentPaths = useAtomValue(selectedStandaloneSegmentPathsAtom);
    const selectedSegmentStrokeWidth = useAtomValue(selectedSegmentStrokeWidthAtom);
    if (!selectedSegmentPaths.length) return null;

    return selectedSegmentPaths.map(
        (selectedSegmentPath, index) => (
            <path
                className={getSegmentActiveStroke()}
                d={selectedSegmentPath}
                strokeWidth={selectedSegmentStrokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
                key={`selected-segment:${index}:${selectedSegmentPath}`}
            />
        )
    );
}

// Segment hit areas

export function CanvasSegmentHitAreas() {
    const segmentPaths = useAtomValue(standaloneSegmentPathsAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const doRegisterSegmentHitArea = useSetAtom(doRegisterCanvasSegmentHitAreaAtom);

    const doCanvasSegmentHitAreaPointerDown = useSetAtom(doCanvasSegmentHitAreaPointerDownAtom);
    const doCanvasSegmentHitAreaMouseEnter = useSetAtom(doCanvasSegmentHitAreaMouseEnterAtom);
    const doCanvasSegmentHitAreaMouseLeave = useSetAtom(doCanvasSegmentHitAreaMouseLeaveAtom);

    return segmentPaths.map(
        (segmentPath, index) => {
            if (!segmentPath) return null;
            return (
                <path
                    ref={(element) => { doRegisterSegmentHitArea({ index, element }); }}
                    d={segmentPath}
                    strokeWidth={Math.max(canvasStrokeWidth * 10, canvasStrokeWidth * 4)}
                    stroke="transparent"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onPointerDown={(event) => { event.stopPropagation(); doCanvasSegmentHitAreaPointerDown(index, event); }}
                    onMouseEnter={() => { doCanvasSegmentHitAreaMouseEnter(index); }}
                    onMouseLeave={() => { doCanvasSegmentHitAreaMouseLeave(); }}
                    data-selection-hit="true"
                    key={`segment-hit:${index}`}
                />
            );
        }
    );
}

const doCanvasSegmentHitAreaPointerDownAtom = atom(
    null,
    (get, set, index: number, event: PointerEvent<SVGElement>) => {
        const selectedCommandIndices = get(selectedCommandIndicesAtom);
        const pathValue = get(svgPathInputAtom);

        if (selectedCommandIndices.includes(index) && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            set(doStartSelectedSegmentsDragAtom, pathValue, selectedCommandIndices, event);
            return;
        }

        set(doSelectCommandAtom, {
            index,
            mode: getCommandSelectionMode(event),
        });
        set(hoveredCommandIndexAtom, index);
        set(hoveredCanvasPointAtom, null);
    }
);

const doCanvasSegmentHitAreaMouseEnterAtom = atom(
    null,
    (_get, set, index: number) => {
        set(hoveredCommandIndexAtom, index);
        set(hoveredCanvasPointAtom, null);
    }
);

const doCanvasSegmentHitAreaMouseLeaveAtom = atom(
    null,
    (_get, set) => {
        set(hoveredCommandIndexAtom, null);
    }
);

// Hovered segment overlay

export function CanvasHoveredSegmentOverlay() {
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const hoveredSegmentStrokeWidth = useAtomValue(hoveredSegmentStrokeWidthAtom);
    if (!hoveredSegmentPath) return null;

    return (
        <path
            className={getSegmentHoverStroke()}
            d={hoveredSegmentPath}
            strokeWidth={hoveredSegmentStrokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
        />
    );
}
