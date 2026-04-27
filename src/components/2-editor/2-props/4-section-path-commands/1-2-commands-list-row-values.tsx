import { type SvgCanvasPoint, type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandValueTooltip, isCommandValueLinkedToPoint } from "./8-svg-utils";
import type { CommandProps } from "./1-9-commands-list-types";
import { CommandValueInput } from "./1-3-commands-list-cell-input";
import { CommandArcFlagsInput } from "./1-4-commands-list-flag-cell-arc";
import { CommandFlagInput } from "./1-5-commands-list-flag-cell-input";

type CommandRowValuesProps = {
    row: SvgSegmentSummary;
    highlightedCanvasPoint: SvgCanvasPoint | null;
    focusCommandCell: (nextRowIndex: number, nextValueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};

export function CommandRowValues(props: CommandRowValuesProps) {
    const { row, highlightedCanvasPoint, focusCommandCell, moveVertical, registerFieldRef } = props;

    return row.values.map(
        (value, valueIndex) => {
            if (row.command.toLowerCase() === "a") {
                if (valueIndex === 3) {
                    return null;
                }
                else if (valueIndex === 4) {
                    return (
                        <CommandArcFlagsInput
                            key={`${row.index}:arc-flags`}
                            rowIndex={row.index}
                            rowValueCount={row.values.length}
                            command={row.command}
                            largeArcValue={row.values[3] ?? 0}
                            sweepValue={row.values[4] ?? 0}
                            focusField={focusCommandCell}
                            moveVertical={moveVertical}
                            registerFieldRef={registerFieldRef}
                        />
                    );
                }
            }

            const isLinkedValue = isCommandValueLinkedToPoint(row, valueIndex, highlightedCanvasPoint);
            const inputProps: CommandProps = {
                rowIndex: row.index,
                valueIndex,
                rowValueCount: row.values.length,
                value,
                command: row.command,
                highlighted: isLinkedValue,
                focusField: focusCommandCell,
                moveVertical,
                registerFieldRef,
            };

            return <CommandCellInput key={`${row.index}:${valueIndex}`} {...inputProps} />;
        }
    );
}

function CommandCellInput(props: CommandProps) {
    const tooltip = commandValueTooltip(props.command, props.valueIndex);
    const isArcFlag = props.command.toLowerCase() === "a" && (props.valueIndex === 3 || props.valueIndex === 4);

    if (isArcFlag) {
        return <CommandFlagInput {...props} tooltip={tooltip} />;
    } else {
        return <CommandValueInput {...props} tooltip={tooltip} />;
    }
}
