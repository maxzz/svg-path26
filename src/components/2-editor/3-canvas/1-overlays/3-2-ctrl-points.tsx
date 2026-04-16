import { atom, useAtomValue, useSetAtom } from "jotai";
import { type PointerEvent } from "react";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { canvasPointSelectedAtom, commandHoveredAtom, commandSelectedAtom, hasSelectedCanvasPointsAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCanvasPointIdsAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { controlPointsAtom, segmentSubPathEnabledAtom } from "@/store/0-atoms/2-0-svg-model";
import { classNames } from "@/utils";
import { doStartDrag_PointAtom } from "../3-canvas-drag";
import { getControlHaloFill, getControlPointFill, getEditorStroke, getPointInteractionClassName } from "./8-canvas-color-palette";

// Control points

export function CtrlPts() {
    const controlPoints = useAtomValue(controlPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return controlPoints.map(
        (point: SvgCanvasPoint) => (
            <CtrlPt point={point} unitsPerPixel={unitsPerPixel} key={point.id} />
        )
    );
}

function CtrlPt({ point, unitsPerPixel }: { point: SvgCanvasPoint; unitsPerPixel: number; }) {
    const segmentEnabled = useAtomValue(segmentSubPathEnabledAtom(point.segmentIndex));
    if (!segmentEnabled) {
        return null;
    }

    const hasSelectedCanvasPoints = useAtomValue(hasSelectedCanvasPointsAtom);
    const pointSelected = useAtomValue(canvasPointSelectedAtom(point.id));
    const segmentSelected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const selected = hasSelectedCanvasPoints ? pointSelected : segmentSelected;
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));
    const controlPointClasses = getControlPointFill(selected, hovered);

    const doCtrlPt_PointerDown = useSetAtom(doCtrlPt_PointerDownAtom);
    const doCtrlPt_MouseEnter = useSetAtom(doCtrlPt_MouseEnterAtom);
    const doCtrlPt_MouseLeave = useSetAtom(doCtrlPt_MouseLeaveAtom);

    const pointSize = unitsPerPixel * (point.movable ? 6 : 5);
    const pointOffset = pointSize / 2;
    const haloSize = unitsPerPixel * 16;
    const haloOffset = haloSize / 2;

    return (
        <g>
            {(selected || hovered) && (
                <rect
                    className={classNames(selected ? getControlHaloFill(selected) : "fill-none", getEditorStroke())}
                    x={point.x - haloOffset}
                    y={point.y - haloOffset}
                    width={haloSize}
                    height={haloSize}
                    strokeWidth={unitsPerPixel * 6}
                    pointerEvents="none"
                />
            )}

            {/* Invisible hit area for pointer selection/dragging */}
            <rect
                className={getPointInteractionClassName(point.movable)}
                x={point.x - pointOffset}
                y={point.y - pointOffset}
                width={pointSize}
                height={pointSize}
                strokeWidth={unitsPerPixel * 10}
                stroke="transparent"
                fill="transparent"
                onPointerDown={(event) => { event.stopPropagation(); doCtrlPt_PointerDown(point, event); }}
                onMouseEnter={() => { doCtrlPt_MouseEnter(point); }}
                onMouseLeave={() => { doCtrlPt_MouseLeave(); }}
                data-selection-hit="true"
            />

            {/* Visible control point: unfilled square unless selected */}
            <rect
                className={controlPointClasses}
                x={point.x - pointOffset}
                y={point.y - pointOffset}
                width={pointSize}
                height={pointSize}
                strokeWidth={unitsPerPixel * (point.movable ? 2 : 1.5)}
                pointerEvents="none"
            />
        </g>
    );
}

// Canvas point interaction handlers/atoms

const doCtrlPt_PointerDownAtom = atom(
    null,
    (get, set, point: SvgCanvasPoint, event: PointerEvent<SVGElement>) => {
        const pathValue = get(svgPathInputAtom);

        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);

        const isToggleSelection = event.ctrlKey || event.metaKey;
        const currentSelectedPointIds = get(selectedCanvasPointIdsAtom);
        const isAlreadySelected = currentSelectedPointIds.includes(point.id);

        const nextSelectedPointIds =
            isToggleSelection
                ? isAlreadySelected
                    ? currentSelectedPointIds.filter((id) => id !== point.id)
                    : [...currentSelectedPointIds, point.id]
                : isAlreadySelected
                    ? currentSelectedPointIds
                    : [point.id];

        set(selectedCanvasPointIdsAtom, nextSelectedPointIds);
        set(selectedCommandIndicesAtom, []);

        if (!point.movable) return;

        const dragPointIds = nextSelectedPointIds.includes(point.id) ? nextSelectedPointIds : [point.id];
        const dragIdSet = new Set(dragPointIds);
        const dragPoints = get(controlPointsAtom).filter((p) => p.movable && dragIdSet.has(p.id));

        set(doStartDrag_PointAtom, { point, pointerId: event.pointerId, startPath: pathValue, points: dragPoints.length ? dragPoints : [point] });
    }
);

const doCtrlPt_MouseEnterAtom = atom(
    null,
    (_get, set, point: SvgCanvasPoint) => {
        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);
    }
);

const doCtrlPt_MouseLeaveAtom = atom(
    null,
    (_get, set) => {
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
    }
);
