import { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { TransformPanel } from "./5-transform-panel";
import {
    doConvertSegmentAtom,
    doDeleteSegmentAtom,
    doInsertSegmentAtom,
    doSetCommandValueAtom,
    doToggleSegmentRelativeAtom,
    draggedCanvasPointAtom,
    hoveredCanvasPointAtom,
    hoveredCommandIndexAtom,
    selectedCommandIndexAtom,
} from "@/store/0-atoms/2-2-editor-actions";
import { commandRowsAtom, parseErrorAtom, svgModelAtom } from "@/store/0-atoms/2-0-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { doDeleteImageAtom, doUpdateImageAtom, focusedImageIdAtom, imagesAtom, isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { CanvasActionsMenu } from "./4-canvas-actions-menu";
import { cn } from "@/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";
import type { SvgCanvasPoint, SvgSegmentSummary } from "@/svg-core/9-types-svg-model";

const COMMAND_TYPES = ["M", "L", "V", "H", "C", "S", "Q", "T", "A", "Z"] as const;

export function EditorPanels() {
    const error = useAtomValue(parseErrorAtom);
    const parseState = useAtomValue(svgModelAtom);
    const rows = useAtomValue(commandRowsAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const [hoveredCommandIndex, setHoveredCommandIndex] = useAtom(hoveredCommandIndexAtom);
    const draggedCanvasPoint = useAtomValue(draggedCanvasPointAtom);
    const hoveredCanvasPoint = useAtomValue(hoveredCanvasPointAtom);
    const [isImageEditMode] = useAtom(isImageEditModeAtom);
    const images = useAtomValue(imagesAtom);
    const [focusedImageId, setFocusedImageId] = useAtom(focusedImageIdAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);
    const doToggleRelative = useSetAtom(doToggleSegmentRelativeAtom);
    const doDeleteSegment = useSetAtom(doDeleteSegmentAtom);
    const doInsertSegment = useSetAtom(doInsertSegmentAtom);
    const doConvertSegment = useSetAtom(doConvertSegmentAtom);
    const doUndo = useSetAtom(doUndoPathAtom);
    const doRedo = useSetAtom(doRedoPathAtom);
    const doDeleteImage = useSetAtom(doDeleteImageAtom);
    const doUpdateImage = useSetAtom(doUpdateImageAtom);
    const highlightedCanvasPoint = draggedCanvasPoint
        ?? (hoveredCanvasPoint && hoveredCanvasPoint.segmentIndex === hoveredCommandIndex ? hoveredCanvasPoint : null);
    const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (selectedCommandIndex === null) return;
        rowRefs.current[selectedCommandIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }, [selectedCommandIndex, rows.length]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const inInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
            if (event.key === "Escape" && !inInput) {
                setSelectedCommandIndex(null);
                setHoveredCommandIndex(null);
                return;
            }

            const key = event.key.toLowerCase();
            const withCtrl = event.metaKey || event.ctrlKey;
            if (withCtrl && key === "z") {
                event.preventDefault();
                if (event.shiftKey) {
                    if (canRedo) doRedo();
                } else if (canUndo) {
                    doUndo();
                }
                return;
            }

            if (inInput) return;

            if ((event.key === "Backspace" || event.key === "Delete") && selectedCommandIndex !== null) {
                event.preventDefault();
                doDeleteSegment(selectedCommandIndex);
                return;
            }
            if ((event.key === "Backspace" || event.key === "Delete") && focusedImageId) {
                event.preventDefault();
                doDeleteImage(focusedImageId);
                return;
            }

            if (!/^[mlvhcsqtaz]$/i.test(event.key)) return;
            event.preventDefault();

            if (event.shiftKey) {
                if (selectedCommandIndex === null) return;
                const row = rows[selectedCommandIndex];
                if (!row) return;
                if (parseState.model && !parseState.model.canConvert(selectedCommandIndex, key)) return;
                const toType = row.command === row.command.toLowerCase()
                    ? key.toLowerCase()
                    : key.toUpperCase();
                doConvertSegment({ segmentIndex: selectedCommandIndex, type: toType });
                return;
            }

            if (parseState.model && !parseState.model.canInsertAfter(selectedCommandIndex, key)) {
                return;
            }
            doInsertSegment({
                type: key,
                afterIndex: selectedCommandIndex,
            });
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [canRedo, canUndo, doConvertSegment, doDeleteImage, doDeleteSegment, doInsertSegment, doRedo, doUndo, focusedImageId, parseState.model, rows, selectedCommandIndex, setHoveredCommandIndex, setSelectedCommandIndex]);

    const focusField = (rowIndex: number, valueIndex: number) => {
        const row = rows[rowIndex];
        if (!row) return;
        if (row.values.length === 0) {
            setSelectedCommandIndex(rowIndex);
            rowRefs.current[rowIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            return;
        }

        const clampedIndex = Math.min(Math.max(valueIndex, 0), row.values.length - 1);
        const direct = fieldRefs.current[`${rowIndex}:${clampedIndex}`];
        if (direct) {
            direct.focus();
            return;
        }

        for (let i = clampedIndex - 1; i >= 0; i -= 1) {
            const candidate = fieldRefs.current[`${rowIndex}:${i}`];
            if (candidate) {
                candidate.focus();
                return;
            }
        }
        for (let i = clampedIndex + 1; i < row.values.length; i += 1) {
            const candidate = fieldRefs.current[`${rowIndex}:${i}`];
            if (candidate) {
                candidate.focus();
                return;
            }
        }
    };

    const moveVertical = (rowIndex: number, valueIndex: number, direction: "up" | "down") => {
        const nextRowIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
        if (nextRowIndex < 0 || nextRowIndex >= rows.length) return;
        setSelectedCommandIndex(nextRowIndex);
        focusField(nextRowIndex, valueIndex);
    };

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
                <TooltipProvider delayDuration={250}>
                    <div className="max-h-64 space-y-1 overflow-auto rounded border bg-muted/20 p-2 font-mono text-xs">
                        {rows.length === 0 && <p className="text-muted-foreground">No commands to show.</p>}
                        {rows.map((row) => {
                            const isCanvasPointFocused = highlightedCanvasPoint?.segmentIndex === row.index;
                            const highlightCommandCell = isCommandCellLinkedToPoint(row, highlightedCanvasPoint);
                            return (
                                <div
                                    key={row.index}
                                    ref={(element) => {
                                        rowRefs.current[row.index] = element;
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 rounded border px-2 py-1.5 transition-colors",
                                        selectedCommandIndex === row.index
                                            ? "border-sky-500/50 bg-sky-500/10"
                                            : (hoveredCommandIndex === row.index || isCanvasPointFocused)
                                                ? "border-sky-500/25 bg-sky-500/5"
                                                : "border-transparent bg-background hover:bg-muted/40",
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
                                                    row.command === row.command.toLowerCase()
                                                        ? "text-violet-500"
                                                        : "text-orange-500",
                                                    highlightCommandCell && "bg-sky-500/15 ring-1 ring-sky-500/50",
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

                                        {row.values.map((value, valueIndex) => {
                                            const isLinkedValue = isCommandValueLinkedToPoint(row, valueIndex, highlightedCanvasPoint);
                                            const valueTooltip = commandValueTooltip(row.command, valueIndex);
                                            const isArcFlag = row.command.toLowerCase() === "a" && (valueIndex === 3 || valueIndex === 4);
                                            if (isArcFlag) {
                                                return (
                                                    <Tooltip key={`${row.index}:${valueIndex}`}>
                                                        <TooltipTrigger asChild>
                                                            <label
                                                                className={cn(
                                                                    "inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] transition-colors",
                                                                    isLinkedValue
                                                                        ? "border border-sky-500/60 bg-sky-500/10"
                                                                        : "border bg-background",
                                                                )}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={value === 1}
                                                                    ref={(element) => {
                                                                        fieldRefs.current[`${row.index}:${valueIndex}`] = element;
                                                                    }}
                                                                    onFocus={() => setSelectedCommandIndex(row.index)}
                                                                    onChange={(event) => {
                                                                        setSelectedCommandIndex(row.index);
                                                                        setCommandValue({
                                                                            commandIndex: row.index,
                                                                            valueIndex,
                                                                            value: event.target.checked ? 1 : 0,
                                                                        });
                                                                    }}
                                                                    onKeyDown={(event) => {
                                                                        if (event.key === "ArrowLeft") {
                                                                            focusField(row.index, Math.max(0, valueIndex - 1));
                                                                            event.preventDefault();
                                                                        }
                                                                        if (event.key === "ArrowRight") {
                                                                            focusField(row.index, Math.min(row.values.length - 1, valueIndex + 1));
                                                                            event.preventDefault();
                                                                        }
                                                                        if (event.key === "ArrowUp") {
                                                                            moveVertical(row.index, valueIndex, "up");
                                                                            event.preventDefault();
                                                                        }
                                                                        if (event.key === "ArrowDown") {
                                                                            moveVertical(row.index, valueIndex, "down");
                                                                            event.preventDefault();
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-muted-foreground">{valueIndex === 3 ? "laf" : "swp"}</span>
                                                            </label>
                                                        </TooltipTrigger>
                                                        <TooltipContent sideOffset={6}>
                                                            {valueTooltip}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            return (
                                                <CommandValueInput
                                                    key={`${row.index}:${valueIndex}`}
                                                    value={value}
                                                    highlighted={isLinkedValue}
                                                    tooltip={valueTooltip}
                                                    onFocus={() => setSelectedCommandIndex(row.index)}
                                                    onCommit={(nextValue) => {
                                                        setSelectedCommandIndex(row.index);
                                                        setCommandValue({
                                                            commandIndex: row.index,
                                                            valueIndex,
                                                            value: nextValue,
                                                        });
                                                    }}
                                                    inputRef={(element) => {
                                                        fieldRefs.current[`${row.index}:${valueIndex}`] = element;
                                                    }}
                                                    onArrowMove={(direction) => {
                                                        const nextIndex = direction === "left"
                                                            ? Math.max(0, valueIndex - 1)
                                                            : Math.min(row.values.length - 1, valueIndex + 1);
                                                        focusField(row.index, nextIndex);
                                                    }}
                                                    onArrowVertical={(direction) => moveVertical(row.index, valueIndex, direction)}
                                                />
                                            );
                                        })}
                                    </div>

                                    <div className="ml-auto">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <IconRadix_DotsHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                align="end"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Insert After</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        {COMMAND_TYPES.map((type) => (
                                                            <DropdownMenuItem
                                                                key={`insert:${row.index}:${type}`}
                                                                disabled={parseState.model ? !parseState.model.canInsertAfter(row.index, type) : false}
                                                                onSelect={() => doInsertSegment({ type, afterIndex: row.index })}
                                                            >
                                                                <strong className="mr-1">{type}</strong> {commandLabel(type)}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Convert To</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        {COMMAND_TYPES.map((type) => {
                                                            const toType = row.command === row.command.toLowerCase()
                                                                ? type.toLowerCase()
                                                                : type;
                                                            return (
                                                                <DropdownMenuItem
                                                                    key={`convert:${row.index}:${type}`}
                                                                    disabled={parseState.model ? !parseState.model.canConvert(row.index, toType) : false}
                                                                    onSelect={() => doConvertSegment({ segmentIndex: row.index, type: toType })}
                                                                >
                                                                    <strong className="mr-1">{type}</strong> {commandLabel(type)}
                                                                </DropdownMenuItem>
                                                            );
                                                        })}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                <DropdownMenuItem onSelect={() => doToggleRelative(row.index)}>
                                                    {row.command === row.command.toLowerCase() ? "Set Absolute" : "Set Relative"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    disabled={row.index === 0}
                                                    onSelect={() => doDeleteSegment(row.index)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </section>

            {(isImageEditMode || images.length > 0) && (
                <section className="rounded-lg border p-3">
                    <h2 className="mb-2 text-sm font-semibold">Images</h2>
                    <div className="space-y-2">
                        {images.length === 0 && (
                            <p className="text-xs text-muted-foreground">No images loaded.</p>
                        )}
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className={cn(
                                    "rounded border p-2 space-y-2",
                                    focusedImageId === image.id ? "border-sky-500/50 bg-sky-500/10" : "bg-muted/20",
                                )}
                                onClick={() => setFocusedImageId(image.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Image {image.id.slice(-4)}</span>
                                    <Button
                                        variant="outline"
                                        className="ml-auto h-6 px-2 text-xs text-destructive"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            doDeleteImage(image.id);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>

                                <label className="flex items-center justify-between text-xs">
                                    <span>Opacity</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={image.opacity}
                                        onChange={(event) => doUpdateImage({
                                            id: image.id,
                                            patch: { opacity: Number(event.target.value) },
                                        })}
                                    />
                                </label>

                                <label className="flex items-center justify-between text-xs">
                                    <span>Preserve aspect</span>
                                    <input
                                        type="checkbox"
                                        checked={image.preserveAspectRatio}
                                        onChange={(event) => doUpdateImage({
                                            id: image.id,
                                            patch: { preserveAspectRatio: event.target.checked },
                                        })}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                </section>
            )}
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
    highlighted,
    tooltip,
    onCommit,
    onFocus,
    inputRef,
    onArrowMove,
    onArrowVertical,
}: {
    value: number;
    highlighted?: boolean;
    tooltip?: string;
    onCommit: (value: number) => void;
    onFocus: () => void;
    inputRef?: (element: HTMLInputElement | null) => void;
    onArrowMove?: (direction: "left" | "right") => void;
    onArrowVertical?: (direction: "up" | "down") => void;
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

    const input = (
        <input
            type="text"
            inputMode="decimal"
            className={cn(
                "h-6 w-14 rounded px-1.5 text-center text-[11px] transition-colors",
                highlighted
                    ? "border border-sky-500/60 bg-sky-500/10"
                    : "border bg-background",
            )}
            ref={inputRef}
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
                if (event.key === "ArrowLeft" && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0) {
                    onArrowMove?.("left");
                    event.preventDefault();
                }
                if (event.key === "ArrowRight" && event.currentTarget.selectionStart === event.currentTarget.value.length && event.currentTarget.selectionEnd === event.currentTarget.value.length) {
                    onArrowMove?.("right");
                    event.preventDefault();
                }
                if (event.key === "ArrowUp") {
                    onArrowVertical?.("up");
                    event.preventDefault();
                }
                if (event.key === "ArrowDown") {
                    onArrowVertical?.("down");
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

function isCommandCellLinkedToPoint(
    row: SvgSegmentSummary,
    point: SvgCanvasPoint | null,
): boolean {
    if (!point || point.segmentIndex !== row.index || point.kind !== "control") return false;
    const command = row.command.toUpperCase();
    return (
        (command === "S" && point.controlIndex === 0)
        || (command === "T" && point.controlIndex === 0)
    );
}

function isCommandValueLinkedToPoint(
    row: SvgSegmentSummary,
    valueIndex: number,
    point: SvgCanvasPoint | null,
): boolean {
    if (!point || point.segmentIndex !== row.index) return false;
    const command = row.command.toUpperCase();

    if (point.kind === "control") {
        if (command === "C") {
            if (point.controlIndex === 0) {
                return valueIndex === 0 || valueIndex === 1;
            }
            return point.controlIndex === 1 && (valueIndex === 2 || valueIndex === 3);
        }
        if (command === "S" && point.controlIndex === 1) {
            return valueIndex === 0 || valueIndex === 1;
        }
        if (command === "Q" && point.controlIndex === 0) {
            return valueIndex === 0 || valueIndex === 1;
        }
        return false;
    }

    if (command === "Z") return false;
    if (command === "H" || command === "V") return valueIndex === 0;
    if (command === "A") return valueIndex === 5 || valueIndex === 6;
    if (row.values.length === 0) return false;
    if (row.values.length === 1) return valueIndex === 0;
    return valueIndex >= row.values.length - 2;
}

function commandSummaryTooltip(command: string): string {
    const upper = command.toUpperCase();
    const relative = command === command.toLowerCase();
    const modeText = relative ? "Relative coordinates." : "Absolute coordinates.";
    const cells = commandCellNames(command);
    const cellsText = cells.length
        ? `Cells: ${cells.join(", ")}.`
        : "No value cells.";

    switch (upper) {
        case "M":
            return `Move command starts a new subpath at a point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "L":
            return `Line command draws a straight segment to the end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "H":
            return `Horizontal line command changes only X. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "V":
            return `Vertical line command changes only Y. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "C":
            return `Cubic Bezier command with two control points and an end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "S":
            return `Smooth cubic Bezier command; first control is reflected from previous segment. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "Q":
            return `Quadratic Bezier command with one control point and an end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "T":
            return `Smooth quadratic Bezier command; control is reflected from previous segment. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "A":
            return `Arc command draws an elliptical arc to an end point. ${modeText} ${cellsText} Click to toggle abs/rel.`;
        case "Z":
            return "Close command draws a straight segment back to the subpath start. No value cells.";
        default:
            return `${command} command. ${modeText} ${cellsText}`;
    }
}

function commandLabel(type: string): string {
    switch (type) {
        case "M": return "Move";
        case "L": return "Line";
        case "H": return "Horizontal";
        case "V": return "Vertical";
        case "C": return "Cubic";
        case "S": return "Smooth Cubic";
        case "Q": return "Quadratic";
        case "T": return "Smooth Quadratic";
        case "A": return "Arc";
        case "Z": return "Close";
        default: return type;
    }
}

function commandCellNames(command: string): string[] {
    const labels: Record<string, string[]> = {
        M: ["x", "y"],
        m: ["dx", "dy"],
        L: ["x", "y"],
        l: ["dx", "dy"],
        V: ["y"],
        v: ["dy"],
        H: ["x"],
        h: ["dx"],
        C: ["x1", "y1", "x2", "y2", "x", "y"],
        c: ["dx1", "dy1", "dx2", "dy2", "dx", "dy"],
        S: ["x2", "y2", "x", "y"],
        s: ["dx2", "dy2", "dx", "dy"],
        Q: ["x1", "y1", "x", "y"],
        q: ["dx1", "dy1", "dx", "dy"],
        T: ["x", "y"],
        t: ["dx", "dy"],
        A: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
        a: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "dx", "dy"],
    };
    return labels[command] ?? [];
}

function commandValueTooltip(command: string, valueIndex: number): string {
    const relative = command === command.toLowerCase();
    const upper = command.toUpperCase();
    const xName = relative ? "dx" : "x";
    const yName = relative ? "dy" : "y";
    const xText = relative ? "Horizontal offset from previous point." : "Absolute X coordinate.";
    const yText = relative ? "Vertical offset from previous point." : "Absolute Y coordinate.";

    if (upper === "M" || upper === "L") {
        if (valueIndex === 0) return `${xName}: ${xText}`;
        if (valueIndex === 1) return `${yName}: ${yText}`;
    }
    if (upper === "H") return `${xName}: ${xText}`;
    if (upper === "V") return `${yName}: ${yText}`;
    if (upper === "C") {
        if (valueIndex === 0) return relative ? "dx1: First control point horizontal offset." : "x1: First control point X.";
        if (valueIndex === 1) return relative ? "dy1: First control point vertical offset." : "y1: First control point Y.";
        if (valueIndex === 2) return relative ? "dx2: Second control point horizontal offset." : "x2: Second control point X.";
        if (valueIndex === 3) return relative ? "dy2: Second control point vertical offset." : "y2: Second control point Y.";
        if (valueIndex === 4) return `${xName}: End point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 5) return `${yName}: End point ${relative ? "vertical offset." : "Y."}`;
    }
    if (upper === "S") {
        if (valueIndex === 0) return relative ? "dx2: Second control point horizontal offset." : "x2: Second control point X.";
        if (valueIndex === 1) return relative ? "dy2: Second control point vertical offset." : "y2: Second control point Y.";
        if (valueIndex === 2) return `${xName}: End point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 3) return `${yName}: End point ${relative ? "vertical offset." : "Y."}`;
    }
    if (upper === "Q") {
        if (valueIndex === 0) return relative ? "dx1: Control point horizontal offset." : "x1: Control point X.";
        if (valueIndex === 1) return relative ? "dy1: Control point vertical offset." : "y1: Control point Y.";
        if (valueIndex === 2) return `${xName}: End point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 3) return `${yName}: End point ${relative ? "vertical offset." : "Y."}`;
    }
    if (upper === "T") {
        if (valueIndex === 0) return `${xName}: End point ${relative ? "horizontal offset." : "X."} (control is auto-reflected).`;
        if (valueIndex === 1) return `${yName}: End point ${relative ? "vertical offset." : "Y."} (control is auto-reflected).`;
    }
    if (upper === "A") {
        if (valueIndex === 0) return "rx: Ellipse X radius.";
        if (valueIndex === 1) return "ry: Ellipse Y radius.";
        if (valueIndex === 2) return "x-axis-rotation: Arc ellipse rotation angle in degrees.";
        if (valueIndex === 3) return "large-arc-flag: 0 picks smaller arc, 1 picks larger arc.";
        if (valueIndex === 4) return "sweep-flag: 0 draws negative-angle sweep, 1 draws positive-angle sweep.";
        if (valueIndex === 5) return `${xName}: Arc end point ${relative ? "horizontal offset." : "X."}`;
        if (valueIndex === 6) return `${yName}: Arc end point ${relative ? "vertical offset." : "Y."}`;
    }

    return `${commandCellNames(command)[valueIndex] ?? `value ${valueIndex + 1}`}`;
}
