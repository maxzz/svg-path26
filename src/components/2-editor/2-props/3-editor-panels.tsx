import { useAtom, useAtomValue } from "jotai";
import { TransformPanel } from "./5-transform-panel";
import {
    commandRowsAtom,
    parseErrorAtom,
    svgPathInputAtom,
} from "@/store/0-atoms/2-svg-path-state";
import { CanvasActionsMenu } from "./4-canvas-actions-menu";

export function EditorPanels() {
    const error = useAtomValue(parseErrorAtom);
    const rows = useAtomValue(commandRowsAtom);

    return (<>
        <PathInputSection />
        <div className="space-y-4">
            <section className="rounded-lg border p-3">
                <h2 className="mb-2 text-sm font-semibold">Path Status</h2>
                {error ? (
                    <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        {error}
                    </p>
                ) : (
                    <p className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                        Path parsed successfully.
                    </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                    Commands parsed: {rows.length}
                </p>
            </section>

            <TransformPanel />

            <section className="rounded-lg border p-3">
                <h2 className="mb-2 text-sm font-semibold">Commands</h2>
                <div className="max-h-64 space-y-1 overflow-auto rounded border bg-muted/20 p-2 font-mono text-xs">
                    {rows.length === 0 && <p className="text-muted-foreground">No commands to show.</p>}
                    {rows.map((row) => (
                        <div key={row.index} className="rounded bg-background px-2 py-1">
                            <span className="mr-2 text-muted-foreground">{String(row.index + 1).padStart(2, "0")}.</span>
                            <span className="mr-2 font-semibold">{row.command}</span>
                            <span>{row.values.join(" ")}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    </>);
}

function PathInputSection() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom);
    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor="svg-path-input" className="text-xs font-medium">
                    Path input
                </label>
                <CanvasActionsMenu />
            </div>

            <textarea
                id="svg-path-input"
                className="min-h-40 w-full resize-y rounded-md border bg-background p-3 font-mono text-xs outline-ring/50 focus:outline-2"
                value={pathValue}
                onChange={(event) => setPathValue(event.target.value)}
                placeholder="M 10 10 L 100 100"
            />
        </section>
    );
}
