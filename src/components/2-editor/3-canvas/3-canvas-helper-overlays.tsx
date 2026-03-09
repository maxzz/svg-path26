import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { cn } from "@/utils";
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
import { startPointDragAtom } from "./4-canvas-drag";

export function CanvasHelperOverlays() {
    const settings = useSnapshot(appSettings);
    const preview = useAtomValue(canvasPreviewAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);

    if (preview || imageEditMode || !settings.showHelpers) return null;

    return (
        <>
            <CanvasControlLines />
            <CanvasControlPoints />
            <CanvasTargetPoints />
        </>
    );
}

function CanvasControlLines() {
    const settings = useSnapshot(appSettings);
    const controlLines = useAtomValue(controlLinesAtom);
    const [, , vw, vh] = useAtomValue(canvasViewBoxAtom);

    return controlLines.map((line, index) => (
        <line
            key={`line:${index}`}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            stroke={settings.darkCanvas ? "oklch(0.65 0 0 / 0.6)" : "oklch(0.45 0 0 / 0.6)"}
            strokeWidth={Math.max(vw, vh) / 1400}
        />
    ));
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
            fill={point.segmentIndex === selectedCommandIndex ? "oklch(0.68 0.18 240)" : "oklch(0.63 0 0)"}
            stroke="transparent"
            className={cn(point.movable ? "cursor-pointer" : "cursor-default")}
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

    return targetPoints.map((point) => (
        <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={point.segmentIndex === selectedCommandIndex ? 2.15 : 1.7}
            fill={point.segmentIndex === selectedCommandIndex ? "oklch(0.68 0.2 240)" : "oklch(0.84 0.22 30)"}
            stroke={point.segmentIndex === selectedCommandIndex ? "oklch(1 0 0 / 0.75)" : "transparent"}
            strokeWidth={point.segmentIndex === selectedCommandIndex ? 0.5 : 0}
            className={cn(point.movable ? "cursor-pointer transition-all" : "cursor-default")}
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
    ));
}
