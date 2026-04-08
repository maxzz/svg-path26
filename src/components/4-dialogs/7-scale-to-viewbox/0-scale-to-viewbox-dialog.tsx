import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { scaleToViewBoxDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { doScaleSelectedSegmentsIntoViewBoxFromDraftAtom, isValidScaleToViewBoxMargin, scaleToViewBoxMarginDraftAtom } from "@/store/0-atoms/4-2-dialog-scale-to-viewbox-atoms";

export function ScaleToViewBoxDialog() {
    const [open, setOpen] = useAtom(scaleToViewBoxDialogOpenAtom);
    const [margin, setMargin] = useAtom(scaleToViewBoxMarginDraftAtom);
    const pathViewBox = useAtomValue(pathViewBoxAtom);
    const doScaleToViewBoxFromDraft = useSetAtom(doScaleSelectedSegmentsIntoViewBoxFromDraftAtom);
    const canApply = isValidScaleToViewBoxMargin(margin, pathViewBox);

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
                    <Button
                        disabled={!canApply}
                        onClick={() => {
                            if (!canApply) return;
                            doScaleToViewBoxFromDraft();
                            setOpen(false);
                        }}
                    >
                        Scale
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}