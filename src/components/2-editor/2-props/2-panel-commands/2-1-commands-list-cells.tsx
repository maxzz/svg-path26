import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { doSetCommandValueAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-2-editor-actions";
import { cn } from "@/utils";
import { commandValueTooltip } from "./8-helpers";

export type CommandProps = {
    rowIndex: number;
    valueIndex: number;
    rowValueCount: number;
    value: number;
    command: string;
    highlighted?: boolean;
    focusField: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};

type CommandArcFlagsProps = {
    rowIndex: number;
    rowValueCount: number;
    command: string;
    largeArcValue: number;
    sweepValue: number;
    focusField: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};

export function CommandCellInput(props: CommandProps) {
    const isArcFlag = props.command.toLowerCase() === "a" && (props.valueIndex === 3 || props.valueIndex === 4);
    const tooltip = commandValueTooltip(props.command, props.valueIndex);

    if (isArcFlag) {
        return <CommandFlagInput {...props} tooltip={tooltip} />;
    }

    return <CommandValueInput {...props} tooltip={tooltip} />;
}

export function CommandArcFlagsInput(props: CommandArcFlagsProps) {
    const { rowIndex, rowValueCount, command, largeArcValue, sweepValue, focusField, moveVertical, registerFieldRef } = props;
    const largeArcTooltip = commandValueTooltip(command, 3);
    const sweepTooltip = commandValueTooltip(command, 4);

    return (
        <div className={getCommandFlagGroupClassName()}>
            <CommandFlagToggle
                rowIndex={rowIndex}
                valueIndex={3}
                rowValueCount={rowValueCount}
                value={largeArcValue}
                tooltip={largeArcTooltip}
                focusField={focusField}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef}
            />
            <CommandFlagToggle
                rowIndex={rowIndex}
                valueIndex={4}
                rowValueCount={rowValueCount}
                value={sweepValue}
                tooltip={sweepTooltip}
                focusField={focusField}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef}
            />
        </div>
    );
}

function CommandValueInput(props: CommandProps & { tooltip?: string; }) {
    const { rowIndex, valueIndex, rowValueCount, value, highlighted, tooltip, focusField, moveVertical, registerFieldRef } = props;

    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);
    const [draft, setDraft] = useState(String(value));

    useEffect(
        () => {
            setDraft(String(value));
        },
        [value]);

    function commit() {
        const parsed = Number.parseFloat(draft);
        if (!Number.isFinite(parsed)) {
            setDraft(String(value));
            return;
        }
        setSelectedCommandIndex(rowIndex);
        setCommandValue({ commandIndex: rowIndex, valueIndex, value: parsed, });
    }

    const input = (
        <input
            type="text"
            inputMode="decimal"
            className={getCommandValueInputClassName(highlighted)}
            ref={(element) => registerFieldRef(rowIndex, valueIndex, element)}
            value={draft}
            onFocus={() => setSelectedCommandIndex(rowIndex)}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={
                (event) => {
                    switch (event.key) {
                        case "Enter":
                            commit();
                            event.currentTarget.blur();
                            break;
                        case "Escape":
                            setDraft(String(value));
                            event.currentTarget.blur();
                            break;
                        case "ArrowLeft":
                            if (event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0) {
                                focusField(rowIndex, Math.max(0, valueIndex - 1));
                                event.preventDefault();
                            }
                            break;
                        case "ArrowRight":
                            if (event.currentTarget.selectionStart === event.currentTarget.value.length && event.currentTarget.selectionEnd === event.currentTarget.value.length) {
                                focusField(rowIndex, Math.min(rowValueCount - 1, valueIndex + 1));
                                event.preventDefault();
                            }
                            break;
                        case "ArrowUp":
                            moveVertical(rowIndex, valueIndex, "up");
                            event.preventDefault();
                            break;
                        case "ArrowDown":
                            moveVertical(rowIndex, valueIndex, "down");
                            event.preventDefault();
                            break;
                        default:
                            break;
                    }
                }
            }
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

function CommandFlagInput(props: CommandProps & { tooltip?: string; }) {
    const { rowIndex, valueIndex, rowValueCount, value, highlighted, tooltip, focusField, moveVertical, registerFieldRef } = props;

    return (
        <div className={getCommandFlagGroupClassName(highlighted)}>
            <CommandFlagToggle
                rowIndex={rowIndex}
                valueIndex={valueIndex}
                rowValueCount={rowValueCount}
                value={value}
                tooltip={tooltip}
                focusField={focusField}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef}
            />
        </div>
    );
}

function CommandFlagToggle(props: {
    rowIndex: number;
    valueIndex: number;
    rowValueCount: number;
    value: number;
    tooltip?: string;
    focusField: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
}) {
    const { rowIndex, valueIndex, rowValueCount, value, tooltip, focusField, moveVertical, registerFieldRef } = props;

    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);

    const input = (
        <input
            type="checkbox"
            className={getCommandFlagCheckboxClassName()}
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
                switch (event.key) {
                    case "ArrowLeft":
                        focusField(rowIndex, Math.max(0, valueIndex - 1));
                        event.preventDefault();
                        break;
                    case "ArrowRight":
                        focusField(rowIndex, Math.min(rowValueCount - 1, valueIndex + 1));
                        event.preventDefault();
                        break;
                    case "ArrowUp":
                        moveVertical(rowIndex, valueIndex, "up");
                        event.preventDefault();
                        break;
                    case "ArrowDown":
                        moveVertical(rowIndex, valueIndex, "down");
                        event.preventDefault();
                        break;
                    default:
                        break;
                }
            }}
            aria-label={valueIndex === 3 ? "large-arc-flag" : "sweep-flag"}
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

function getCommandValueInputClassName(highlighted?: boolean) {
    return cn(
        "flex-1 px-px h-5 w-[2.4rem] text-[10px] tracking-tighter text-center rounded transition-colors",
        highlighted
            ? "border border-sky-500/60 bg-sky-500/10"
            : "border bg-background"
    );
}

function getCommandFlagGroupClassName(highlighted?: boolean) {
    return cn(
        "px-1 h-5 min-w-[2.4rem] transition-colors rounded inline-flex items-center justify-center gap-1 border bg-background",
        highlighted ? "border border-sky-500/60 bg-sky-500/10" : "border bg-background"
    );
}

function getCommandFlagCheckboxClassName() {
    return "h-3.5 w-3.5 rounded border-muted-foreground/40 align-middle";
}
