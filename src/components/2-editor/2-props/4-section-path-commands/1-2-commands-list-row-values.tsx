import { type SvgCanvasPoint, type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import type { CommandProps } from "./1-9-commands-list-types";
import { commandValueTooltip, isCommandValueLinkedToPoint } from "./8-svg-utils";
import { CommandValueInput } from "./1-3-commands-list-cell-input";
import { CellInputArcFlags } from "./1-4-commands-list-flag-cell-arc";
import { CommandFlagInput } from "./1-5-commands-list-flag-cell-input";

type CommandRowValuesProps = {
    row: SvgSegmentSummary;
    highlightedCanvasPoint: SvgCanvasPoint | null;
    focusCommandCell: (nextRowIndex: number, nextValueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};

export function CommandRowValues(props: CommandRowValuesProps) {
    const { row } = props;
    return row.values.map(
        (value, valueIndex) => (
            <RowValue key={`${row.index}:${valueIndex}`} value={value} valueIndex={valueIndex} {...props} />
        )
    );
}

function RowValue(props: { value: number; valueIndex: number; } & CommandRowValuesProps) {
    const { row, value, valueIndex, highlightedCanvasPoint, focusCommandCell, moveVertical, registerFieldRef } = props;

    if (row.command.toLowerCase() === "a") {
        if (valueIndex === 3) {
            return null;
        }
        else if (valueIndex === 4) {
            return (
                <CellInputArcFlags
                    key={`${row.index}:arc-flags`}
                    largeArcValue={row.values[3] ?? 0}
                    sweepValue={row.values[4] ?? 0}
        
                    rowIndex={row.index}
                    rowValueCount={row.values.length}
                    command={row.command}
                    focusField={focusCommandCell}
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
        focusField: focusCommandCell,
        moveVertical,
        registerFieldRef,
    };

    return <CellInput {...inputProps} />;
}

function CellInput(props: CommandProps) {
    const tooltip = commandValueTooltip(props.command, props.valueIndex);
    const isArcFlag = props.command.toLowerCase() === "a" && (props.valueIndex === 3 || props.valueIndex === 4);

    if (isArcFlag) {
        return <CommandFlagInput {...props} tooltip={tooltip} />;
    } else {
        return <CommandValueInput {...props} tooltip={tooltip} />;
    }
}
