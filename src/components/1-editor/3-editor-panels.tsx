import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { Button } from "@/components/ui/shadcn/button"
import {
    commandRowsAtom,
    decimalsAtom,
    doApplyScaleAtom,
    doApplyTranslateAtom,
    parseErrorAtom,
    scaleXAtom,
    scaleYAtom,
    translateXAtom,
    translateYAtom,
} from "@/store/2-svg-path-state"

export function EditorPanels() {
    const error = useAtomValue(parseErrorAtom)
    const rows = useAtomValue(commandRowsAtom)

    const [scaleX, setScaleX] = useAtom(scaleXAtom)
    const [scaleY, setScaleY] = useAtom(scaleYAtom)
    const [translateX, setTranslateX] = useAtom(translateXAtom)
    const [translateY, setTranslateY] = useAtom(translateYAtom)
    const [decimals, setDecimals] = useAtom(decimalsAtom)

    const applyScale = useSetAtom(doApplyScaleAtom)
    const applyTranslate = useSetAtom(doApplyTranslateAtom)

    return (
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

            <section className="rounded-lg border p-3">
                <h2 className="mb-2 text-sm font-semibold">Transform</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="space-y-1">
                        <span>Scale X</span>
                        <input
                            className="w-full rounded border bg-background px-2 py-1"
                            type="number"
                            step="0.1"
                            value={scaleX}
                            onChange={(event) => setScaleX(Number(event.target.value))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span>Scale Y</span>
                        <input
                            className="w-full rounded border bg-background px-2 py-1"
                            type="number"
                            step="0.1"
                            value={scaleY}
                            onChange={(event) => setScaleY(Number(event.target.value))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span>Translate X</span>
                        <input
                            className="w-full rounded border bg-background px-2 py-1"
                            type="number"
                            step="1"
                            value={translateX}
                            onChange={(event) => setTranslateX(Number(event.target.value))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span>Translate Y</span>
                        <input
                            className="w-full rounded border bg-background px-2 py-1"
                            type="number"
                            step="1"
                            value={translateY}
                            onChange={(event) => setTranslateY(Number(event.target.value))}
                        />
                    </label>
                    <label className="col-span-2 space-y-1">
                        <span>Precision (decimals)</span>
                        <input
                            className="w-full rounded border bg-background px-2 py-1"
                            type="number"
                            min={0}
                            max={8}
                            step={1}
                            value={decimals}
                            onChange={(event) => setDecimals(Number(event.target.value))}
                        />
                    </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => applyScale()}>
                        Apply Scale
                    </Button>
                    <Button variant="outline" onClick={() => applyTranslate()}>
                        Apply Translate
                    </Button>
                </div>
            </section>

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
    )
}
