import { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { TransformPanel } from "./5-transform-panel";
import {
    commandRowsAtom,
    doSetCommandValueAtom,
    parseErrorAtom,
    selectedCommandIndexAtom,
    svgPathInputAtom,
} from "@/store/0-atoms/2-svg-path-state";
import { CanvasActionsMenu } from "./4-canvas-actions-menu";
import { cn } from "@/utils";

export function EditorPanels() {
    const error = useAtomValue(parseErrorAtom);
    const rows = useAtomValue(commandRowsAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);
    const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});

    useEffect(() => {
        if (selectedCommandIndex === null) return;
        rowRefs.current[selectedCommandIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }, [selectedCommandIndex, rows.length]);

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
                        <div
                            key={row.index}
                            ref={(element) => {
                                rowRefs.current[row.index] = element;
                            }}
                            className={cn(
                                "flex items-center gap-2 rounded border px-2 py-1.5 transition-colors",
                                selectedCommandIndex === row.index
                                    ? "border-sky-500/50 bg-sky-500/10"
                                    : "border-transparent bg-background hover:bg-muted/40",
                            )}
                            onClick={() => setSelectedCommandIndex(row.index)}
                        >
                            <span className="w-6 shrink-0 text-[10px] text-muted-foreground">
                                {String(row.index + 1).padStart(2, "0")}.
                            </span>

                            <span
                                className={cn(
                                    "w-4 shrink-0 text-center text-sm font-semibold",
                                    row.command === row.command.toLowerCase()
                                        ? "text-violet-500"
                                        : "text-orange-500",
                                )}
                            >
                                {row.command}
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {row.values.length === 0 && (
                                    <span className="text-[10px] text-muted-foreground">No values</span>
                                )}

                                {row.values.map((value, valueIndex) => {
                                    const isArcFlag = row.command.toLowerCase() === "a" && (valueIndex === 3 || valueIndex === 4);
                                    if (isArcFlag) {
                                        return (
                                            <label key={`${row.index}:${valueIndex}`} className="inline-flex items-center gap-1 rounded border bg-background px-1 py-0.5 text-[10px]">
                                                <input
                                                    type="checkbox"
                                                    checked={value === 1}
                                                    onFocus={() => setSelectedCommandIndex(row.index)}
                                                    onChange={(event) => {
                                                        setSelectedCommandIndex(row.index);
                                                        setCommandValue({
                                                            commandIndex: row.index,
                                                            valueIndex,
                                                            value: event.target.checked ? 1 : 0,
                                                        });
                                                    }}
                                                />
                                                <span className="text-muted-foreground">{valueIndex === 3 ? "laf" : "swp"}</span>
                                            </label>
                                        );
                                    }

                                    return (
                                        <CommandValueInput
                                            key={`${row.index}:${valueIndex}`}
                                            value={value}
                                            onFocus={() => setSelectedCommandIndex(row.index)}
                                            onCommit={(nextValue) => {
                                                setSelectedCommandIndex(row.index);
                                                setCommandValue({
                                                    commandIndex: row.index,
                                                    valueIndex,
                                                    value: nextValue,
                                                });
                                            }}
                                        />
                                    );
                                })}
                            </div>
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

function CommandValueInput({
    value,
    onCommit,
    onFocus,
}: {
    value: number;
    onCommit: (value: number) => void;
    onFocus: () => void;
}) {
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    const commit = () => {
        const parsed = Number.parseFloat(draft);
        if (!Number.isFinite(parsed)) {
            setDraft(String(value));
            return;
        }
        onCommit(parsed);
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            className="h-6 w-14 rounded border bg-background px-1.5 text-center text-[11px]"
            value={draft}
            onFocus={onFocus}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    commit();
                    event.currentTarget.blur();
                    return;
                }
                if (event.key === "Escape") {
                    setDraft(String(value));
                    event.currentTarget.blur();
                }
            }}
        />
    );
}
