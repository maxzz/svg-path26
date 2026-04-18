import { useAtomValue } from "jotai";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { cn } from "@/utils";
import { type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandHoveredAtom, commandSelectedAtom, highlightedCanvasPointAtomForSegment } from "@/store/0-atoms/2-4-0-editor-actions.ts";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils.ts";
import { CommandSelectionMenu } from "./6-commands-list-row-menu.tsx";
import { type CommandProps, CommandArcFlagsInput, CommandCellInput } from "./2-commands-list-cells.tsx";
import { commandSummaryTooltip, isCommandCellLinkedToPoint, isCommandValueLinkedToPoint } from "./8-svg-utils.tsx";

export function CommandRow(props: {
    row: SvgSegmentSummary;
    setRowRef: (rowIndex: number, element: HTMLDivElement | null) => void;
    doSelectCommand: (args: { index: number; mode: "replace" | "add" | "remove"; }) => void;
    setHoveredCommandIndex: (index: number | null) => void;
    doToggleRelative: (segmentIndex: number) => void;
    focusCommandCell: (nextRowIndex: number, nextValueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
}) {
    const { row, setRowRef, doSelectCommand, setHoveredCommandIndex, doToggleRelative, focusCommandCell, moveVertical, registerFieldRef } = props;
    const selected = useAtomValue(commandSelectedAtom(row.index));
    const hovered = useAtomValue(commandHoveredAtom(row.index));
    const highlightedCanvasPoint = useAtomValue(highlightedCanvasPointAtomForSegment(row.index));
    const isCanvasPointFocused = highlightedCanvasPoint?.segmentIndex === row.index;
    const highlightCommandCell = isCommandCellLinkedToPoint(row, highlightedCanvasPoint);

    return (
        <div
            ref={(element) => { setRowRef(row.index, element); }}
            className={cn(
                "px-1.5 border rounded flex items-center gap-1 transition-colors",
                selected
                    ? "border-transparent bg-blue-300"
                    : (hovered || isCanvasPointFocused)
                        ? "border-transparent bg-slate-400/40"
                        : "border-transparent bg-background hover:bg-slate-400/25"
            )}
            onClick={(event) => doSelectCommand({ index: row.index, mode: getCommandSelectionMode(event) })}
            onMouseEnter={() => setHoveredCommandIndex(row.index)}
            onMouseLeave={() => setHoveredCommandIndex(null)}
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-5 h-5 shrink-0 text-xs leading-3 text-center font-semibold rounded-l-[0.2rem] cursor-pointer transition-colors",
                            row.command === row.command.toLowerCase() ? "bg-slate-400 text-slate-900" : "bg-slate-500 text-slate-900",
                            highlightCommandCell && "ring-1 ring-[#9c00ffa0]"
                        )}
                        onClick={(event) => {
                            event.stopPropagation();
                            doSelectCommand({ index: row.index, mode: "replace" });
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
                        if (row.command.toLowerCase() === "a" && valueIndex === 3) {
                            return null;
                        }

                        if (row.command.toLowerCase() === "a" && valueIndex === 4) {
                            return (
                                <CommandArcFlagsInput
                                    key={`${row.index}:arc-flags`}
                                    rowIndex={row.index}
                                    rowValueCount={row.values.length}
                                    command={row.command}
                                    largeArcValue={row.values[3] ?? 0}
                                    sweepValue={row.values[4] ?? 0}
                                    focusField={focusCommandCell}
                                    moveVertical={moveVertical}
                                    registerFieldRef={registerFieldRef}
                                />
                            );
                        }

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

export function focusField(
    rows: SvgSegmentSummary[],
    rowRefs: Record<number, HTMLDivElement | null>,
    fieldRefs: Record<string, HTMLInputElement | null>,
    rowIndex: number,
    valueIndex: number,
    setSelectedCommandIndex: (index: number) => void
) {
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
