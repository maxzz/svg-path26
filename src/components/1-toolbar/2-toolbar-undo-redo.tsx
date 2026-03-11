import { useAtomValue, useSetAtom } from "jotai";
import { IconRadix_ChevronLeft, IconRadix_ChevronRight } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/2-0-svg-path-state";

export function ToolbarUndoRedo() {
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);
    const doUndo = useSetAtom(doUndoPathAtom);
    const doRedo = useSetAtom(doRedoPathAtom);

    return (<>
        <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => doUndo()}
            disabled={!canUndo}
            title="Undo"
        >
            <IconRadix_ChevronLeft className="size-4" />
        </Button>
        
        <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => doRedo()}
            disabled={!canRedo}
            title="Redo"
        >
            <IconRadix_ChevronRight className="size-4" />
        </Button>
    </>);
}
