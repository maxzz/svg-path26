import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import {
    canRedoAtom,
    canUndoAtom,
    doClearPathAtom,
    doNormalizePathAtom,
    doSetMinifyAtom,
    doRedoPathAtom,
    doSetAbsoluteAtom,
    doSetRelativeAtom,
    doUndoPathAtom,
    minifyOutputAtom,
    strokeWidthAtom,
    svgPathInputAtom,
    zoomAtom,
} from "@/store/0-atoms/2-svg-path-state";
import {
    appSettings,
    toggleDarkCanvas,
    toggleShowGrid,
    toggleShowHelpers,
} from "@/store/1-ui-settings";

export function Toolbar() {
    const [strokeWidth, setStrokeWidth] = useAtom(strokeWidthAtom);
    const [zoom, setZoom] = useAtom(zoomAtom);
    const minified = useAtomValue(minifyOutputAtom);
    const settings = useSnapshot(appSettings);
    const pathValue = useAtomValue(svgPathInputAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);

    const doUndo = useSetAtom(doUndoPathAtom);
    const doRedo = useSetAtom(doRedoPathAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doClear = useSetAtom(doClearPathAtom);
    const doSetMinify = useSetAtom(doSetMinifyAtom);

    const handleCopy = async () => {
        if (!pathValue) return;
        await navigator.clipboard.writeText(pathValue);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <Button variant={settings.showGrid ? "default" : "outline"} onClick={toggleShowGrid}>
                Grid
            </Button>
            <Button variant={settings.showHelpers ? "default" : "outline"} onClick={toggleShowHelpers}>
                Helpers
            </Button>
            <Button variant={settings.darkCanvas ? "default" : "outline"} onClick={toggleDarkCanvas}>
                Dark Canvas
            </Button>
            <Button variant="outline" onClick={() => doUndo()} disabled={!canUndo}>
                Undo
            </Button>
            <Button variant="outline" onClick={() => doRedo()} disabled={!canRedo}>
                Redo
            </Button>
            <Button variant="outline" onClick={() => doNormalize()}>
                Normalize
            </Button>
            <Button variant="outline" onClick={() => doSetAbsolute()}>
                To Abs
            </Button>
            <Button variant="outline" onClick={() => doSetRelative()}>
                To Rel
            </Button>
            <Button variant={minified ? "default" : "outline"} onClick={() => doSetMinify(!minified)}>
                Minify
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!pathValue}>
                Copy
            </Button>
            <Button variant="outline" onClick={() => doClear()} disabled={!pathValue}>
                Clear
            </Button>

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
