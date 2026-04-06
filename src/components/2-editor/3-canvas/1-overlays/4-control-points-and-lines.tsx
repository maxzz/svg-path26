import { atom, useAtomValue, useSetAtom } from "jotai";
import { type PointerEvent } from "react";
import { useSnapshot } from "valtio";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { commandHoveredAtom, commandSelectedAtom, doFocusPointCommandAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-editor-actions";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils";
import { controlPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doStartPointDragAtom, doStartSelectedSegmentsDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getControlLineStroke, getControlPointFill, getEditorStroke, getPointInteractionClassName } from "./8-canvas-color-palette";

// Control lines

export function CanvasControlLines() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const controlPoints = useAtomValue(controlPointsAtom);
    const strokeWidth = useAtomValue(canvasStrokeWidthAtom);

    return controlPoints.flatMap(
        (point: SvgCanvasPoint, pointIndex: number) => point.relations.map(
            (relation, relationIndex) => (
                <CanvasControlLine
                    key={`line:${pointIndex}:${relationIndex}`}
                    point={point}
                    relation={relation}
                    darkCanvas={darkCanvas}
                    strokeWidth={strokeWidth}
                />
            )
        )
    );
}

function CanvasControlLine(props: {
    point: SvgCanvasPoint;
    relation: { x: number; y: number; };
    darkCanvas: boolean;
    strokeWidth: number;
}) {
    const { point, relation, darkCanvas, strokeWidth } = props;
    const selected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));

    return (
        <line
            stroke={getControlLineStroke(selected, hovered, darkCanvas)}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 5}`}
            x1={point.x}
            y1={point.y}
            x2={relation.x}
            y2={relation.y}
            pointerEvents="none"
        />
    );
}

// Control points

export function CanvasControlPoints() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const controlPoints = useAtomValue(controlPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return controlPoints.map(
        (point: SvgCanvasPoint) => (
            <CanvasControlPoint
                key={point.id}
                point={point}
                darkCanvas={darkCanvas}
                unitsPerPixel={unitsPerPixel}
            />
        )
    );
}

function CanvasControlPoint(props: {
    point: SvgCanvasPoint;
    darkCanvas: boolean;
    unitsPerPixel: number;
}) {
    const { point, darkCanvas, unitsPerPixel } = props;
    const selected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));
    const controlPointColor = getControlPointFill(selected, hovered, darkCanvas);
    const pointSize = unitsPerPixel * (point.movable ? 6 : 5);
    const pointOffset = pointSize / 2;
    const haloSize = unitsPerPixel * 16;
    const haloOffset = haloSize / 2;

    const doCanvasControlPointPointerDown = useSetAtom(doCanvasControlPointPointerDownAtom);
    const doCanvasControlPointMouseEnter = useSetAtom(doCanvasControlPointMouseEnterAtom);
    const doCanvasControlPointMouseLeave = useSetAtom(doCanvasControlPointMouseLeaveAtom);

    return (
        <g>
            {(selected || hovered) && (
                <rect
                    x={point.x - haloOffset}
                    y={point.y - haloOffset}
                    width={haloSize}
                    height={haloSize}
                    fill={selected ? getControlHaloFill(selected, darkCanvas) : "none"}
                    stroke={getEditorStroke(darkCanvas)}
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
                fill="transparent"
                stroke="transparent"
                strokeWidth={unitsPerPixel * 10}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    doCanvasControlPointPointerDown(point, event);
                }}
                onMouseEnter={() => { doCanvasControlPointMouseEnter(point); }}
                onMouseLeave={() => { doCanvasControlPointMouseLeave(); }}
                data-selection-hit="true"
            />

            {/* Visible control point: unfilled square unless selected */}
            <rect
                x={point.x - pointOffset}
                y={point.y - pointOffset}
                width={pointSize}
                height={pointSize}
                fill={selected ? controlPointColor : "none"}
                stroke={controlPointColor}
                strokeWidth={unitsPerPixel * (point.movable ? 2 : 1.5)}
                pointerEvents="none"
            />
        </g>
    );
}

const doCanvasControlPointPointerDownAtom = atom(
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
