import { type CommandProps, type CommandRowValuesProps } from "./1-9-commands-list-types";
import { CellInput, CellArcFlagsInput } from "./1-3-row-cells";
import { isCommandValueLinkedToPoint } from "./8-svg-utils";

export function RowValues(props: CommandRowValuesProps) {
    const { row } = props;
    const groups = getValueCellGroups(row);

    return groups.map(
        (group) => {
            switch (group.type) {
                case CellGroup.Pair:
                    return (
                        <div key={group.key} className="col-span-2 grid grid-cols-2 gap-0.5">
                            {group.indices.map((index) => (
                                <RowValue
                                    key={`${row.index}:${index}`}
                                    value={row.values[index]}
                                    valueIndex={index}
                                    {...props}
                                />
                            ))}
                        </div>
                    );
                case CellGroup.Single:
                    return (
                        <RowValue
                            key={group.key}
                            value={row.values[group.index]}
                            valueIndex={group.index}
                            {...props}
                        />
                    );
                case CellGroup.ArcFlags:
                    return (
                        <CellArcFlagsInput
                            key={group.key}
                            largeArcValue={row.values[3] ?? 0}
                            sweepValue={row.values[4] ?? 0}
                            rowIndex={row.index}
                            rowValueCount={row.values.length}
                            command={row.command}
                            focusCell={props.focusCell}
                            moveVertical={props.moveVertical}
                            registerFieldRef={props.registerFieldRef}
                        />
                    );
                default:
                    return null;
            }
        }
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

// Value groups are used to determine the layout of the values in the row
//type CellGroup = typeof CellGroup[keyof typeof CellGroup];

const CellGroup = { Pair: 0, Single: 1, ArcFlags: 2, } as const;

type ValueCellGroup =
    | { type: typeof CellGroup.Pair; indices: [number, number]; key: string; }
    | { type: typeof CellGroup.Single; index: number; key: string; }
    | { type: typeof CellGroup.ArcFlags; key: string; };

function getValueCellGroups(row: CommandRowValuesProps["row"]): ValueCellGroup[] {
    const { values: { length }, index } = row;
    const groups: ValueCellGroup[] = [];

    const upper = row.command.toUpperCase();
    if (upper === "A") {
        if (length >= 2) {
            groups.push({ type: CellGroup.Pair, indices: [0, 1], key: `${index}:pair-0` });
        }
        else if (length === 1) {
            groups.push({ type: CellGroup.Single, index: 0, key: `${index}:single-0` });
        }
        if (length >= 3) {
            groups.push({ type: CellGroup.Single, index: 2, key: `${index}:single-2` });
        }
        if (length >= 5) {
            groups.push({ type: CellGroup.ArcFlags, key: `${index}:arc-flags` });
        }
        if (length >= 7) {
            groups.push({ type: CellGroup.Pair, indices: [5, 6], key: `${index}:pair-5` });
        }
        else if (length === 6) {
            groups.push({ type: CellGroup.Single, index: 5, key: `${index}:single-5` });
        }
    } else {
        for (let i = 0; i < length; i += 2) {
            if (i + 1 < length) {
                groups.push({ type: CellGroup.Pair, indices: [i, i + 1], key: `${index}:pair-${i}` });
            }
            else {
                groups.push({ type: CellGroup.Single, index: i, key: `${index}:single-${i}` });
            }
        }
    }
    return groups;
}
