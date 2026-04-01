import { useAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { optionsDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { OptionsControls } from "@/components/2-editor/2-props/4-panel-options/6-options-controls-content";

export function OptionsDialog() {
    const [open, setOpen] = useAtom(optionsDialogOpenAtom);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Options</DialogTitle>
                    <DialogDescription>
                        View and editor options.
                    </DialogDescription>
                </DialogHeader>

                <OptionsControls />

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
