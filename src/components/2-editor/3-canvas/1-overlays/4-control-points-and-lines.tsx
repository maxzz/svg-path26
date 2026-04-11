import { atom, useAtomValue, useSetAtom } from "jotai";
import { type PointerEvent } from "react";
import { useSnapshot } from "valtio";
import { type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { commandHoveredAtom, commandSelectedAtom, doFocusPointCommandAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils";
import { controlPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { isThemeDark } from "@/utils";
import { doStartPointDragAtom, doStartSelectedSegmentsDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getControlLineStroke, getControlPointFill, getEditorStroke, getPointInteractionClassName } from "./8-canvas-color-palette";

// Control lines

export function CanvasControlLines() {
    const { theme } = useSnapshot(appSettings);
    const isDarkTheme = isThemeDark(theme);
    const controlPoints = useAtomValue(controlPointsAtom);
    const strokeWidth = useAtomValue(canvasStrokeWidthAtom);

    return controlPoints.flatMap(
        (point: SvgCanvasPoint, pointIndex: number) => point.relations.map(
            (relation: Point, relationIndex: number) => (
                <CanvasControlLine
                    point={point}
                    relation={relation}
                    isDarkTheme={isDarkTheme}
                    strokeWidth={strokeWidth}
                    key={`line:${pointIndex}:${relationIndex}`}
                />
            )
        )
    );
}

function CanvasControlLine({ point, relation, isDarkTheme, strokeWidth }: { point: SvgCanvasPoint; relation: { x: number; y: number; }; isDarkTheme: boolean; strokeWidth: number; }) {
    const selected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));

    return (
        <line
            x1={point.x}
            y1={point.y}
            x2={relation.x}
            y2={relation.y}
            stroke={getControlLineStroke(selected, hovered, isDarkTheme)}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 5}`}
            pointerEvents="none"
        />
    );
}

// Control points

export function CanvasControlPoints() {
    const { theme } = useSnapshot(appSettings);
    const isDarkTheme = isThemeDark(theme);
    const controlPoints = useAtomValue(controlPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return controlPoints.map(
        (point: SvgCanvasPoint) => (
            <CanvasControlPoint point={point} isDarkTheme={isDarkTheme} unitsPerPixel={unitsPerPixel} key={point.id} />
        )
    );
}

function CanvasControlPoint({ point, isDarkTheme, unitsPerPixel }: { point: SvgCanvasPoint; isDarkTheme: boolean; unitsPerPixel: number; }) {
    const selected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));
    const controlPointColor = getControlPointFill(selected, hovered, isDarkTheme);

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
                    x={point.x - haloOffset}
                    y={point.y - haloOffset}
                    width={haloSize}
                    height={haloSize}
                    stroke={getEditorStroke(isDarkTheme)}
                    strokeWidth={unitsPerPixel * 6}
                    fill={selected ? getControlHaloFill(selected, isDarkTheme) : "none"}
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
                x={point.x - pointOffset}
                y={point.y - pointOffset}
                width={pointSize}
                height={pointSize}
                strokeWidth={unitsPerPixel * (point.movable ? 2 : 1.5)}
                stroke={controlPointColor}
                fill={selected ? controlPointColor : "none"}
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
