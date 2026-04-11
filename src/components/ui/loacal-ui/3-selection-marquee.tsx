import { useAtomValue } from "jotai";
import { canvasUnitsPerPixelAtom } from "../../../store/0-atoms/2-3-canvas-viewport-derives";
import { canvasDragStateAtom } from "../../2-editor/3-canvas/3-canvas-drag";

export function CanvasSelectionMarquee() {
    const dragState = useAtomValue(canvasDragStateAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);

    if (dragState?.mode !== "marquee" || !dragState.moved) {
        return null;
    }

    const x = Math.min(dragState.start.x, dragState.current.x);
    const y = Math.min(dragState.start.y, dragState.current.y);
    const width = Math.abs(dragState.current.x - dragState.start.x);
    const height = Math.abs(dragState.current.y - dragState.start.y);
    const strokeWidth = Math.max(unitsPerPixel * 1.5, unitsPerPixel);
    const dash = unitsPerPixel * 6;

    return (
        <g pointerEvents="none">
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                className="fill-[#3b82f61a] stroke-black dark:fill-[#94a3b81f] dark:stroke-white"
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${dash}`}
            >
                <animate attributeName="stroke-dashoffset" from="0" to={`${dash * 2}`} dur="0.85s" repeatCount="indefinite" />
            </rect>

            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                className="fill-none stroke-white dark:stroke-black"
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${dash}`}
                strokeDashoffset={dash}
            >
                <animate attributeName="stroke-dashoffset" from={`${dash}`} to={`${dash * 3}`} dur="0.85s" repeatCount="indefinite" />
            </rect>
        </g>
    );
}
