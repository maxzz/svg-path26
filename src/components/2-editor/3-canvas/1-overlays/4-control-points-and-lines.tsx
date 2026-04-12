import { atom, useAtomValue, useSetAtom } from "jotai";
import { type PointerEvent } from "react";
import { type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { canvasPointSelectedAtom, commandHoveredAtom, commandSelectedAtom, hasSelectedCanvasPointsAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCanvasPointIdsAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { controlPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { classNames } from "@/utils";
import { doStartPointDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getControlLineStroke, getControlPointFill, getEditorStroke, getPointInteractionClassName } from "./8-canvas-color-palette";

// Control lines

export function CanvasLinesToControlPoints() {
    const controlPoints = useAtomValue(controlPointsAtom);
    const strokeWidth = useAtomValue(canvasStrokeWidthAtom);

    return controlPoints.flatMap(
        (point: SvgCanvasPoint, pointIndex: number) => point.relations.map(
            (relation: Point, relationIndex: number) => (
                <CanvasControlLine
                    point={point}
                    relation={relation}
                    strokeWidth={strokeWidth}
                    key={`line:${pointIndex}:${relationIndex}`}
                />
            )
        )
    );
}

function CanvasControlLine({ point, relation, strokeWidth }: { point: SvgCanvasPoint; relation: { x: number; y: number; }; strokeWidth: number; }) {
    const hasSelectedCanvasPoints = useAtomValue(hasSelectedCanvasPointsAtom);
    const pointSelected = useAtomValue(canvasPointSelectedAtom(point.id));
    const segmentSelected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const selected = hasSelectedCanvasPoints ? pointSelected : segmentSelected;
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));

    return (
        <line
            className={getControlLineStroke(selected, hovered)}
            x1={point.x}
            y1={point.y}
            x2={relation.x}
            y2={relation.y}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 5}`}
            pointerEvents="none"
        />
    );
}

// Control points

export function CanvasControlPoints() {
    const controlPoints = useAtomValue(controlPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return controlPoints.map(
        (point: SvgCanvasPoint) => (
            <CanvasControlPoint point={point} unitsPerPixel={unitsPerPixel} key={point.id} />
        )
    );
}

function CanvasControlPoint({ point, unitsPerPixel }: { point: SvgCanvasPoint; unitsPerPixel: number; }) {
    const hasSelectedCanvasPoints = useAtomValue(hasSelectedCanvasPointsAtom);
    const pointSelected = useAtomValue(canvasPointSelectedAtom(point.id));
    const segmentSelected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const selected = hasSelectedCanvasPoints ? pointSelected : segmentSelected;
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));
    const controlPointClasses = getControlPointFill(selected, hovered);

    const doCanvasControlPointPointerDown = useSetAtom(doCanvasControlPointPointerDownAtom);
    const doCanvasControlPointMouseEnter = useSetAtom(doCanvasControlPointMouseEnterAtom);
    const doCanvasControlPointMouseLeave = useSetAtom(doCanvasControlPointMouseLeaveAtom);

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
                onPointerDown={(event) => { event.stopPropagation(); doCanvasControlPointPointerDown(point, event); }}
                onMouseEnter={() => { doCanvasControlPointMouseEnter(point); }}
                onMouseLeave={() => { doCanvasControlPointMouseLeave(); }}
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

const doCanvasControlPointPointerDownAtom = atom(
    null,
    (get, set, point: SvgCanvasPoint, event: PointerEvent<SVGElement>) => {
        const pathValue = get(svgPathInputAtom);

        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);

        const isToggleSelection = event.ctrlKey || event.metaKey;
        const currentSelectedPointIds = get(selectedCanvasPointIdsAtom);
        const isAlreadySelected = currentSelectedPointIds.includes(point.id);

        const nextSelectedPointIds = isToggleSelection
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

        set(doStartPointDragAtom, { point, pointerId: event.pointerId, startPath: pathValue, points: dragPoints.length ? dragPoints : [point] });
    }
);

const doCanvasControlPointMouseEnterAtom = atom(
    null,
    (_get, set, point: SvgCanvasPoint) => {
        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);
    }
);

const doCanvasControlPointMouseLeaveAtom = atom(
    null,
    (_get, set) => {
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
    }
);
