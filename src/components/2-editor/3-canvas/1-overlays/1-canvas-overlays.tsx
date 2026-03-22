import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-1-canvas-viewport-derives";
import { doFocusPointCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { controlPointsAtom, parseErrorAtom, targetPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { pathViewBoxAtom } from "@/store/0-atoms/2-6-path-viewbox";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { doStartPointDragAtom } from "../3-canvas-drag";
import { PathCanvasImageEditOverlays } from "../4-canvas-overlays-image";
import { CanvasHoveredSegmentOverlay, CanvasSegmentHitAreas, CanvasSelectedSegmentOverlay, DARK_SEGMENT_ACTIVE, DARK_SEGMENT_HOVER } from "./2-canvas-segment-overlays";

export function CanvasHelperOverlays() {
    const { showHelpers, canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    const imageEditMode = useAtomValue(isImageEditModeAtom);

    return (<>
        <CanvasMainPathOverlay />

        {!canvasPreview && showViewBoxFrame && <CanvasViewBoxFrame />}

        {!canvasPreview && (<>
            <CanvasSegmentHitAreas />
            <CanvasHoveredSegmentOverlay />
            <CanvasSelectedSegmentOverlay />

            {!imageEditMode && showHelpers && (<>
                <CanvasControlLines />
                <CanvasControlPoints />
                <CanvasTargetPoints />
            </>)}
        </>)}

        <PathCanvasImageEditOverlays />
    </>);
}

// Main Path Overlay

function CanvasMainPathOverlay() {
    const { darkCanvas, canvasPreview, fillPreview } = useSnapshot(appSettings.canvas);

    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);

    return (
        <path
            className={getCanvasPathClasses(canvasPreview, fillPreview, darkCanvas)}
            strokeWidth={canvasStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={parseError || !pathValue ? "M 0 0" : pathValue}
        />
    );
}


function getCanvasPathClasses(canvasPreview: boolean, fillPreview: boolean, darkCanvas: boolean): string {
    return classNames(
        !fillPreview ? "fill-none" : (canvasPreview ? "fill-black/20" : "fill-blue-500/25"),
        canvasPreview ? "stroke-black" : (darkCanvas ? "stroke-white" : "stroke-blue-700")
    );
}

// Viewbox Frame Overlay

function CanvasViewBoxFrame() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const viewBox = useAtomValue(pathViewBoxAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    return (
        <rect
            x={viewBox[0]}
            y={viewBox[1]}
            width={viewBox[2]}
            height={viewBox[3]}
            fill="none"
            stroke={darkCanvas ? "rgba(255,255,255,0.72)" : "rgba(18,18,18,0.72)"}
            strokeDasharray={`${unitsPerPixel * 6} ${unitsPerPixel * 3}`}
            strokeWidth={Math.max(unitsPerPixel * 1.5, unitsPerPixel)}
            pointerEvents="none"
        />
    );
}

// Control Lines Overlay

function CanvasControlLines() {
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

function getControlLineStroke(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    if (darkCanvas) {
        if (selected) return DARK_CONTROL_ACTIVE;
        if (hovered) return DARK_CONTROL_HOVER;
        return "rgba(255, 255, 255, 0.33)";
    }

    if (selected) return LIGHT_HANDLE_ACTIVE;
    if (hovered) return LIGHT_HANDLE_HOVER;
    return LIGHT_HANDLE_IDLE;
}

// Control Points Overlay

function CanvasControlPoints() {
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

// Target Points Overlay

function CanvasTargetPoints() {
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
                        fill={getPointFill(selected, hovered, darkCanvas)}
                        stroke={getTargetPointStroke(selected, darkCanvas)}
                        onPointerDown={
                            (event) => {
                                event.stopPropagation();
                                setFocusPointCommand(point);
                                setSelectedCommandIndex(point.segmentIndex);
                                if (!point.movable) return;
                                startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
                            }
                        }
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

function getControlHaloFill(selected: boolean, darkCanvas: boolean): string {
    if (darkCanvas) return selected ? DARK_CONTROL_ACTIVE : DARK_CONTROL_HOVER;
    return selected ? LIGHT_CONTROL_ACTIVE : LIGHT_CONTROL_HOVER;
}

function getControlPointFill(selected: boolean, hovered: boolean, darkCanvas: boolean): string {
    if (selected) return DARK_SEGMENT_ACTIVE;
    if (hovered) return DARK_SEGMENT_HOVER;
    return darkCanvas ? "#ffffff" : LIGHT_CONTROL_POINT_IDLE;
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

const DARK_EDITOR_STROKE = "#9c00ff63";
const DARK_CONTROL_ACTIVE = "#9c00ffa0";
const DARK_CONTROL_HOVER = "#ffad40";

const LIGHT_EDITOR_STROKE = "#7c3aed3d";
const LIGHT_CONTROL_ACTIVE = "#7c3aed38";
const LIGHT_CONTROL_HOVER = "#d977063d";
const LIGHT_HANDLE_ACTIVE = "#7c3aed";
const LIGHT_HANDLE_HOVER = "#d97706";
const LIGHT_HANDLE_IDLE = "#64748bad";
const LIGHT_CONTROL_POINT_IDLE = "#64748b";
const LIGHT_TARGET_POINT_IDLE = "#334155";
const LIGHT_TARGET_POINT_STROKE = "#0f172a29";

//

