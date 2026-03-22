import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { doFocusPointCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { controlPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doStartPointDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getControlLineStroke, getControlPointFill, getEditorStroke, getPointInteractionClassName } from "./8-canvas-color-palette";

export function CanvasControlLines() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const controlPoints = useAtomValue(controlPointsAtom);
    const strokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const selectedCommandIndex = useAtomValue(selectedCommandIndexAtom);
    const hoveredCommandIndex = useAtomValue(hoveredCommandIndexAtom);

    return controlPoints.flatMap(
        (point: SvgCanvasPoint, pointIndex: number) => point.relations.map(
            (relation, relationIndex) => (
                <line
                    stroke={getControlLineStroke(point.segmentIndex === selectedCommandIndex, point.segmentIndex === hoveredCommandIndex, darkCanvas)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 5}`}
                    x1={point.x}
                    y1={point.y}
                    x2={relation.x}
                    y2={relation.y}
                    key={`line:${pointIndex}:${relationIndex}`}
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
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const hoveredCommandIndex = useAtomValue(hoveredCommandIndexAtom);

    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(doStartPointDragAtom);

    return controlPoints.map(
        (point: SvgCanvasPoint) => {
            const selected = point.segmentIndex === selectedCommandIndex;
            const hovered = point.segmentIndex === hoveredCommandIndex;
            const pointSize = unitsPerPixel * (point.movable ? 6 : 5);
            const pointOffset = pointSize / 2;
            const haloSize = unitsPerPixel * 16;
            const haloOffset = haloSize / 2;

            return (
                <g key={point.id}>
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
                            if (!point.movable) return;
                            event.stopPropagation();
                            setFocusPointCommand(point);
                            setSelectedCommandIndex(point.segmentIndex);
                            startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
                        }}
                        onMouseEnter={() => { setHoveredCommandIndex(point.segmentIndex); setHoveredCanvasPoint(point); }}
                        onMouseLeave={() => { setHoveredCommandIndex(null); setHoveredCanvasPoint(null); }}
                    />
                </g>
            );
        }
    );
}
