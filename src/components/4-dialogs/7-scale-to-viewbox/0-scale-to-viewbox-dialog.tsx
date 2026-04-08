import { useAtom, useSetAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { applyButtonAtom, scaleToViewBoxDialogOpenAtom, scaleToViewBoxMarginDraftAtom } from "@/components/4-dialogs/7-scale-to-viewbox/1-scale-to-viewbox-atoms";
import { notice } from "@/components/ui/loacal-ui/7-toaster";

export function ScaleToViewBoxDialog() {
    const [open, setOpen] = useAtom(scaleToViewBoxDialogOpenAtom);
    const [margin, setMargin] = useAtom(scaleToViewBoxMarginDraftAtom);
    const [, applyScaleToViewBox] = useAtom(applyButtonAtom);

    const handleSubmit = () => {
        const applied = applyScaleToViewBox();
        if (!applied) {
            notice.info("Scale cannot be applied because the margin is too large.");
            return;
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-xs!">
                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmit();
                    }}
                >
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
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Scale</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
