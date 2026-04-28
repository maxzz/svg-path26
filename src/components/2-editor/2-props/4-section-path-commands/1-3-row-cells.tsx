import { cn } from "@/utils";
import { commandValueTooltip } from "./8-svg-utils";
import { CellValueInput } from "./1-4-row-cell-input";
import { type CommandArcFlagsProps, type CommandFlagInputProps, type CommandProps } from "./1-9-commands-list-types";
import { CommandFlagToggle } from "./1-5-row-flag-toggle";

export function CellInput(props: CommandProps) {
    const tooltip = commandValueTooltip(props.command, props.valueIndex);
    const isArcFlag = props.command.toLowerCase() === "a" && (props.valueIndex === 3 || props.valueIndex === 4);

    if (isArcFlag) {
        return <CellFlagInput {...props} tooltip={tooltip} />;
    }

    return <CellValueInput {...props} tooltip={tooltip} />;
}

function CellFlagInput(props: CommandFlagInputProps) {
    const { rowIndex, valueIndex, rowValueCount, value, highlighted, tooltip, focusCell, moveVertical, registerFieldRef } = props;

    return (
        <div className={getCommandFlagGroupClassName(highlighted)}>
            <CommandFlagToggle
                rowIndex={rowIndex}
                valueIndex={valueIndex}
                rowValueCount={rowValueCount}
                value={value}
                tooltip={tooltip}

                focusCell={focusCell}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef}
            />
        </div>
    );
}

export function CellArcFlagsInput(props: CommandArcFlagsProps) {
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

function getCommandFlagGroupClassName(highlighted?: boolean) {
    return cn(
        "px-0.5 h-5 w-full min-w-0 transition-colors rounded inline-flex items-center justify-center gap-0.5 border",
        highlighted ? "border border-sky-500/60 bg-sky-500/10" : "border bg-background"
    );
}
