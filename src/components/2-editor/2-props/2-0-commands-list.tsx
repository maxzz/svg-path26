import { useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { commandSummaryTooltip, commandValueTooltip, isCommandCellLinkedToPoint, isCommandValueLinkedToPoint } from "./8-helpers";
import { type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandRowsAtom } from "@/store/0-atoms/2-0-svg-model";
import { CommandSelectionMenu } from "./2-2-commands-list-row-menu.tsx";
import { doToggleSegmentRelativeAtom, draggedCanvasPointAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { CommandFlagInput, CommandValueInput, type CommandProps } from "./2-1-commands-list-cells.tsx";

export function CommandsList() {
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
                                                const inputProps: CommandProps = {
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
                                                        <CommandFlagInput key={`${row.index}:${valueIndex}`} {...inputProps} />
                                                    );
                                                } else {
                                                    return (
                                                        <CommandValueInput key={`${row.index}:${valueIndex}`} {...inputProps} />
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
