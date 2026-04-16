import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canvasStrokeWidthAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";
import { parseErrorAtom, subPathEnabledStatesAtom, subPathsAtom } from "@/store/0-atoms/2-0-svg-model";
import { getCanvasPathClasses, getCanvasPathFillClasses, getCanvasSubPathStrokeClasses } from "./8-canvas-color-palette";

// Main Path Overlay

export function CanvasMainPathOverlay() {
    const { canvasPreview, fillPreview } = useSnapshot(appSettings.canvas);

    const svgPathInput = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const canvasStrokeWidth = useAtomValue(canvasStrokeWidthAtom);
    const subPaths = useAtomValue(subPathsAtom);
    const subPathEnabledStates = useAtomValue(subPathEnabledStatesAtom);
    const pathValue = parseError || !svgPathInput ? "M 0 0" : svgPathInput;
    const hasCompoundSubPaths = subPaths.length > 1;

    if (!hasCompoundSubPaths) {
        return (
            <path
                className={getCanvasPathClasses(canvasPreview, fillPreview)}
                d={pathValue}
                strokeWidth={canvasStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
            />
        );
    }

    return (
        <>
            <path
                className={getCanvasPathFillClasses(canvasPreview, fillPreview)}
                d={pathValue}
                pointerEvents="none"
            />

            {subPaths.map((subPath, index) => {
                const enabled = subPathEnabledStates[index] ?? true;
                return (
                    <path
                        key={`subpath:${subPath.index}`}
                        className={getCanvasSubPathStrokeClasses(canvasPreview, !enabled)}
                        d={subPath.path}
                        strokeWidth={canvasStrokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        pointerEvents="none"
                    />
                );
            })}
        </>
    );
}
