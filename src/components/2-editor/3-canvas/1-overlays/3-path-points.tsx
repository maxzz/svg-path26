import { type PointerEvent } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { commandHoveredAtom, commandSelectedAtom, doFocusPointCommandAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils";
import { pathPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { classNames } from "@/utils";
import { doStartPointDragAtom, doStartSelectedSegmentsDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getEditorStroke, getPointInteractionClassName, getTargetPointFill } from "./8-canvas-color-palette";

export function CanvasPathPoints() {
    const pathPoints = useAtomValue(pathPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return pathPoints.map(
        (point: SvgCanvasPoint) => (
            <CanvasPathPoint
                key={point.id}
                point={point}
                unitsPerPixel={unitsPerPixel}
            />
        )
    );
}

function CanvasPathPoint({ point, unitsPerPixel }: { point: SvgCanvasPoint; unitsPerPixel: number; }) {
    const selected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));
    const targetPointClasses = getTargetPointFill(selected, hovered);
    const haloRadius = unitsPerPixel * 8;
    const pointRadius = unitsPerPixel * (selected ? 5 : 4);

    const doCanvasPathPointPointerDown = useSetAtom(doCanvasPathPointPointerDownAtom);
    const doCanvasPathPointMouseEnter = useSetAtom(doCanvasPathPointMouseEnterAtom);
    const doCanvasPathPointMouseLeave = useSetAtom(doCanvasPathPointMouseLeaveAtom);

    return (
        <g>
            {(selected || hovered) && (
                <circle
                    className={classNames(selected ? getControlHaloFill(selected) : "fill-none", getEditorStroke())}
                    cx={point.x}
                    cy={point.y}
                    r={haloRadius}
                    strokeWidth={unitsPerPixel * 6}
                    pointerEvents="none"
                />
            )}

            {/* Invisible hit area for pointer selection/dragging */}
            <circle
                className={getPointInteractionClassName(point.movable)}
                cx={point.x}
                cy={point.y}
                r={pointRadius}
                strokeWidth={unitsPerPixel * (point.movable ? 12 : 0)}
                fill="transparent"
                stroke="transparent"
                onPointerDown={(event) => { event.stopPropagation(); doCanvasPathPointPointerDown(point, event); }}
                onMouseEnter={() => { doCanvasPathPointMouseEnter(point); }}
                onMouseLeave={() => { doCanvasPathPointMouseLeave(); }}
                data-selection-hit="true"
            />

            <circle
                className={targetPointClasses}
                cx={point.x}
                cy={point.y}
                r={pointRadius}
                strokeWidth={unitsPerPixel * (point.movable ? 2 : 1.5)}
                pointerEvents="none"
            />
        </g>
    );
}

const doCanvasPathPointPointerDownAtom = atom(
    null,
    (get, set, point: SvgCanvasPoint, event: PointerEvent<SVGElement>) => {
        const selectedCommandIndices = get(selectedCommandIndicesAtom);
        const pathValue = get(svgPathInputAtom);

        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);

        if (selectedCommandIndices.includes(point.segmentIndex) && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            set(doStartSelectedSegmentsDragAtom, pathValue, selectedCommandIndices, event);
            return;
        }

        const selectionMode = getCommandSelectionMode(event);
        set(doSelectCommandAtom, { index: point.segmentIndex, mode: selectionMode });
        if (selectionMode !== "replace") return;

        set(doFocusPointCommandAtom, point);
        if (!point.movable) return;
        set(doStartPointDragAtom, { point, pointerId: event.pointerId, startPath: pathValue });
    }
);

const doCanvasPathPointMouseEnterAtom = atom(
    null,
    (_get, set, point: SvgCanvasPoint) => {
        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);
    }
);

const doCanvasPathPointMouseLeaveAtom = atom(
    null,
    (_get, set) => {
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
    }
);
