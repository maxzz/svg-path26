import { useAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { scaleToViewBoxDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { applyButtonAtom, scaleToViewBoxMarginDraftAtom } from "@/components/4-dialogs/7-scale-to-viewbox/4-2-dialog-scale-to-viewbox-atoms";
import { notice } from "@/components/ui/loacal-ui/7-toaster";

export function ScaleToViewBoxDialog() {
    const [open, setOpen] = useAtom(scaleToViewBoxDialogOpenAtom);
    const [margin, setMargin] = useAtom(scaleToViewBoxMarginDraftAtom);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Scale to viewBox</DialogTitle>
                    <DialogDescription>
                        Scale the current selection uniformly so it fits inside the current viewBox.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs">
                    <NumberField label="Margin" value={margin} min={0} onChange={setMargin} />
                    <p className="text-muted-foreground">
                        The margin is applied equally on all four sides before the selection is centered.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <ApplyButton />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ApplyButton() {
    const [canApply, setCanApply] = useAtom(applyButtonAtom);
    console.log("canApply", canApply);
    return (
        <Button
            //disabled={!canApply}
            onClick={() => {
                const applied = setCanApply();
                !applied && notice.info("Scale cannot be applied because the margin is too large.");
            }}
        >
            Scale
        </Button>
    );
}
