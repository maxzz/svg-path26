import { atom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { commandHoveredAtom, commandSelectedAtom, doFocusPointCommandAtom, doSelectCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-editor-actions";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils";
import { targetPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doStartPointDragAtom, doStartSelectedSegmentsDragAtom } from "../3-canvas-drag";
import { getControlHaloFill, getEditorStroke, getPointInteractionClassName, getTargetPointFill } from "./8-canvas-color-palette";

const doCanvasTargetPointPointerDownAtom = atom(
    null,
    (
        get,
        set,
        point: SvgCanvasPoint,
        event: { pointerId: number; clientX: number; clientY: number; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; },
    ) => {
        const selectedCommandIndices = get(selectedCommandIndicesAtom);
        const pathValue = get(svgPathInputAtom);

        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);

        if (selectedCommandIndices.includes(point.segmentIndex) && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            set(doStartSelectedSegmentsDragAtom, {
                pointerId: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                startPath: pathValue,
            });
            return;
        }

        const selectionMode = getCommandSelectionMode({
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
        });
        set(doSelectCommandAtom, { index: point.segmentIndex, mode: selectionMode });
        if (selectionMode !== "replace") return;

        set(doFocusPointCommandAtom, point);
        if (!point.movable) return;
        set(doStartPointDragAtom, { point, pointerId: event.pointerId, startPath: pathValue });
    }
);

const doCanvasTargetPointMouseEnterAtom = atom(
    null,
    (_get, set, point: SvgCanvasPoint) => {
        set(hoveredCommandIndexAtom, point.segmentIndex);
        set(hoveredCanvasPointAtom, point);
    }
);

const doCanvasTargetPointMouseLeaveAtom = atom(
    null,
    (_get, set) => {
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
    }
);

export function CanvasTargetPoints() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const targetPoints = useAtomValue(targetPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return targetPoints.map(
        (point: SvgCanvasPoint) => (
            <CanvasTargetPoint
                key={point.id}
                point={point}
                darkCanvas={darkCanvas}
                unitsPerPixel={unitsPerPixel}
            />
        )
    );
}

function CanvasTargetPoint(props: {
    point: SvgCanvasPoint;
    darkCanvas: boolean;
    unitsPerPixel: number;
}) {
    const { point, darkCanvas, unitsPerPixel } = props;
    const selected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));
    const targetPointColor = getTargetPointFill(selected, hovered, darkCanvas);
    const haloRadius = unitsPerPixel * 8;
    const pointRadius = unitsPerPixel * (selected ? 5 : 4);
    const doCanvasTargetPointPointerDown = useSetAtom(doCanvasTargetPointPointerDownAtom);
    const doCanvasTargetPointMouseEnter = useSetAtom(doCanvasTargetPointMouseEnterAtom);
    const doCanvasTargetPointMouseLeave = useSetAtom(doCanvasTargetPointMouseLeaveAtom);

    return (
        <g>
            {(selected || hovered) && (
                <circle
                    cx={point.x}
                    cy={point.y}
                    r={haloRadius}
                    fill={selected ? getControlHaloFill(selected, darkCanvas) : "none"}
                    stroke={getEditorStroke(darkCanvas)}
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
                fill="transparent"
                stroke="transparent"
                strokeWidth={unitsPerPixel * (point.movable ? 12 : 0)}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    doCanvasTargetPointPointerDown(point, event);
                }}
                onMouseEnter={() => { doCanvasTargetPointMouseEnter(point); }}
                onMouseLeave={() => { doCanvasTargetPointMouseLeave(); }}
                data-selection-hit="true"
            />

            <circle
                cx={point.x}
                cy={point.y}
                r={pointRadius}
                fill={selected ? targetPointColor : "none"}
                stroke={targetPointColor}
                strokeWidth={unitsPerPixel * (point.movable ? 2 : 1.5)}
                pointerEvents="none"
            />
        </g>
    );
}
