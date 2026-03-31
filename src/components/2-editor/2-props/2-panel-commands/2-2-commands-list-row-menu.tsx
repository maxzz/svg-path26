import { useAtomValue, useSetAtom } from "jotai";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/shadcn/dropdown-menu";
import { Button } from "@/components/ui/shadcn/button";
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";
import { commandLabel } from "./8-helpers";
import { svgModelAtom } from "@/store/0-atoms/2-0-svg-model";
import { doConvertSegmentAtom, doDeleteSegmentAtom, doInsertSegmentAtom, doToggleSegmentRelativeAtom } from "@/store/0-atoms/2-4-editor-actions";

const COMMAND_TYPES = ["M", "L", "V", "H", "C", "S", "Q", "T", "A", "Z"] as const;

export function CommandSelectionMenu({ rowIndex, command }: { rowIndex: number; command: string; }) {
    const parseState = useAtomValue(svgModelAtom);
    const doToggleRelative = useSetAtom(doToggleSegmentRelativeAtom);
    const doDeleteSegment = useSetAtom(doDeleteSegmentAtom);
    const doInsertSegment = useSetAtom(doInsertSegmentAtom);
    const doConvertSegment = useSetAtom(doConvertSegmentAtom);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6" onClick={(event) => event.stopPropagation()}>
                    <IconRadix_DotsHorizontal className="size-3" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Insert After</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {COMMAND_TYPES.map(
                            (type) => (
                                <DropdownMenuItem
                                    key={`insert:${rowIndex}:${type}`}
                                    disabled={parseState.model ? !parseState.model.canInsertAfter(rowIndex, type) : false}
                                    onSelect={() => doInsertSegment({ type, afterIndex: rowIndex })}
                                >
                                    <strong className="mr-1">{type}</strong> {commandLabel(type)}
                                </DropdownMenuItem>
                            )
                        )}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Convert To</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {COMMAND_TYPES.map(
                            (type) => {
                                const toType = command === command.toLowerCase() ? type.toLowerCase() : type;
                                return (
                                    <DropdownMenuItem
                                        key={`convert:${rowIndex}:${type}`}
                                        disabled={parseState.model ? !parseState.model.canConvert(rowIndex, toType) : false}
                                        onSelect={() => doConvertSegment({ segmentIndex: rowIndex, type: toType })}
                                    >
                                        <strong className="mr-1">{type}</strong> {commandLabel(type)}
                                    </DropdownMenuItem>
                                );
                            }
                        )}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onSelect={() => doToggleRelative(rowIndex)}>
                    {command === command.toLowerCase() ? "Set Absolute" : "Set Relative"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={rowIndex === 0} onSelect={() => doDeleteSegment(rowIndex)}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
