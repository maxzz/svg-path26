import { type CommandFlagInputProps } from "./1-9-commands-list-types";
import { getCommandFlagGroupClassName } from "./1-4-row-flag-cell-arc";
import { CommandFlagToggle } from "./1-6-row-flag-toggle";

export function CommandFlagInput(props: CommandFlagInputProps) {
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
