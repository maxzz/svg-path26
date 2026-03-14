import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom, canvasUnitsPerPixelAtom, hoveredSegmentStrokeWidthAtom, selectedSegmentStrokeWidthAtom } from "./5-canvas-viewport-metrics";
import { doFocusPointCommandAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, hoveredStandaloneSegmentPathAtom, selectedCommandIndexAtom, selectedStandaloneSegmentPathAtom } from "@/store/0-atoms/2-2-editor-actions";
import { controlLinesAtom, controlPointsAtom, parseErrorAtom, targetPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { startPointDragAtom } from "./3-canvas-drag";

export function CanvasHelperOverlays() {
    const { showHelpers } = useSnapshot(appSettings);
    const { canvasPreview: preview } = useSnapshot(appSettings.pathEditor);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    if (preview || imageEditMode || !showHelpers) return null;

    return (<>
        <CanvasControlLines unitsPerPixel={unitsPerPixel} />
        <CanvasControlPoints unitsPerPixel={unitsPerPixel} />
        <CanvasTargetPoints unitsPerPixel={unitsPerPixel} />
    </>);
}

export function CanvasPathOverlays() {
    const { darkCanvas } = useSnapshot(appSettings);
    const { canvasPreview: preview, fillPreview } = useSnapshot(appSettings.pathEditor);
    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const hoveredSegmentPath = useAtomValue(hoveredStandaloneSegmentPathAtom);
    const selectedSegmentPath = useAtomValue(selectedStandaloneSegmentPathAtom);
    const hoveredSegmentStrokeWidth = useAtomValue(hoveredSegmentStrokeWidthAtom);
    const selectedSegmentStrokeWidth = useAtomValue(selectedSegmentStrokeWidthAtom);

    return (
        <>
            <path
                className={getCanvasPathClasses(preview, fillPreview, darkCanvas)}
                d={parseError ? "M 0 0" : (pathValue || "M 0 0")}
                strokeWidth={canvasStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {!preview && hoveredSegmentPath && (
                <path
                    className={segmentHoveredClasses}
                    d={hoveredSegmentPath}
                    strokeWidth={hoveredSegmentStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}

            {!preview && selectedSegmentPath && (
                <path
                    className={segmentSelectedClasses}
                    d={selectedSegmentPath}
                    strokeWidth={selectedSegmentStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </>
    );
}

function CanvasControlLines({ unitsPerPixel }: { unitsPerPixel: number; }) {
    const { darkCanvas } = useSnapshot(appSettings);
    const controlLines = useAtomValue(controlLinesAtom);
    const strokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const controlLinesClasses = getControlLinesClasses(darkCanvas);

    return controlLines.map(
        (line, index) => (
            <line
                key={`line:${index}`}
                x1={line.from.x}
                y1={line.from.y}
                x2={line.to.x}
                y2={line.to.y}
                className={controlLinesClasses}
                strokeWidth={strokeWidth}
            />
        )
    );
}

function CanvasControlPoints({ unitsPerPixel }: { unitsPerPixel: number; }) {
    const pathValue = useAtomValue(svgPathInputAtom);
    const controlPoints = useAtomValue(controlPointsAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(startPointDragAtom);

    return controlPoints.map((point) => (
        <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={unitsPerPixel * (point.movable ? 3 : 2.5)}
            strokeWidth={unitsPerPixel * (point.movable ? 12 : 4)}
            className={getControlPointClasses(point.segmentIndex === selectedCommandIndex, point.movable)}
            onPointerDown={(event) => {
                if (!point.movable) return;
                event.stopPropagation();
                setFocusPointCommand(point);
                setSelectedCommandIndex(point.segmentIndex);
                startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
            }}
            onMouseEnter={() => {
                setHoveredCommandIndex(point.segmentIndex);
                setHoveredCanvasPoint(point);
            }}
            onMouseLeave={() => {
                setHoveredCommandIndex(null);
                setHoveredCanvasPoint(null);
            }}
        />
    ));
}

function CanvasTargetPoints({ unitsPerPixel }: { unitsPerPixel: number; }) {
    const pathValue = useAtomValue(svgPathInputAtom);
    const targetPoints = useAtomValue(targetPointsAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const setHoveredCanvasPoint = useSetAtom(hoveredCanvasPointAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(startPointDragAtom);

    return targetPoints.map(
        (point) => (
            <circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={unitsPerPixel * (point.segmentIndex === selectedCommandIndex ? 3.35 : 3)}
                strokeWidth={unitsPerPixel * (point.movable ? 12 : 0)}
                className={getTargetPointClasses(point.segmentIndex === selectedCommandIndex, point.movable)}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    setFocusPointCommand(point);
                    setSelectedCommandIndex(point.segmentIndex);
                    if (!point.movable) return;
                    startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
                }}
                onMouseEnter={() => {
                    setHoveredCommandIndex(point.segmentIndex);
                    setHoveredCanvasPoint(point);
                }}
                onMouseLeave={() => {
                    setHoveredCommandIndex(null);
                    setHoveredCanvasPoint(null);
                }}
            />
        )
    );
}

// Canvas Helper Overlays

function getCanvasPathClasses(preview: boolean, fillPreview: boolean, darkCanvas: boolean): string {
    const fill =
        !fillPreview
            ? pathNoFillClasses
            : (preview ? pathPreviewFillClasses : pathEditorFillClasses);
    const stroke =
        preview
            ? pathPreviewStrokeClasses
            : (darkCanvas ? pathDarkStrokeClasses : pathLightStrokeClasses);

    return classNames(fill, stroke);
}

const pathPreviewFillClasses = "fill-black/20";
const pathEditorFillClasses = "fill-blue-500/25";
const pathNoFillClasses = "fill-none";

const pathPreviewStrokeClasses = "stroke-black";
const pathDarkStrokeClasses = "stroke-slate-200";
const pathLightStrokeClasses = "stroke-blue-700";

const segmentHoveredClasses = "fill-none stroke-red-400";
const segmentSelectedClasses = "fill-none stroke-sky-500";

// Canvas Helper Overlays

const controlLinesDarkClasses = "stroke-zinc-400/60";
const controlLinesLightClasses = "stroke-zinc-700/60";

const controlPointSelectedClasses = "fill-sky-500 stroke-transparent";
const controlPointDefaultClasses = "fill-zinc-500 stroke-transparent";
const cursorPointerClasses = "cursor-pointer";
const cursorDefaultClasses = "cursor-default";

const targetPointSelectedClasses = "fill-sky-500 stroke-white/75";
const targetPointDefaultClasses = "fill-orange-400 stroke-transparent";
const targetPointInteractiveClasses = "cursor-pointer transition-all";

function getControlLinesClasses(darkCanvas: boolean): string {
    return darkCanvas ? controlLinesDarkClasses : controlLinesLightClasses;
}

function getControlPointClasses(selected: boolean, movable: boolean): string {
    return classNames(
        selected ? controlPointSelectedClasses : controlPointDefaultClasses,
        movable ? cursorPointerClasses : cursorDefaultClasses,
    );
}

function getTargetPointClasses(selected: boolean, movable: boolean): string {
    return classNames(
        selected ? targetPointSelectedClasses : targetPointDefaultClasses,
        movable ? targetPointInteractiveClasses : cursorDefaultClasses,
    );
}
