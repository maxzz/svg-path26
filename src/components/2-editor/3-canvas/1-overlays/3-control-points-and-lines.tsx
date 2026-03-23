import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { commandHoveredAtom, commandSelectedAtom, doFocusPointCommandAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { getCommandSelectionMode } from "@/store/0-atoms/2-2-editor-selection-utils";
import { controlPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doStartPointDragAtom, doStartSelectedSegmentsDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getControlLineStroke, getControlPointFill, getEditorStroke, getPointInteractionClassName } from "./8-canvas-color-palette";

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

export function CanvasControlPoints() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const pathValue = useAtomValue(svgPathInputAtom);
    const controlPoints = useAtomValue(controlPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return controlPoints.map(
        (point: SvgCanvasPoint) => (
            <CanvasControlPoint
                key={point.id}
                point={point}
                darkCanvas={darkCanvas}
                pathValue={pathValue}
                unitsPerPixel={unitsPerPixel}
            />
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

function CanvasControlPoint(props: {
    point: SvgCanvasPoint;
    darkCanvas: boolean;
    pathValue: string;
    unitsPerPixel: number;
}) {
    const { point, darkCanvas, pathValue, unitsPerPixel } = props;
    const selected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));
    const doSelectCommand = useSetAtom(doSelectCommandAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(doStartPointDragAtom);
    const startSelectedSegmentsDrag = useSetAtom(doStartSelectedSegmentsDragAtom);
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
                    fill={getControlHaloFill(selected, darkCanvas)}
                    stroke={getEditorStroke(darkCanvas)}
                    strokeWidth={unitsPerPixel * 6}
                    pointerEvents="none"
                />
            )}

            <rect
                className={getPointInteractionClassName(point.movable)}
                x={point.x - pointOffset}
                y={point.y - pointOffset}
                width={pointSize}
                height={pointSize}
                fill={getControlPointFill(selected, hovered, darkCanvas)}
                stroke="transparent"
                strokeWidth={unitsPerPixel * 10}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    setHoveredCommandIndex(point.segmentIndex);
                    setHoveredCanvasPoint(point);

                    if (selected && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                        startSelectedSegmentsDrag({
                            pointerId: event.pointerId,
                            clientX: event.clientX,
                            clientY: event.clientY,
                            startPath: pathValue,
                        });
                        return;
                    }

                    const selectionMode = getCommandSelectionMode(event);
                    doSelectCommand({ index: point.segmentIndex, mode: selectionMode });
                    if (selectionMode !== "replace") return;

                    setFocusPointCommand(point);
                    if (!point.movable) return;
                    startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
                }}
                onMouseEnter={() => { setHoveredCommandIndex(point.segmentIndex); setHoveredCanvasPoint(point); }}
                onMouseLeave={() => { setHoveredCommandIndex(null); setHoveredCanvasPoint(null); }}
                data-selection-hit="true"
            />
        </g>
    );
}
