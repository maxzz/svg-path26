export type CommandProps = {
    rowIndex: number;
    rowValueCount: number;
    focusCell: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
    
    command: string;

    value: number;
    valueIndex: number;
    highlighted?: boolean;
};

export type CommandArcFlagsProps = {
    rowIndex: number;
    rowValueCount: number;
    focusCell: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
    
    command: string;

    largeArcValue: number;
    sweepValue: number;
};

export type CommandFlagInputProps = {
    rowIndex: number;
    rowValueCount: number;
    focusCell: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;

    valueIndex: number;
    value: number;
    highlighted?: boolean;
    
    tooltip?: string;
};

export type CommandFlagToggleProps = {
    rowIndex: number;
    rowValueCount: number;
    focusCell: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;

    value: number;
    valueIndex: number;
    
    tooltip?: string;
};
