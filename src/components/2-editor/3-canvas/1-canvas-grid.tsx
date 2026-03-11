import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { canvasUnitsPerPixelAtom } from "./5-canvas-viewport-metrics";
import {
    showTicksAtom,
    tickIntervalAtom,
    viewPortXAtom,
    viewPortYAtom,
} from "@/store/0-atoms/2-0-svg-model-state";
import { canvasViewBoxAtom } from "@/store/0-atoms/2-3-canvas-viewbox-actions";

type GridValues = ReturnType<typeof buildGrid>;

export function CanvasGrid() {
    const settings = useSnapshot(appSettings);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const viewPortX = useAtomValue(viewPortXAtom);
    const viewPortY = useAtomValue(viewPortYAtom);
    const showTicks = useAtomValue(showTicksAtom);
    const tickInterval = useAtomValue(tickIntervalAtom);

    if (!settings.showGrid) return null;

    const [vx, vy, vw, vh] = viewBox;
    const grid = useMemo(() => buildGrid(vx, vy, vw, vh), [vx, vy, vw, vh]);

    return (
        <>
            <CanvasGridLines
                grid={grid}
                showTicks={showTicks}
                tickInterval={tickInterval}
                unitsPerPixel={unitsPerPixel}
                vx={vx}
                vy={vy}
                vw={vw}
                vh={vh}
            />
            {showTicks && (
                <CanvasGridTicks
                    darkCanvas={settings.darkCanvas}
                    grid={grid}
                    tickInterval={tickInterval}
                    unitsPerPixel={unitsPerPixel}
                    viewPortX={viewPortX}
                    viewPortY={viewPortY}
                />
            )}
        </>
    );
}

function CanvasGridLines({
    grid,
    showTicks,
    tickInterval,
    unitsPerPixel,
    vx,
    vy,
    vw,
    vh,
}: {
    grid: GridValues;
    showTicks: boolean;
    tickInterval: number;
    unitsPerPixel: number;
    vx: number;
    vy: number;
    vw: number;
    vh: number;
}) {
    const gridStrokeWidth = unitsPerPixel;
    const axisStrokeWidth = unitsPerPixel * 4;

    return (
        <>
            {grid.xValues.map((x) => (
                <line
                    key={`gx:${x}`}
                    x1={x}
                    y1={vy}
                    x2={x}
                    y2={vy + vh}
                    stroke={showTicks && isTick(x, tickInterval) ? "oklch(0.45 0 0 / 0.55)" : "oklch(0.45 0 0 / 0.35)"}
                    strokeWidth={gridStrokeWidth}
                />
            ))}
            {grid.yValues.map((y) => (
                <line
                    key={`gy:${y}`}
                    x1={vx}
                    y1={y}
                    x2={vx + vw}
                    y2={y}
                    stroke={showTicks && isTick(y, tickInterval) ? "oklch(0.45 0 0 / 0.55)" : "oklch(0.45 0 0 / 0.35)"}
                    strokeWidth={gridStrokeWidth}
                />
            ))}
            <line
                x1={0}
                y1={vy}
                x2={0}
                y2={vy + vh}
                stroke="oklch(0.7 0 0 / 0.7)"
                strokeWidth={axisStrokeWidth}
            />
            <line
                x1={vx}
                y1={0}
                x2={vx + vw}
                y2={0}
                stroke="oklch(0.7 0 0 / 0.7)"
                strokeWidth={axisStrokeWidth}
            />
        </>
    );
}

function CanvasGridTicks({
    darkCanvas,
    grid,
    tickInterval,
    unitsPerPixel,
    viewPortX,
    viewPortY,
}: {
    darkCanvas: boolean;
    grid: GridValues;
    tickInterval: number;
    unitsPerPixel: number;
    viewPortX: number;
    viewPortY: number;
}) {
    const fontSize = unitsPerPixel * 14;
    const fill = darkCanvas ? "oklch(0.7 0 0)" : "oklch(0.5 0 0)";

    return (
        <>
            {grid.xValues.filter((x) => x !== 0 && isTick(x, tickInterval)).map((x) => (
                <text
                    key={`tx:${x}`}
                    x={x}
                    y={viewPortY + unitsPerPixel * 14}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fill={fill}
                    style={{ userSelect: "none" }}
                >
                    {formatTick(x)}
                </text>
            ))}
            {grid.yValues.filter((y) => y !== 0 && isTick(y, tickInterval)).map((y) => (
                <text
                    key={`ty:${y}`}
                    x={viewPortX + unitsPerPixel * 8}
                    y={y}
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fill={fill}
                    style={{ userSelect: "none" }}
                >
                    {formatTick(y)}
                </text>
            ))}
        </>
    );
}

function buildGrid(x: number, y: number, width: number, height: number): { xValues: number[]; yValues: number[]; } {
    const base = Math.max(width, height) / 16;
    const step = niceStep(base);
    const xStart = Math.floor(x / step) * step;
    const yStart = Math.floor(y / step) * step;

    const xValues: number[] = [];
    for (let value = xStart; value <= x + width + step * 0.5; value += step) {
        xValues.push(Number.parseFloat(value.toFixed(6)));
    }

    const yValues: number[] = [];
    for (let value = yStart; value <= y + height + step * 0.5; value += step) {
        yValues.push(Number.parseFloat(value.toFixed(6)));
    }

    return { xValues, yValues };
}

function niceStep(input: number): number {
    if (!Number.isFinite(input) || input <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(input));
    const normalized = input / power;
    if (normalized <= 1) return power;
    if (normalized <= 2) return 2 * power;
    if (normalized <= 5) return 5 * power;
    return 10 * power;
}

function isTick(value: number, interval: number): boolean {
    const safe = Math.max(1, Math.floor(interval));
    return Math.round(value / safe) * safe === Math.round(value);
}

function formatTick(value: number): string {
    if (Math.abs(value) >= 1000) return value.toFixed(0);
    if (Math.abs(value) >= 100) return value.toFixed(1);
    if (Math.abs(value) >= 1) return value.toFixed(2).replace(/\.?0+$/, "");
    return value.toFixed(3).replace(/\.?0+$/, "");
}