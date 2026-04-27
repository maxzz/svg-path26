export type CommandProps = {
    rowIndex: number;
    valueIndex: number;
    rowValueCount: number;
    value: number;
    command: string;
    highlighted?: boolean;
    focusField: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};
