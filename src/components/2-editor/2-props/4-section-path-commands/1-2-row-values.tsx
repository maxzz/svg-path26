import { type CommandProps, type CommandRowValuesProps } from "./1-9-commands-list-types";
import { CellInput, CellArcFlagsInput } from "./1-3-row-cells";
import { isCommandValueLinkedToPoint } from "./8-svg-utils";

export function RowValues(props: CommandRowValuesProps) {
    const { row } = props;
    const groups = getValueGroups(row);

    return groups.map((group) => {
        switch (group.type) {
            case ValueGroupType.Pair:
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
            case ValueGroupType.Single:
                return (
                    <RowValue
                        key={group.key}
                        value={row.values[group.index]}
                        valueIndex={group.index}
                        {...props}
                    />
                );
            case ValueGroupType.ArcFlags:
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
    });
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

const ValueGroupType = {
    Pair: 0,
    Single: 1,
    ArcFlags: 2,
} as const;

type ValueGroupType = typeof ValueGroupType[keyof typeof ValueGroupType];
type ValueGroup =
    | { type: typeof ValueGroupType.Pair; indices: [number, number]; key: string; }
    | { type: typeof ValueGroupType.Single; index: number; key: string; }
    | { type: typeof ValueGroupType.ArcFlags; key: string; };

function getValueGroups(row: CommandRowValuesProps["row"]): ValueGroup[] {
    const upper = row.command.toUpperCase();
    if (upper === "A") {
        const groups: ValueGroup[] = [];
        if (row.values.length >= 2) {
            groups.push({ type: ValueGroupType.Pair, indices: [0, 1], key: `${row.index}:pair-0` });
        }
        else if (row.values.length === 1) {
            groups.push({ type: ValueGroupType.Single, index: 0, key: `${row.index}:single-0` });
        }
        if (row.values.length >= 3) {
            groups.push({ type: ValueGroupType.Single, index: 2, key: `${row.index}:single-2` });
        }
        if (row.values.length >= 5) {
            groups.push({ type: ValueGroupType.ArcFlags, key: `${row.index}:arc-flags` });
        }
        if (row.values.length >= 7) {
            groups.push({ type: ValueGroupType.Pair, indices: [5, 6], key: `${row.index}:pair-5` });
        }
        else if (row.values.length === 6) {
            groups.push({ type: ValueGroupType.Single, index: 5, key: `${row.index}:single-5` });
        }
        return groups;
    }

    const groups: ValueGroup[] = [];
    for (let i = 0; i < row.values.length; i += 2) {
        if (i + 1 < row.values.length) {
            groups.push({ type: ValueGroupType.Pair, indices: [i, i + 1], key: `${row.index}:pair-${i}` });
        }
        else {
            groups.push({ type: ValueGroupType.Single, index: i, key: `${row.index}:single-${i}` });
        }
    }
    return groups;
}
