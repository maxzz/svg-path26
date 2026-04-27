import { useSetAtom } from "jotai";
import { cn } from "@/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { doSetCommandValueAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { commandValueTooltip } from "./8-svg-utils";

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

export function CellInputArcFlags(props: CommandArcFlagsProps) {
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

export function CommandFlagToggle(props: {
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

export function getCommandFlagGroupClassName(highlighted?: boolean) {
    return cn(
        "px-0.5 h-5 w-[2.4rem] transition-colors rounded inline-flex items-center justify-center gap-0.5 border",
        highlighted ? "border border-sky-500/60 bg-sky-500/10" : "border bg-background"
    );
}

function getCommandFlagCheckboxClassName() {
    return "h-3 w-3 shrink-0 rounded-[0.2rem] border-muted-foreground/50 bg-background align-middle accent-primary";
}
