import { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandSummaryTooltip, commandValueTooltip, isCommandCellLinkedToPoint, isCommandValueLinkedToPoint } from "./8-helpers";
import { commandRowsAtom } from "@/store/0-atoms/2-0-svg-model";
import {
    doSetCommandValueAtom,
    doToggleSegmentRelativeAtom,
    draggedCanvasPointAtom,
    hoveredCanvasPointAtom,
    hoveredCommandIndexAtom,
    selectedCommandIndexAtom,
} from "@/store/0-atoms/2-2-editor-actions";
import { CommandSelectionMenu } from "./2-1-commands-list-row-menu";

const COMMAND_TYPES = ["M", "L", "V", "H", "C", "S", "Q", "T", "A", "Z"] as const;

export function CommandSelectionSection() {
    const rows = useAtomValue(commandRowsAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const [hoveredCommandIndex, setHoveredCommandIndex] = useAtom(hoveredCommandIndexAtom);
    const draggedCanvasPoint = useAtomValue(draggedCanvasPointAtom);
    const hoveredCanvasPoint = useAtomValue(hoveredCanvasPointAtom);
    const doToggleRelative = useSetAtom(doToggleSegmentRelativeAtom);
    const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const highlightedCanvasPoint = draggedCanvasPoint ?? (hoveredCanvasPoint && hoveredCanvasPoint.segmentIndex === hoveredCommandIndex ? hoveredCanvasPoint : null);

    useEffect(
        () => {
            if (selectedCommandIndex === null) return;
            rowRefs.current[selectedCommandIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", });
        },
        [selectedCommandIndex, rows.length]
    );

    function moveVertical(rowIndex: number, valueIndex: number, direction: "up" | "down") {
        const nextRowIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
        if (nextRowIndex < 0 || nextRowIndex >= rows.length) return;

        setSelectedCommandIndex(nextRowIndex);
        focusField(rows, rowRefs.current, fieldRefs.current, nextRowIndex, valueIndex, setSelectedCommandIndex);
    }

    function registerFieldRef(rowIndex: number, valueIndex: number, element: HTMLInputElement | null) {
        fieldRefs.current[`${rowIndex}:${valueIndex}`] = element;
    }

    return (
        <section className="rounded-lg border p-3">
            <h2 className="mb-2 text-sm font-semibold">
                Commands
            </h2>
            <TooltipProvider delayDuration={250}>
                <div className="max-h-64 space-y-1 overflow-auto rounded border bg-muted/20 p-2 font-mono text-xs">
                    {rows.length === 0 && <p className="text-muted-foreground">No commands to show.</p>}
                    {rows.map(
                        (row: SvgSegmentSummary) => {
                            const isCanvasPointFocused = highlightedCanvasPoint?.segmentIndex === row.index;
                            const highlightCommandCell = isCommandCellLinkedToPoint(row, highlightedCanvasPoint);
                            return (
                                <div
                                    key={row.index}
                                    ref={(element) => { rowRefs.current[row.index] = element; }}
                                    className={cn(
                                        "flex items-center gap-2 rounded border px-2 py-1.5 transition-colors",
                                        selectedCommandIndex === row.index
                                            ? "border-sky-500/50 bg-sky-500/10"
                                            : (hoveredCommandIndex === row.index || isCanvasPointFocused)
                                                ? "border-sky-500/25 bg-sky-500/5"
                                                : "border-transparent bg-background hover:bg-muted/40"
                                    )}
                                    onClick={() => setSelectedCommandIndex(row.index)}
                                    onMouseEnter={() => setHoveredCommandIndex(row.index)}
                                    onMouseLeave={() => setHoveredCommandIndex(null)}
                                >
                                    <span className="w-6 shrink-0 text-[10px] text-muted-foreground">
                                        {String(row.index + 1).padStart(2, "0")}.
                                    </span>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "w-4 shrink-0 rounded-sm text-center text-sm font-semibold cursor-pointer transition-colors",
                                                    row.command === row.command.toLowerCase() ? "text-violet-500" : "text-orange-500",
                                                    highlightCommandCell && "bg-sky-500/15 ring-1 ring-sky-500/50"
                                                )}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedCommandIndex(row.index);
                                                    doToggleRelative(row.index);
                                                }}
                                            >
                                                {row.command}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={6} className="max-w-80">
                                            {commandSummaryTooltip(row.command)}
                                        </TooltipContent>
                                    </Tooltip>

                                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                        {row.values.length === 0 && (
                                            <span className="text-[10px] text-muted-foreground">No values</span>
                                        )}

                                        {row.values.map(
                                            (value, valueIndex) => {
                                                const isLinkedValue = isCommandValueLinkedToPoint(row, valueIndex, highlightedCanvasPoint);
                                                const valueTooltip = commandValueTooltip(row.command, valueIndex);
                                                const isArcFlag = row.command.toLowerCase() === "a" && (valueIndex === 3 || valueIndex === 4);
                                                const inputProps = {
                                                    key: `${row.index}:${valueIndex}`,
                                                    rowIndex: row.index,
                                                    valueIndex,
                                                    rowValueCount: row.values.length,
                                                    value,
                                                    highlighted: isLinkedValue,
                                                    tooltip: valueTooltip,
                                                    focusField: (nextRowIndex: number, nextValueIndex: number) => focusField(rows, rowRefs.current, fieldRefs.current, nextRowIndex, nextValueIndex, setSelectedCommandIndex),
                                                    moveVertical,
                                                    registerFieldRef,
                                                };
                                                if (isArcFlag) {
                                                    return (
                                                        <CommandFlagInput {...inputProps} />
                                                    );
                                                } else {
                                                    return (
                                                        <CommandValueInput {...inputProps} />
                                                    );
                                                }
                                            }
                                        )}
                                    </div>

                                    <div className="ml-auto">
                                        <CommandSelectionMenu rowIndex={row.index} command={row.command} />
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </TooltipProvider>
        </section>
    );
}

function CommandValueInput({
    rowIndex,
    valueIndex,
    rowValueCount,
    value,
    highlighted,
    tooltip,
    focusField,
    moveVertical,
    registerFieldRef,
}: {
    rowIndex: number;
    valueIndex: number;
    rowValueCount: number;
    value: number;
    highlighted?: boolean;
    tooltip?: string;
    focusField: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
}) {
    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);
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
        setSelectedCommandIndex(rowIndex);
        setCommandValue({
            commandIndex: rowIndex,
            valueIndex,
            value: parsed,
        });
    };

    const input = (
        <input
            type="text"
            inputMode="decimal"
            className={cn(
                "h-6 w-14 rounded px-1.5 text-center text-[11px] transition-colors",
                highlighted
                    ? "border border-sky-500/60 bg-sky-500/10"
                    : "border bg-background"
            )}
            ref={(element) => registerFieldRef(rowIndex, valueIndex, element)}
            value={draft}
            onFocus={() => setSelectedCommandIndex(rowIndex)}
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
                if (event.key === "ArrowLeft" && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0) {
                    focusField(rowIndex, Math.max(0, valueIndex - 1));
                    event.preventDefault();
                }
                if (event.key === "ArrowRight" && event.currentTarget.selectionStart === event.currentTarget.value.length && event.currentTarget.selectionEnd === event.currentTarget.value.length) {
                    focusField(rowIndex, Math.min(rowValueCount - 1, valueIndex + 1));
                    event.preventDefault();
                }
                if (event.key === "ArrowUp") {
                    moveVertical(rowIndex, valueIndex, "up");
                    event.preventDefault();
                }
                if (event.key === "ArrowDown") {
                    moveVertical(rowIndex, valueIndex, "down");
                    event.preventDefault();
                }
            }}
        />
    );

    if (!tooltip) return input;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{input}</TooltipTrigger>
            <TooltipContent sideOffset={6}>
                {tooltip}
            </TooltipContent>
        </Tooltip>
    );
}

function CommandFlagInput({
    rowIndex,
    valueIndex,
    rowValueCount,
    value,
    highlighted,
    tooltip,
    focusField,
    moveVertical,
    registerFieldRef,
}: {
    rowIndex: number;
    valueIndex: number;
    rowValueCount: number;
    value: number;
    highlighted?: boolean;
    tooltip?: string;
    focusField: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
}) {
    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);

    const input = (
        <label
            className={cn(
                "inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] transition-colors",
                highlighted
                    ? "border border-sky-500/60 bg-sky-500/10"
                    : "border bg-background"
            )}
        >
            <input
                type="checkbox"
                checked={value === 1}
                ref={(element) => registerFieldRef(rowIndex, valueIndex, element)}
                onFocus={() => setSelectedCommandIndex(rowIndex)}
                onChange={(event) => {
                    setSelectedCommandIndex(rowIndex);
                    setCommandValue({
                        commandIndex: rowIndex,
                        valueIndex,
                        value: event.target.checked ? 1 : 0,
                    });
                }}
                onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") {
                        focusField(rowIndex, Math.max(0, valueIndex - 1));
                        event.preventDefault();
                    }
                    if (event.key === "ArrowRight") {
                        focusField(rowIndex, Math.min(rowValueCount - 1, valueIndex + 1));
                        event.preventDefault();
                    }
                    if (event.key === "ArrowUp") {
                        moveVertical(rowIndex, valueIndex, "up");
                        event.preventDefault();
                    }
                    if (event.key === "ArrowDown") {
                        moveVertical(rowIndex, valueIndex, "down");
                        event.preventDefault();
                    }
                }}
            />
            <span className="text-muted-foreground">{valueIndex === 3 ? "laf" : "swp"}</span>
        </label>
    );

    if (!tooltip) return input;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{input}</TooltipTrigger>
            <TooltipContent sideOffset={6}>
                {tooltip}
            </TooltipContent>
        </Tooltip>
    );
}

function focusField(rows: SvgSegmentSummary[], rowRefs: Record<number, HTMLDivElement | null>, fieldRefs: Record<string, HTMLInputElement | null>, rowIndex: number, valueIndex: number, setSelectedCommandIndex: (index: number) => void) {
    const row = rows[rowIndex];
    if (!row) return;

    if (row.values.length === 0) {
        setSelectedCommandIndex(rowIndex);
        rowRefs[rowIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }

    const clampedIndex = Math.min(Math.max(valueIndex, 0), row.values.length - 1);
    const direct = fieldRefs[`${rowIndex}:${clampedIndex}`];
    if (direct) {
        direct.focus();
        return;
    }

    for (let i = clampedIndex - 1; i >= 0; i -= 1) {
        const candidate = fieldRefs[`${rowIndex}:${i}`];
        if (candidate) {
            candidate.focus();
            return;
        }
    }
    for (let i = clampedIndex + 1; i < row.values.length; i += 1) {
        const candidate = fieldRefs[`${rowIndex}:${i}`];
        if (candidate) {
            candidate.focus();
            return;
        }
    }
}
