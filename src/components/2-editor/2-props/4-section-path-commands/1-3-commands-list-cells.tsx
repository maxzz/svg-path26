import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { doSetCommandValueAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { cn } from "@/utils";
import type { CommandProps } from "./1-2-commands-list-row-values";

export function CommandValueInput(props: CommandProps & { tooltip?: string; }) {
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

function getCommandValueInputClassName(highlighted?: boolean) {
    return cn(
        "flex-1 px-px h-5 w-[2.4rem] text-[10px] tracking-tighter text-center rounded transition-colors",
        highlighted
            ? "border border-sky-500/60 bg-sky-500/10"
            : "border bg-background"
    );
}

