import { useSetAtom } from "jotai";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { doSetCommandValueAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-4-0-editor-actions";

type CommandFlagToggleProps = {
    rowIndex: number;
    valueIndex: number;
    rowValueCount: number;
    value: number;
    tooltip?: string;
    focusCell: (rowIndex: number, valueIndex: number) => void;
    moveVertical: (rowIndex: number, valueIndex: number, direction: "up" | "down") => void;
    registerFieldRef: (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => void;
};

export function CommandFlagToggle(props: CommandFlagToggleProps) {
    const { rowIndex, valueIndex, rowValueCount, value, tooltip, focusCell, moveVertical, registerFieldRef } = props;

    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const setCommandValue = useSetAtom(doSetCommandValueAtom);

    const input = (
        <input
            type="checkbox"
            className={getCommandFlagCheckboxClassName()}
            checked={value === 1}
            ref={(element) => registerFieldRef(rowIndex, valueIndex, element)}
            onFocus={() => setSelectedCommandIndex(rowIndex)}
            onChange={(event) => {
                setSelectedCommandIndex(rowIndex);
                setCommandValue({
                    commandIndex: rowIndex,
                    valueIndex,
                    value: event.target.checked ? 1 : 0,
                });
            }}
            onKeyDown={(event) => {
                switch (event.key) {
                    case "ArrowLeft":
                        focusCell(rowIndex, Math.max(0, valueIndex - 1));
                        event.preventDefault();
                        break;
                    case "ArrowRight":
                        focusCell(rowIndex, Math.min(rowValueCount - 1, valueIndex + 1));
                        event.preventDefault();
                        break;
                    case "ArrowUp":
                        moveVertical(rowIndex, valueIndex, "up");
                        event.preventDefault();
                        break;
                    case "ArrowDown":
                        moveVertical(rowIndex, valueIndex, "down");
                        event.preventDefault();
                        break;
                    default:
                        break;
                }
            }}
            aria-label={valueIndex === 3 ? "large-arc-flag" : "sweep-flag"}
        />
    );

    if (!tooltip) return input;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{input}</TooltipTrigger>
            <TooltipContent sideOffset={6}>
                {tooltip}
            </TooltipContent>
        </Tooltip>
    );
}

function getCommandFlagCheckboxClassName() {
    return "h-3 w-3 shrink-0 rounded-[0.2rem] border-muted-foreground/50 bg-background align-middle accent-primary";
}
