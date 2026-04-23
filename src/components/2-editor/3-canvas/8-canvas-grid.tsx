import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { canvasUnitsPerPixelAtom } from "../../../store/0-atoms/2-3-canvas-viewport-derives";
import { canvasViewPortAtom, rootSvgElementSizeAtom } from "@/store/0-atoms/2-3-canvas-viewport";

export function CanvasGrid() {
    const { showGrid } = useSnapshot(appSettings.canvas);
    if (!showGrid) return null;
    return (
        <GridBody />
    );
}

export function GridBody() {
    const { showTicks } = useSnapshot(appSettings.canvas);
    const { tickInterval } = useSnapshot(appSettings.pathEditor);

    const viewPort = useAtomValue(canvasViewPortAtom);
    const strokeWidth = useAtomValue(canvasUnitsPerPixelAtom); // unitsPerPixel as stroke width
    const rootSvgElementSize = useAtomValue(rootSvgElementSizeAtom);

    const canvasWidth = rootSvgElementSize?.width ?? 0;
    const gridSteps = calcGridSteps(viewPort, canvasWidth);

    return (
        <g className="svg-ticks select-none" pointerEvents="none">

            {/* X axis (vertical lines) */}
            {gridSteps.xGrid.map(
                (v) => (
                    <line
                        x1={v} x2={v} y1={viewPort[1]} y2={viewPort[1] + viewPort[3]} key={`x${v}`}
                        className={`${v === 0 ? 'stroke-[#f005]' : v % tickInterval === 0 ? 'stroke-[#8888]' : 'stroke-[#8884]'}`}
                        style={{ strokeWidth }}
                    />
                )
            )}

            {/* Y axis (horizontal lines) */}
            {gridSteps.yGrid.map(
                (v) => (
                    <line
                        y1={v} y2={v} x1={viewPort[0]} x2={viewPort[0] + viewPort[2]} key={`y${v}`}
                        className={`${v === 0 ? 'stroke-[#f005]' : v % tickInterval === 0 ? 'stroke-[#8888]' : 'stroke-[#8884]'}`}
                        style={{ strokeWidth }}
                    />
                )
            )}

            {showTicks && (<>

                {/* X axis numbers */}
                {gridSteps.xGrid.map(
                    (v) => (
                        <Fragment key={v}>
                            {v !== 0 && v % tickInterval === 0 &&
                                <text className="fill-[#744]"
                                    y={-5 * strokeWidth}
                                    x={v - 5 * strokeWidth}
                                    style={{ fontSize: strokeWidth * 10 + 'px', stroke: "white", strokeWidth: strokeWidth * .2 }}
                                >
                                    {v}
                                </text>
                            }
                        </Fragment>
                    )
                )}

                {/* Y axis numbers */}
                {gridSteps.yGrid.map(
                    (v) => (
                        <Fragment key={v}>
                            {v % tickInterval === 0 &&
                                <text className="fill-[#744]"
                                    x={-5 * strokeWidth}
                                    y={v === 0 ? -5 * strokeWidth : v}
                                    dominantBaseline={v === 0 ? undefined : "middle"}
                                    textAnchor="end"
                                    style={{ fontSize: strokeWidth * 10 + 'px', stroke: "white", strokeWidth: strokeWidth * .2 }}
                                >
                                    {v}
                                </text>
                            }
                        </Fragment>
                    )
                )}

            </>)}
        </g>
    );
}

function calcGridSteps(viewPort: ViewBox, canvasWidth: number) {
    const doGrid = 5 * viewPort[2] <= canvasWidth;
    return {
        xGrid: doGrid ? Array(Math.ceil(viewPort[2]) + 1).fill(null).map((_, i) => Math.floor(viewPort[0]) + i) : [],
        yGrid: doGrid ? Array(Math.ceil(viewPort[3]) + 1).fill(null).map((_, i) => Math.floor(viewPort[1]) + i) : [],
    };
}
