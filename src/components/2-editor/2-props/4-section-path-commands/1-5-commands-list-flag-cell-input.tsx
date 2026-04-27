import { CommandFlagToggle, getCommandFlagGroupClassName } from "./1-4-commands-list-flag-cell-arc";

type CommandFlagInputProps = {
    rowIndex: number;
    valueIndex: number;
    rowValueCount: number;
    value: number;
    highlighted?: boolean;
    tooltip?: string;
    focusField: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};

export function CommandFlagInput(props: CommandFlagInputProps) {
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
