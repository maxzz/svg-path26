import { useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel.tsx";
import { commandSummaryTooltip, isCommandCellLinkedToPoint, isCommandValueLinkedToPoint } from "./8-helpers.tsx";
import { type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandRowsAtom } from "@/store/0-atoms/2-0-svg-model";
import { CommandSelectionMenu } from "./2-2-commands-list-row-menu.tsx";
import { doToggleSegmentRelativeAtom, draggedCanvasPointAtom, hoveredCanvasPointAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { type CommandProps, CommandCellInput } from "./2-1-commands-list-cells.tsx";

export function CommandsListPanel() {
    return (
        <SectionPanel sectionKey="commands" label="Path Commands" contentClassName="px-0 pt-0.5 pb-4">
            <div className="px-1 py-2 max-h-64 text-xs font-ui border bg-muted/20 rounded overflow-auto">
                <CommandsList />
            </div>
        </SectionPanel>
    );
}

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
        [selectedCommandIndex, rows.length]);

    function moveVertical(rowIndex: number, valueIndex: number, direction: "up" | "down") {
        const nextRowIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
        if (nextRowIndex < 0 || nextRowIndex >= rows.length) return;

        setSelectedCommandIndex(nextRowIndex);
        focusCommandCell(nextRowIndex, valueIndex);
    }

    function focusCommandCell(nextRowIndex: number, nextValueIndex: number) {
        focusField(rows, rowRefs.current, fieldRefs.current, nextRowIndex, nextValueIndex, setSelectedCommandIndex);
    }

    function registerFieldRef(rowIndex: number, valueIndex: number, element: HTMLInputElement | null) {
        fieldRefs.current[`${rowIndex}:${valueIndex}`] = element;
    }

    if (rows.length === 0) {
        return <p className="text-muted-foreground">No commands to show.</p>;
    }

    return (
        <TooltipProvider delayDuration={250}>
            {rows.map(
                (row: SvgSegmentSummary) => {
                    const isCanvasPointFocused = highlightedCanvasPoint?.segmentIndex === row.index;
                    const highlightCommandCell = isCommandCellLinkedToPoint(row, highlightedCanvasPoint);
                    return (
                        <div
                            key={row.index}
                            ref={(element) => { rowRefs.current[row.index] = element; }}
                            className={cn(
                                "px-1.5 border rounded flex items-center gap-1 transition-colors",
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
                            {/* <span className="w-6 shrink-0 text-[10px] text-muted-foreground">
                                {String(row.index + 1).padStart(2, "0")}.
                            </span> */}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-5 h-5 shrink-0 text-xs leading-3 text-center font-semibold rounded-l-[0.2rem] cursor-pointer transition-colors",
                                            row.command === row.command.toLowerCase() ? "bg-muted-foreground/20 text-violet-500" : "bg-muted-foreground/30 text-orange-500",
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

                            <div className="min-w-0 font-mono text-right flex items-center flex-wrap gap-0.5">
                                {row.values.length === 0 && (
                                    <span className="text-[10px] text-muted-foreground">No values</span>
                                )}

                                {row.values.map(
                                    (value, valueIndex) => {
                                        const isLinkedValue = isCommandValueLinkedToPoint(row, valueIndex, highlightedCanvasPoint);
                                        const inputProps: CommandProps = {
                                            rowIndex: row.index,
                                            valueIndex,
                                            rowValueCount: row.values.length,
                                            value,
                                            command: row.command,
                                            highlighted: isLinkedValue,
                                            focusField: focusCommandCell,
                                            moveVertical,
                                            registerFieldRef,
                                        };
                                        return <CommandCellInput key={`${row.index}:${valueIndex}`} {...inputProps} />;
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
        </TooltipProvider>
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
