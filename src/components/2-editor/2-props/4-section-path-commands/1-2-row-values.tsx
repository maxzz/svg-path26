import { type CommandProps, type CommandRowValuesProps } from "./1-9-commands-list-types";
import { CellInput, CellArcFlagsInput } from "./1-3-row-cells";
import { isCommandValueLinkedToPoint } from "./8-svg-utils";

export function RowValues(props: CommandRowValuesProps) {
    const { row } = props;
    return row.values.map(
        (value, valueIndex) => (
            <RowValue key={`${row.index}:${valueIndex}`} value={value} valueIndex={valueIndex} {...props} />
        )
    );
}

function RowValue(props: { value: number; valueIndex: number; } & CommandRowValuesProps) {
    const { row, value, valueIndex, highlightedCanvasPoint, focusCell, moveVertical, registerFieldRef } = props;

    if (row.command.toLowerCase() === "a") {
        if (valueIndex === 3) {
            return null;
        }
        else if (valueIndex === 4) {
            return (
                <CellArcFlagsInput
                    key={`${row.index}:arc-flags`}
                    largeArcValue={row.values[3] ?? 0}
                    sweepValue={row.values[4] ?? 0}
        
                    rowIndex={row.index}
                    rowValueCount={row.values.length}
                    command={row.command}
                    focusCell={focusCell}
                    moveVertical={moveVertical}
                    registerFieldRef={registerFieldRef}
                />
            );
        }
    }

    const isLinkedValue = isCommandValueLinkedToPoint(row, valueIndex, highlightedCanvasPoint);
    const inputProps: CommandProps = {
        value,
        valueIndex,
        highlighted: isLinkedValue,

        rowIndex: row.index,
        rowValueCount: row.values.length,
        command: row.command,
        focusCell,
        moveVertical,
        registerFieldRef,
    };

    return <CellInput {...inputProps} />;
}
