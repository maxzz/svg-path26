import { cn } from "@/utils";
import { commandValueTooltip } from "./8-svg-utils";
import { type CommandArcFlagsProps } from "./1-9-commands-list-types";
import { CommandFlagToggle } from "./1-6-row-flag-toggle";

export function CellInputArcFlags(props: CommandArcFlagsProps) {
    const { rowIndex, rowValueCount, command, largeArcValue, sweepValue, focusCell, moveVertical, registerFieldRef } = props;
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
                focusCell={focusCell}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef}
            />
            <CommandFlagToggle
                rowIndex={rowIndex}
                valueIndex={4}
                rowValueCount={rowValueCount}
                value={sweepValue}
                tooltip={sweepTooltip}
                focusCell={focusCell}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef}
            />
        </div>
    );
}

export function getCommandFlagGroupClassName(highlighted?: boolean) {
    return cn(
        "px-0.5 h-5 w-[2.4rem] transition-colors rounded inline-flex items-center justify-center gap-0.5 border",
        highlighted ? "border border-sky-500/60 bg-sky-500/10" : "border bg-background"
    );
}
