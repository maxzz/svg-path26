import { type SvgCanvasPoint, type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";

type RowCallbacksProps = {
    focusCell: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};

export type CommandRowValuesProps = RowCallbacksProps & {
    row: SvgSegmentSummary;
    highlightedCanvasPoint: SvgCanvasPoint | null;
};

export type CommandProps = RowCallbacksProps & {
    rowIndex: number;
    rowValueCount: number;

    command: string;

    value: number;
    valueIndex: number;
    highlighted?: boolean;
};

export type CommandArcFlagsProps = RowCallbacksProps & {
    rowIndex: number;
    rowValueCount: number;

    command: string;

    largeArcValue: number;
    sweepValue: number;
};

export type CommandFlagInputProps = RowCallbacksProps & {
    rowIndex: number;
    rowValueCount: number;

    valueIndex: number;
    value: number;
    highlighted?: boolean;

    tooltip?: string;
};

export type CommandFlagToggleProps = RowCallbacksProps & {
    rowIndex: number;
    rowValueCount: number;

    value: number;
    valueIndex: number;

    tooltip?: string;
};
