import { atom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { canvasStrokeWidthAtom, hoveredSegmentStrokeWidthAtom, selectedSegmentStrokeWidthAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { doRegisterCanvasSegmentHitAreaAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, hoveredStandaloneSegmentPathAtom, selectedCommandIndicesAtom, selectedStandaloneSegmentPathsAtom } from "@/store/0-atoms/2-4-editor-actions";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils";
import { standaloneSegmentPathsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doStartSelectedSegmentsDragAtom } from "../3-canvas-drag";
import { getSegmentActiveStroke, getSegmentHoverStroke } from "./8-canvas-color-palette";

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
                    onPointerDown={
                        (event) => {
                            event.stopPropagation();
                            doCanvasSegmentHitAreaPointerDown(index, event);
                        }
                    }
                    onMouseEnter={() => {
                        doCanvasSegmentHitAreaMouseEnter({ index });
                    }}
                    onMouseLeave={() => {
                        doCanvasSegmentHitAreaMouseLeave();
                    }}
                    data-selection-hit="true"
                />
            );
        }
    );
}

const doCanvasSegmentHitAreaPointerDownAtom = atom(
    null,
    (get, set, index: number, event: { pointerId: number; clientX: number; clientY: number; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; }) => {
        const selectedCommandIndices = get(selectedCommandIndicesAtom);
        const pathValue = get(svgPathInputAtom);

        if (selectedCommandIndices.includes(index) && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            set(doStartSelectedSegmentsDragAtom, {
                pointerId: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                startPath: pathValue,
            });
            return;
        }

        set(doSelectCommandAtom, {
            index,
            mode: getCommandSelectionMode({
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
            }),
        });
        set(hoveredCommandIndexAtom, index);
        set(hoveredCanvasPointAtom, null);
    }
);

const doCanvasSegmentHitAreaMouseEnterAtom = atom(
    null,
    (_get, set, args: { index: number; }) => {
        set(hoveredCommandIndexAtom, args.index);
        set(hoveredCanvasPointAtom, null);
    }
);

const doCanvasSegmentHitAreaMouseLeaveAtom = atom(
    null,
    (_get, set) => {
        set(hoveredCommandIndexAtom, null);
    }
);
