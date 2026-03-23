import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { commandHoveredAtom, commandSelectedAtom, doFocusPointCommandAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { getCommandSelectionMode } from "@/store/0-atoms/2-2-editor-selection-utils";
import { targetPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doStartPointDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getEditorStroke, getPointInteractionClassName, getTargetPointFill, getTargetPointStroke } from "./8-canvas-color-palette";

export function CanvasTargetPoints() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const pathValue = useAtomValue(svgPathInputAtom);
    const targetPoints = useAtomValue(targetPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return targetPoints.map(
        (point: SvgCanvasPoint) => (
            <CanvasTargetPoint
                key={point.id}
                point={point}
                darkCanvas={darkCanvas}
                pathValue={pathValue}
                unitsPerPixel={unitsPerPixel}
            />
        )
    );
}

function CanvasTargetPoint(props: {
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
    const haloRadius = unitsPerPixel * 8;
    const pointRadius = unitsPerPixel * (selected ? 5 : 4);

    return (
        <g>
            {(selected || hovered) && (
                <circle
                    cx={point.x}
                    cy={point.y}
                    r={haloRadius}
                    fill={getControlHaloFill(selected, darkCanvas)}
                    stroke={getEditorStroke(darkCanvas)}
                    strokeWidth={unitsPerPixel * 6}
                    pointerEvents="none"
                />
            )}

            <circle
                className={getPointInteractionClassName(point.movable)}
                strokeWidth={unitsPerPixel * (point.movable ? 12 : 0)}
                cx={point.x}
                cy={point.y}
                r={pointRadius}
                fill={getTargetPointFill(selected, hovered, darkCanvas)}
                stroke={getTargetPointStroke(selected, darkCanvas)}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    setHoveredCommandIndex(point.segmentIndex);
                    setHoveredCanvasPoint(point);

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
