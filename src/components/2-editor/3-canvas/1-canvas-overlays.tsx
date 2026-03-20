import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { type SvgCanvasLine, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom, hoveredSegmentStrokeWidthAtom, selectedSegmentStrokeWidthAtom } from "../../../store/0-atoms/2-1-canvas-viewport-derives";
import { doFocusPointCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, hoveredStandaloneSegmentPathAtom, selectedCommandIndexAtom, selectedStandaloneSegmentPathAtom } from "@/store/0-atoms/2-2-editor-actions";
import { controlLinesAtom, controlPointsAtom, parseErrorAtom, targetPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { pathViewBoxAtom } from "@/store/0-atoms/2-6-path-viewbox";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { doStartPointDragAtom } from "./3-canvas-drag";
import { PathCanvasImageEditOverlays } from "./4-canvas-overlays-image";

export function CanvasHelperOverlays() {
    const { showHelpers, canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    const imageEditMode = useAtomValue(isImageEditModeAtom);

    return (<>
        <CanvasMainPathOverlay />

        {!canvasPreview && showViewBoxFrame && <CanvasViewBoxFrame />}

        {!canvasPreview && (<>
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
        canvasPreview ? "stroke-black" : (darkCanvas ? "stroke-slate-200" : "stroke-blue-700")
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

// Hovered Segment Overlay

function CanvasHoveredSegmentOverlay() {
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const hoveredSegmentStrokeWidth = useAtomValue(hoveredSegmentStrokeWidthAtom);
    if (!hoveredSegmentPath) return null;

    return (
        <path
            className="fill-none stroke-red-400"
            strokeWidth={hoveredSegmentStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={hoveredSegmentPath}
        />
    );
}

// Selected Segment Overlay

function CanvasSelectedSegmentOverlay() {
    const selectedSegmentPath = useAtomValue(selectedStandaloneSegmentPathAtom);
    const selectedSegmentStrokeWidth = useAtomValue(selectedSegmentStrokeWidthAtom);
    if (!selectedSegmentPath) return null;

    return (
        <path
            className="fill-none stroke-sky-500"
            strokeWidth={selectedSegmentStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={selectedSegmentPath}
        />
    );
}

// Control Lines Overlay

function CanvasControlLines() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const controlLines = useAtomValue(controlLinesAtom);
    const strokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const controlLinesClasses = getControlLinesClasses(darkCanvas);

    return controlLines.map(
        (line: SvgCanvasLine, index: number) => (
            <line
                className={controlLinesClasses}
                strokeWidth={strokeWidth}
                x1={line.from.x}
                y1={line.from.y}
                x2={line.to.x}
                y2={line.to.y}
                key={`line:${index}`}
            />
        )
    );
}

function getControlLinesClasses(darkCanvas: boolean): string {
    return darkCanvas ? "stroke-zinc-400/60" : "stroke-zinc-700/60";
}

// Control Points Overlay

function CanvasControlPoints() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const controlPoints = useAtomValue(controlPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);

    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(doStartPointDragAtom);

    return controlPoints.map(
        (point: SvgCanvasPoint) => (
            <circle
                className={getControlPointClasses(point.segmentIndex === selectedCommandIndex, point.movable)}
                strokeWidth={unitsPerPixel * (point.movable ? 12 : 4)}
                cx={point.x}
                cy={point.y}
                r={unitsPerPixel * (point.movable ? 3 : 2.5)}
                onPointerDown={(event) => {
                    if (!point.movable) return;
                    event.stopPropagation();
                    setFocusPointCommand(point);
                    setSelectedCommandIndex(point.segmentIndex);
                    startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
                }}
                onMouseEnter={() => { setHoveredCommandIndex(point.segmentIndex); setHoveredCanvasPoint(point); }}
                onMouseLeave={() => { setHoveredCommandIndex(null); setHoveredCanvasPoint(null); }}
                key={point.id}
            />
        )
    );
}

function getControlPointClasses(selected: boolean, movable: boolean): string {
    return classNames(
        selected ? "fill-sky-500 stroke-transparent" : "fill-zinc-500 stroke-transparent",
        movable ? "cursor-pointer" : "cursor-default",
    );
}

// Target Points Overlay

function CanvasTargetPoints() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const targetPoints = useAtomValue(targetPointsAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(doStartPointDragAtom);

    return targetPoints.map(
        (point: SvgCanvasPoint) => (
            <circle
                className={getTargetPointClasses(point.segmentIndex === selectedCommandIndex, point.movable)}
                strokeWidth={unitsPerPixel * (point.movable ? 12 : 0)}
                cx={point.x}
                cy={point.y}
                r={unitsPerPixel * (point.segmentIndex === selectedCommandIndex ? 3.35 : 3)}
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
                key={point.id}
            />
        )
    );
}

function getTargetPointClasses(selected: boolean, movable: boolean): string {
    return classNames(
        selected ? "fill-sky-500 stroke-white/75" : "fill-orange-400 stroke-transparent",
        movable ? "cursor-pointer transition-all" : "cursor-default",
    );
}

//
