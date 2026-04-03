import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";

export function Footer() {
    const { showGrid, darkCanvas, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    return (
        <footer className="px-4 py-2 pr-2 text-xs text-muted-foreground border-t flex items-center justify-between">
            <PathInputSectionStatusInline />
            
            <div className="flex items-center gap-1">
                <TicksToggleInput />
                <button
                    className="px-1 pb-px h-4 text-[10px] border rounded"
                    onClick={() => { appSettings.canvas.showGrid = !showGrid; }}
                    aria-pressed={showGrid}
                    type="button"
                >
                    {showGrid ? "Grid on" : "Grid off"}
                </button>
                <button
                    className="px-1 pb-px h-4 text-[10px] border rounded"
                    onClick={() => { appSettings.canvas.darkCanvas = !darkCanvas; }}
                    aria-pressed={darkCanvas}
                    type="button"
                >
                    {darkCanvas ? "Dark canvas" : "Light canvas"}
                </button>
                <button
                    className="px-1 pb-px h-4 text-[10px] border rounded"
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

function PathInputSectionStatusInline() {
    const error = useAtomValue(parseErrorAtom);
    const commandCount = useAtomValue(commandCountAtom);

    return (
        <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
            {error
                ? (
                    <span className="truncate max-w-[220px] rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        {error}
                    </span>
                ) : (
                    <span className="truncate max-w-[220px] rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                        Path parsed successfully.
                    </span>
                )
            }
            <span className="shrink-0">
                Commands parsed: {commandCount}
            </span>
        </div>
    );
}

function TicksToggleInput() {
    const { showTicks } = useSnapshot(appSettings.canvas);
    const { tickInterval } = useSnapshot(appSettings.pathEditor);

    return (
        <div className="flex items-center 1gap-0.5">
            <input
                className="pl-2 pr-0.5 h-5 w-12 max-w-20 scale-80 text-[10px] text-center rounded border bg-background disabled:opacity-20"
                disabled={!showTicks}
                type="number"
                value={tickInterval}
                min={1}
                step={1}
                aria-label="Tick interval"
                onChange={(event) => {
                    appSettings.pathEditor.tickInterval = Math.max(1, Number(event.target.value) || 1);
                }}
            />
            <button
                className="px-1 pb-px text-[10px] border rounded"
                onClick={() => { appSettings.canvas.showTicks = !showTicks; }}
                aria-pressed={showTicks}
                type="button"
            >
                {showTicks ? "Ticks on" : "Ticks off"}
            </button>
        </div>
    );
}
