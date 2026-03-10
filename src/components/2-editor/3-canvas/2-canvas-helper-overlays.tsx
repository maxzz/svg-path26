import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/1-ui-settings";
import {
    canvasPreviewAtom,
    canvasViewBoxAtom,
    controlLinesAtom,
    controlPointsAtom,
    doFocusPointCommandAtom,
    hoveredCommandIndexAtom,
    isImageEditModeAtom,
    selectedCommandIndexAtom,
    svgPathInputAtom,
    targetPointsAtom,
} from "@/store/0-atoms/2-svg-path-state";
import { startPointDragAtom } from "./3-canvas-drag";

export function CanvasHelperOverlays() {
    const settings = useSnapshot(appSettings);
    const preview = useAtomValue(canvasPreviewAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);

    if (preview || imageEditMode || !settings.showHelpers) return null;

    return (<>
        <CanvasControlLines />
        <CanvasControlPoints />
        <CanvasTargetPoints />
    </>);
}

function CanvasControlLines() {
    const settings = useSnapshot(appSettings);
    const controlLines = useAtomValue(controlLinesAtom);
    const [, , vw, vh] = useAtomValue(canvasViewBoxAtom);
    const controlLinesClasses = getControlLinesClasses(settings.darkCanvas);

    return controlLines.map(
        (line, index) => (
            <line
                key={`line:${index}`}
                x1={line.from.x}
                y1={line.from.y}
                x2={line.to.x}
                y2={line.to.y}
                className={controlLinesClasses}
                strokeWidth={Math.max(vw, vh) / 1400}
            />
        )
    );
}

function CanvasControlPoints() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const controlPoints = useAtomValue(controlPointsAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const [, setHoveredCommandIndex] = useAtom(hoveredCommandIndexAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(startPointDragAtom);

    return controlPoints.map((point) => (
        <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={point.movable ? 1.45 : 1.2}
            className={getControlPointClasses(point.segmentIndex === selectedCommandIndex, point.movable)}
            onPointerDown={(event) => {
                if (!point.movable) return;
                event.stopPropagation();
                setFocusPointCommand(point);
                setSelectedCommandIndex(point.segmentIndex);
                startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
            }}
            onMouseEnter={() => setHoveredCommandIndex(point.segmentIndex)}
            onMouseLeave={() => setHoveredCommandIndex(null)}
        />
    ));
}

function CanvasTargetPoints() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const targetPoints = useAtomValue(targetPointsAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const [, setHoveredCommandIndex] = useAtom(hoveredCommandIndexAtom);
    const setFocusPointCommand = useSetAtom(doFocusPointCommandAtom);
    const startPointDrag = useSetAtom(startPointDragAtom);

    return targetPoints.map(
        (point) => (
            <circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={point.segmentIndex === selectedCommandIndex ? 2.15 : 1.7}
                strokeWidth={point.segmentIndex === selectedCommandIndex ? 0.5 : 0}
                className={getTargetPointClasses(point.segmentIndex === selectedCommandIndex, point.movable)}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    setFocusPointCommand(point);
                    setSelectedCommandIndex(point.segmentIndex);
                    if (!point.movable) return;
                    startPointDrag({ point, pointerId: event.pointerId, startPath: pathValue });
                }}
                onMouseEnter={() => setHoveredCommandIndex(point.segmentIndex)}
                onMouseLeave={() => setHoveredCommandIndex(null)}
            />
        )
    );
}

const controlLinesDarkClasses = "stroke-[oklch(0.65_0_0/0.6)]";
const controlLinesLightClasses = "stroke-[oklch(0.45_0_0/0.6)]";

const controlPointSelectedClasses = "fill-[oklch(0.68_0.18_240)] stroke-transparent";
const controlPointDefaultClasses = "fill-[oklch(0.63_0_0)] stroke-transparent";
const cursorPointerClasses = "cursor-pointer";
const cursorDefaultClasses = "cursor-default";

const targetPointSelectedClasses = "fill-[oklch(0.68_0.2_240)] stroke-[oklch(1_0_0/0.75)]";
const targetPointDefaultClasses = "fill-[oklch(0.84_0.22_30)] stroke-transparent";
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
