import { useAtomValue } from "jotai";
import { type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { canvasStrokeWidthAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { canvasPointSelectedAtom, commandHoveredAtom, commandSelectedAtom, hasSelectedCanvasPointsAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { controlPointsAtom, segmentSubPathEnabledAtom } from "@/store/0-atoms/2-0-svg-model";
import { getControlLineStroke } from "./8-canvas-color-palette";

// Lines from path points to their control points

export function CtrlPtToPathPtLines() {
    const controlPoints = useAtomValue(controlPointsAtom);
    const strokeWidth = useAtomValue(canvasStrokeWidthAtom);

    return controlPoints.flatMap(
        (point: SvgCanvasPoint, pointIndex: number) => point.relations.map(
            (relation: Point, relationIndex: number) => (
                <CtrlPtToPathPtLine
                    point={point}
                    relation={relation}
                    strokeWidth={strokeWidth}
                    key={`line:${pointIndex}:${relationIndex}`}
                />
            )
        )
    );
}

function CtrlPtToPathPtLine({ point, relation, strokeWidth }: { point: SvgCanvasPoint; relation: { x: number; y: number; }; strokeWidth: number; }) {
    const segmentEnabled = useAtomValue(segmentSubPathEnabledAtom(point.segmentIndex));
    const hasSelectedCanvasPoints = useAtomValue(hasSelectedCanvasPointsAtom);
    const pointSelected = useAtomValue(canvasPointSelectedAtom(point.id));
    const segmentSelected = useAtomValue(commandSelectedAtom(point.segmentIndex));
    const selected = hasSelectedCanvasPoints ? pointSelected : segmentSelected;
    const hovered = useAtomValue(commandHoveredAtom(point.segmentIndex));

    if (!segmentEnabled) {
        return null;
    }

    return (
        <line
            className={getControlLineStroke(selected, hovered)}
            x1={point.x}
            y1={point.y}
            x2={relation.x}
            y2={relation.y}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 5}`}
            pointerEvents="none"
        />
    );
}
