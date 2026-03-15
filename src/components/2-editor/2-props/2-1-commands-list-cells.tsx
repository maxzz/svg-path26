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

export function CommandCellInput(props: CommandProps) {
    const isArcFlag = props.command.toLowerCase() === "a" && (props.valueIndex === 3 || props.valueIndex === 4);
    const tooltip = commandValueTooltip(props.command, props.valueIndex);

    if (isArcFlag) {
        return <CommandFlagInput {...props} tooltip={tooltip} />;
    }

    return <CommandValueInput {...props} tooltip={tooltip} />;
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

function CommandFlagInput(props: CommandProps & { tooltip?: string; }) {
    const { rowIndex, valueIndex, rowValueCount, value, highlighted, tooltip, focusField, moveVertical, registerFieldRef } = props;

    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);

    const input = (
        <label className={getCommandFlagInputClassName(highlighted)}>
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
            <span className="text-muted-foreground">
                {valueIndex === 3 ? "laf" : "swp"}
            </span>
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

function getCommandValueInputClassName(highlighted?: boolean) {
    return cn(
        "h-5 w-[2.4rem] flex-1 rounded px-px text-center text-[10px] tracking-tighter transition-colors",
        highlighted
            ? "border border-sky-500/60 bg-sky-500/10"
            : "border bg-background"
    );
}

function getCommandFlagInputClassName(highlighted?: boolean) {
    return cn(
        "inline-flex items-center gap-0.5 rounded px-0.5 h-5 text-[10px] transition-colors",
        highlighted ? "border border-sky-500/60 bg-sky-500/10" : "border bg-background"
    );
}
