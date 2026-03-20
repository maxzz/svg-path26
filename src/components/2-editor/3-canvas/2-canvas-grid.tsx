import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { canvasUnitsPerPixelAtom } from "../../../store/0-atoms/2-1-canvas-viewport-derives";
import { canvasViewBoxAtom, canvasViewportSizeAtom } from "@/store/0-atoms/2-1-canvas-viewport";

export function CanvasGrid() {
    const { showGrid, showTicks } = useSnapshot(appSettings.canvas);
    const { tickInterval } = useSnapshot(appSettings.pathEditor);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const viewportSize = useAtomValue(canvasViewportSizeAtom);

    if (!showGrid) return null;

    const canvasWidth = viewportSize?.width ?? 0;
    const grid = calcGrid(viewBox, canvasWidth);
    const canvasStroke = unitsPerPixel;

    return (
        <g className="svg-ticks select-none">
            {/* X axis (vertical lines) */}
            {grid.xGrid.map((v) =>
                <line
                    x1={v} x2={v} y1={viewBox[1]} y2={viewBox[1] + viewBox[3]} key={`x${v}`}
                    className={`${v === 0 ? 'stroke-[#f005]' : v % tickInterval === 0 ? 'stroke-[#8888]' : 'stroke-[#8884]'}`}
                    style={{ strokeWidth: canvasStroke }}
                />
            )}
            {/* Y axis (horizontal lines) */}
            {grid.yGrid.map((v) =>
                <line
                    y1={v} y2={v} x1={viewBox[0]} x2={viewBox[0] + viewBox[2]} key={`y${v}`}
                    className={`${v === 0 ? 'stroke-[#f005]' : v % tickInterval === 0 ? 'stroke-[#8888]' : 'stroke-[#8884]'}`}
                    style={{ strokeWidth: canvasStroke }}
                />
            )}

            {showTicks && <>
                {/* X axis numbers */}
                {grid.xGrid.map((v) => <Fragment key={v}>
                    {v % tickInterval === 0 &&
                        <text className="fill-[#744]"
                            y={-5 * canvasStroke}
                            x={v - 5 * canvasStroke}
                            style={{ fontSize: canvasStroke * 10 + 'px', stroke: "white", strokeWidth: canvasStroke * .2 }}
                        >
                            {v}
                        </text>
                    }
                </Fragment>)}
                {/* Y axis numbers */}
                {grid.yGrid.map((v) => <Fragment key={v}>
                    {v % tickInterval === 0 &&
                        <text className="fill-[#744]"
                            x={-5 * canvasStroke}
                            y={v - 5 * canvasStroke}
                            style={{ fontSize: canvasStroke * 10 + 'px', stroke: "white", strokeWidth: canvasStroke * .2 }}
                        >
                            {v}
                        </text>
                    }
                </Fragment>)}
            </>}
        </g>
    );
}

function calcGrid(viewBox: ViewBox, canvasWidth: number) {
    const doGrid = 5 * viewBox[2] <= canvasWidth;
    return {
        xGrid: doGrid ? Array(Math.ceil(viewBox[2]) + 1).fill(null).map((_, i) => Math.floor(viewBox[0]) + i) : [],
        yGrid: doGrid ? Array(Math.ceil(viewBox[3]) + 1).fill(null).map((_, i) => Math.floor(viewBox[1]) + i) : [],
    };
}
