import { useAtomValue, useSetAtom } from "jotai";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { cn } from "@/utils";
import { type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandHoveredAtom, commandSelectedAtom, doSelectCommandAtom, doToggleSegmentRelativeAtom, highlightedCanvasPointAtomForSegment, hoveredCommandIndexAtom } from "@/store/0-atoms/2-4-0-editor-actions.ts";
import { getCommandSelectionMode } from "@/store/0-atoms/2-5-editor-selection-utils.ts";
import { CommandSelectionMenu } from "./6-commands-list-row-menu.tsx";
import { RowValues } from "./1-2-row-values.tsx";
import { commandSummaryTooltip, isCommandCellLinkedToPoint } from "./8-svg-utils.tsx";

export function CommandRow(props: {
    row: SvgSegmentSummary;
    setRowRef: (rowIndex: number, element: HTMLDivElement | null) => void;

    focusCell: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
}) {
    const { row, setRowRef, focusCell, moveVertical, registerFieldRef } = props;

    const doSelectCommand = useSetAtom(doSelectCommandAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const doToggleRelative = useSetAtom(doToggleSegmentRelativeAtom);

    const selected = useAtomValue(commandSelectedAtom(row.index));
    const hovered = useAtomValue(commandHoveredAtom(row.index));
    const highlightedCanvasPoint = useAtomValue(highlightedCanvasPointAtomForSegment(row.index));
    const isCanvasPointFocused = highlightedCanvasPoint?.segmentIndex === row.index;
    const highlightCommandCell = isCommandCellLinkedToPoint(row, highlightedCanvasPoint);

    return (
        <div
            ref={(element) => { setRowRef(row.index, element); }}
            className={getRowClassName(selected, hovered, isCanvasPointFocused)}
            onClick={(event) => doSelectCommand({ index: row.index, mode: getCommandSelectionMode(event) })}
            onMouseEnter={() => setHoveredCommandIndex(row.index)}
            onMouseLeave={() => setHoveredCommandIndex(null)}
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="py-1 flex items-center justify-center">
                        <button
                            className={getRowButtonClassName(row.command === row.command.toLowerCase(), highlightCommandCell)}
                            onClick={(event) => {
                                event.stopPropagation();
                                doSelectCommand({ index: row.index, mode: "replace" });
                                doToggleRelative(row.index);
                            }}
                            type="button"
                        >
                            {row.command}
                        </button>
                    </div>
                </TooltipTrigger>

                <TooltipContent sideOffset={6} className="max-w-80">
                    {commandSummaryTooltip(row.command)}
                </TooltipContent>
            </Tooltip>

            <div className="flex-1 min-w-0 text-right content-center font-mono grid grid-cols-[repeat(auto-fill,2.4rem)] auto-rows-min gap-x-0.5 gap-y-px">
                {row.values.length === 0 && (
                    <span className="col-span-full text-[10px] text-muted-foreground">No values</span>
                )}

                <RowValues
                    row={row}
                    highlightedCanvasPoint={highlightedCanvasPoint}
                    focusCell={focusCell}
                    moveVertical={moveVertical}
                    registerFieldRef={registerFieldRef}
                />
            </div>

            <div className="ml-auto self-center">
                <CommandSelectionMenu rowIndex={row.index} command={row.command} />
            </div>
        </div>
    );
}

function getRowClassName(isSelected: boolean, isHovered: boolean, isCanvasPointFocused: boolean) {
    return cn(
        "px-1.5 border rounded flex items-stretch gap-1 transition-colors",
        isSelected
            ? "border-transparent bg-blue-300"
            : (isHovered || isCanvasPointFocused)
                ? "border-transparent bg-slate-400/40"
                : "border-transparent bg-background hover:bg-slate-400/25"
    );
}
function getRowButtonClassName(isRelative: boolean, isHighlighted: boolean) {
    return cn(
        "shrink-0 self-stretch py-1 w-4 min-h-5 text-xs leading-3 font-semibold border rounded cursor-pointer transition-colors flex items-center justify-center",
        isRelative ? "bg-slate-100 text-slate-900" : "bg-slate-100 text-slate-900",
        isHighlighted && "ring-1 ring-[#9c00ffa0]"
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

//TODO: show relative or absolute points differently in the canvas
