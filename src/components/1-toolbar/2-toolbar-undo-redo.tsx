import { useAtomValue, useSetAtom } from "jotai";
import { IconRedo, IconUndo } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";

export function ToolbarUndoRedo() {
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);
    const doUndo = useSetAtom(doUndoPathAtom);
    const doRedo = useSetAtom(doRedoPathAtom);

    return (<>
        <Button
            variant="ghost"
            size="icon"
            className="size-7 disabled:opacity-20"
            onClick={() => doUndo()}
            disabled={!canUndo}
            title="Undo"
        >
            <IconUndo className="size-4" />
        </Button>
        
        <Button
            variant="ghost"
            size="icon"
            className="size-7 disabled:opacity-20"
            onClick={() => doRedo()}
            disabled={!canRedo}
            title="Redo"
        >
            <IconRedo className="size-4" />
        </Button>
    </>);
}
