import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { commandCountAtom } from "@/store/0-atoms/2-0-svg-model";

export function Footer() {
    const commandCount = useAtomValue(commandCountAtom);
    const { showGrid, darkCanvas, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    return (
        <footer className="px-4 py-2 pr-2 text-xs text-muted-foreground border-t flex items-center justify-between">
            <span>Commands: {commandCount}</span>
            
            <div className="flex items-center gap-1">
                <button
                    className="px-1 pb-px text-[10px] border rounded"
                    onClick={() => { appSettings.canvas.darkCanvas = !darkCanvas; }}
                    aria-pressed={darkCanvas}
                    type="button"
                >
                    {darkCanvas ? "Dark canvas" : "Light canvas"}
                </button>
                <button
                    className="px-1 pb-px text-[10px] border rounded"
                    onClick={() => { appSettings.canvas.showGrid = !showGrid; }}
                    aria-pressed={showGrid}
                    type="button"
                >
                    {showGrid ? "Grid on" : "Grid off"}
                </button>
                <button
                    className="px-1 pb-px text-[10px] border rounded"
                    onClick={() => { appSettings.canvas.showViewBoxFrame = !showViewBoxFrame; }}
                    aria-pressed={showViewBoxFrame}
                    type="button"
                >
                    {showViewBoxFrame ? "viewBox frame on" : "viewBox frame off"}
                </button>
            </div>
        </footer>
    );
}
