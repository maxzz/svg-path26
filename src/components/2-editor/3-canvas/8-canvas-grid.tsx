import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { canvasUnitsPerPixelAtom } from "../../../store/0-atoms/2-3-canvas-viewport-derives";
import { canvasViewPortAtom, rootSvgElementSizeAtom } from "@/store/0-atoms/2-3-canvas-viewport";

export function CanvasGrid() {
    const { showGrid, showTicks } = useSnapshot(appSettings.canvas);
    const { tickInterval } = useSnapshot(appSettings.pathEditor);
    const viewPort = useAtomValue(canvasViewPortAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const rootSvgElementSize = useAtomValue(rootSvgElementSizeAtom);

    if (!showGrid) return null;

    const canvasWidth = rootSvgElementSize?.width ?? 0;
    const grid = calcGrid(viewPort, canvasWidth);
    const canvasStroke = unitsPerPixel;

    return (
        <g className="svg-ticks select-none" pointerEvents="none">

            {/* X axis (vertical lines) */}
            {grid.xGrid.map((v) =>
                <line
                    x1={v} x2={v} y1={viewPort[1]} y2={viewPort[1] + viewPort[3]} key={`x${v}`}
                    className={`${v === 0 ? 'stroke-[#f005]' : v % tickInterval === 0 ? 'stroke-[#8888]' : 'stroke-[#8884]'}`}
                    style={{ strokeWidth: canvasStroke }}
                />
            )}

            {/* Y axis (horizontal lines) */}
            {grid.yGrid.map((v) =>
                <line
                    y1={v} y2={v} x1={viewPort[0]} x2={viewPort[0] + viewPort[2]} key={`y${v}`}
                    className={`${v === 0 ? 'stroke-[#f005]' : v % tickInterval === 0 ? 'stroke-[#8888]' : 'stroke-[#8884]'}`}
                    style={{ strokeWidth: canvasStroke }}
                />
            )}

            {showTicks && <>

                {/* X axis numbers */}
                {grid.xGrid.map(
                    (v) => (
                        <Fragment key={v}>
                            {v !== 0 && v % tickInterval === 0 &&
                                <text className="fill-[#744]"
                                    y={-5 * canvasStroke}
                                    x={v - 5 * canvasStroke}
                                    style={{ fontSize: canvasStroke * 10 + 'px', stroke: "white", strokeWidth: canvasStroke * .2 }}
                                >
                                    {v}
                                </text>
                            }
                        </Fragment>
                    )
                )}

                {/* Y axis numbers */}
                {grid.yGrid.map(
                    (v) => (
                        <Fragment key={v}>
                            {v % tickInterval === 0 &&
                                <text className="fill-[#744]"
                                    x={5 * canvasStroke}
                                    y={v === 0 ? -5 * canvasStroke : v}
                                    dominantBaseline={v === 0 ? undefined : "middle"}
                                    textAnchor="start"
                                    style={{ fontSize: canvasStroke * 10 + 'px', stroke: "white", strokeWidth: canvasStroke * .2 }}
                                >
                                    {v}
                                </text>
                            }
                        </Fragment>
                    )
                )}

            </>}
        </g>
    );
}

function calcGrid(viewPort: ViewBox, canvasWidth: number) {
    const doGrid = 5 * viewPort[2] <= canvasWidth;
    return {
        xGrid: doGrid ? Array(Math.ceil(viewPort[2]) + 1).fill(null).map((_, i) => Math.floor(viewPort[0]) + i) : [],
        yGrid: doGrid ? Array(Math.ceil(viewPort[3]) + 1).fill(null).map((_, i) => Math.floor(viewPort[1]) + i) : [],
    };
}
