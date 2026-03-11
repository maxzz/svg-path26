import { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { TransformPanel } from "./5-transform-panel";
import {
    commandRowsAtom,
    doConvertSegmentAtom,
    doDeleteSegmentAtom,
    doInsertSegmentAtom,
    doSetCommandValueAtom,
    doToggleSegmentRelativeAtom,
    hoveredCommandIndexAtom,
    svgModelAtom,
    parseErrorAtom,
    selectedCommandIndexAtom,
} from "@/store/0-atoms/2-0-svg-path-state";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-history-input-state";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-3-history-actions";
import { doDeleteImageAtom, doUpdateImageAtom, focusedImageIdAtom, imagesAtom, isImageEditModeAtom } from "@/store/0-atoms/2-2-images";
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
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";

const COMMAND_TYPES = ["M", "L", "V", "H", "C", "S", "Q", "T", "A", "Z"] as const;

export function EditorPanels() {
    const error = useAtomValue(parseErrorAtom);
    const parseState = useAtomValue(svgModelAtom);
    const rows = useAtomValue(commandRowsAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);
    const [selectedCommandIndex, setSelectedCommandIndex] = useAtom(selectedCommandIndexAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
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
                            onMouseEnter={() => setHoveredCommandIndex(row.index)}
                            onMouseLeave={() => setHoveredCommandIndex(null)}
                        >
                            <span className="w-6 shrink-0 text-[10px] text-muted-foreground">
                                {String(row.index + 1).padStart(2, "0")}.
                            </span>

                            <button
                                type="button"
                                className={cn(
                                    "w-4 shrink-0 text-center text-sm font-semibold cursor-pointer",
                                    row.command === row.command.toLowerCase()
                                        ? "text-violet-500"
                                        : "text-orange-500",
                                )}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedCommandIndex(row.index);
                                    doToggleRelative(row.index);
                                }}
                                title="Toggle relative/absolute"
                            >
                                {row.command}
                            </button>

                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
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
                                                    title={commandValueTooltip(row.command, valueIndex)}
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
                                            title={commandValueTooltip(row.command, valueIndex)}
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
                    ))}
                </div>
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
    onCommit,
    onFocus,
    inputRef,
    onArrowMove,
    onArrowVertical,
    title,
}: {
    value: number;
    onCommit: (value: number) => void;
    onFocus: () => void;
    inputRef?: (element: HTMLInputElement | null) => void;
    onArrowMove?: (direction: "left" | "right") => void;
    onArrowVertical?: (direction: "up" | "down") => void;
    title?: string;
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
            ref={inputRef}
            value={draft}
            title={title}
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

function commandValueTooltip(command: string, valueIndex: number): string {
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
    return labels[command]?.[valueIndex] ?? `value ${valueIndex + 1}`;
}
