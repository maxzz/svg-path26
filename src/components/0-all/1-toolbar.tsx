import { useAtom } from "jotai";
import { ToolbarUndoRedo } from "./2-toolbar-undo-redo";
import {
    strokeWidthAtom,
    zoomAtom,
} from "@/store/0-atoms/2-svg-path-state";

export function Toolbar() {
    const [strokeWidth, setStrokeWidth] = useAtom(strokeWidthAtom);
    const [zoom, setZoom] = useAtom(zoomAtom);

    return (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <ToolbarUndoRedo />

            <label className="ml-4 flex items-center gap-2 text-sm">
                Stroke
                <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={strokeWidth}
                    onChange={(event) => setStrokeWidth(Number(event.target.value))}
                />
                <span className="w-8 text-right tabular-nums">{strokeWidth}</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
                Zoom
                <input
                    type="range"
                    min={0.5}
                    max={4}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                />
                <span className="w-12 text-right tabular-nums">{zoom.toFixed(1)}x</span>
            </label>
        </div>
    );
}
