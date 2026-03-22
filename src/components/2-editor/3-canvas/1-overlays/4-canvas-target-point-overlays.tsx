import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { doFocusPointCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { targetPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doStartPointDragAtom } from "../3-canvas-drag";

const DARK_SEGMENT_ACTIVE = "#009cff";
const DARK_SEGMENT_HOVER = "#ff4343";
const DARK_EDITOR_STROKE = "#9c00ff63";
const DARK_CONTROL_ACTIVE = "#9c00ffa0";
const DARK_CONTROL_HOVER = "#ffad40";

const LIGHT_EDITOR_STROKE = "#7c3aed3d";
const LIGHT_CONTROL_ACTIVE = "#7c3aed38";
const LIGHT_CONTROL_HOVER = "#d977063d";
const LIGHT_TARGET_POINT_IDLE = "#334155";
const LIGHT_TARGET_POINT_STROKE = "#0f172a29";

export function CanvasTargetPoints() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const pathValue = useAtomValue(svgPathInputAtom);
    const targetPoints = useAtomValue(targetPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const hoveredCommandIndex = useAtomValue(hoveredCommandIndexAtom);

    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(doStartPointDragAtom);

    return targetPoints.map(
        (point: SvgCanvasPoint) => {
            const selected = point.segmentIndex === selectedCommandIndex;
            const hovered = point.segmentIndex === hoveredCommandIndex;
            const haloRadius = unitsPerPixel * 8;
            const pointRadius = unitsPerPixel * (selected ? 5 : 4);

            return (
                <g key={point.id}>
                    {(selected || hovered) && (
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={haloRadius}
                            fill={getTargetHaloFill(selected, darkCanvas)}
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
                        fill={getPointFill(selected, hovered, darkCanvas)}
                        stroke={getTargetPointStroke(selected, darkCanvas)}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            setFocusPointCommand(point);
                            setSelectedCommandIndex(point.segmentIndex);
                            if (!point.movable) return;
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

function getPointInteractionClassName(movable: boolean): string {
    return movable ? "cursor-pointer transition-all" : "cursor-default";
}

function getEditorStroke(darkCanvas: boolean): string {
    return darkCanvas ? DARK_EDITOR_STROKE : LIGHT_EDITOR_STROKE;
}

function getTargetHaloFill(selected: boolean, darkCanvas: boolean): string {
    if (darkCanvas) return selected ? DARK_CONTROL_ACTIVE : DARK_CONTROL_HOVER;
    return selected ? LIGHT_CONTROL_ACTIVE : LIGHT_CONTROL_HOVER;
}

function getPointFill(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    if (selected) return DARK_SEGMENT_ACTIVE;
    if (hovered) return DARK_SEGMENT_HOVER;
    return darkCanvas ? "#ffffff" : LIGHT_TARGET_POINT_IDLE;
}

function getTargetPointStroke(selected: boolean, darkCanvas: boolean): string {
    if (!selected) return "transparent";
    return darkCanvas ? "#ffffff38" : LIGHT_TARGET_POINT_STROKE;
}