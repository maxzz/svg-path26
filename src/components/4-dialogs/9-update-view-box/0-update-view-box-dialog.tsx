import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { notice } from "@/components/ui/loacal-ui/7-toaster";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type UpdateViewBoxResult, isOpenUpdateViewBoxDialogAtom } from "./9-types-update-view-box";

const DEFAULT_VIEWBOX: ViewBox = [0, 0, 24, 24];
const DESCRIPTION_ID = "update-view-box-dialog-description";

export function UpdateViewBoxDialog() {
    const [dialogData, setDialogData] = useAtom(isOpenUpdateViewBoxDialogAtom);
    const [draftViewBox, setDraftViewBox] = useState<ViewBox>(DEFAULT_VIEWBOX);
    const [scaleSvgElements, setScaleSvgElements] = useState(true);

    useEffect(
        () => {
            if (!dialogData) {
                return;
            }

            setDraftViewBox(dialogData.ui.initialViewBox);
            setScaleSvgElements(dialogData.ui.initialScaleSvgElements);
        },
        [dialogData]);

    if (!dialogData) {
        return null;
    }

    const currentDialogData = dialogData;

    function close(result: UpdateViewBoxResult | null) {
        setDialogData(undefined);
        currentDialogData.resolve(result);
    }

    function apply() {
        const nextViewBox = sanitizeViewBox(draftViewBox);
        if (!nextViewBox) {
            notice.info("Enter a valid viewBox with positive width and height.");
            return;
        }

        close({
            viewBox: nextViewBox,
            scaleSvgElements,
        });
    }

    return (
        <Dialog open={!!currentDialogData} onOpenChange={() => close(null)}>
            <DialogContent className="max-w-md!" modal showCloseButton={false} aria-describedby={DESCRIPTION_ID}>
                <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); apply(); }}>
                    <DialogHeader>
                        <DialogTitle>{currentDialogData.ui.title}</DialogTitle>
                        <DialogDescription id={DESCRIPTION_ID}>
                            {currentDialogData.ui.description ?? "Update the stored viewBox and optionally scale the current SVG elements to match it."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <NumberField label="x" value={draftViewBox[0]} onChange={(value) => updateDraftValue(setDraftViewBox, 0, value)} />
                        <NumberField label="y" value={draftViewBox[1]} onChange={(value) => updateDraftValue(setDraftViewBox, 1, value)} />
                        <NumberField label="width" min={1e-3} value={draftViewBox[2]} onChange={(value) => updateDraftValue(setDraftViewBox, 2, value)} />
                        <NumberField label="height" min={1e-3} value={draftViewBox[3]} onChange={(value) => updateDraftValue(setDraftViewBox, 3, value)} />
                    </div>

                    <label className="flex items-start gap-3 rounded border px-3 py-2 text-xs">
                        <Checkbox
                            checked={scaleSvgElements}
                            onCheckedChange={(checked) => setScaleSvgElements(checked === true)}
                            className="mt-0.5"
                        />

                        <span className="leading-5">
                            Scale all SVG elements into the new viewBox.
                        </span>
                    </label>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => close(null)}>
                            {currentDialogData.ui.buttonCancel}
                        </Button>

                        <Button type="submit">
                            {currentDialogData.ui.buttonApply}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function updateDraftValue(
    setDraftViewBox: Dispatch<SetStateAction<ViewBox>>,
    index: 0 | 1 | 2 | 3,
    value: number,
) {
    setDraftViewBox((previous) => {
        const next = [...previous] as [number, number, number, number];
        next[index] = value;
        return next;
    });
}

function sanitizeViewBox(viewBox: ViewBox): ViewBox | null {
    const [x, y, width, height] = viewBox;

    if (![x, y, width, height].every((value) => Number.isFinite(value))) {
        return null;
    }

    if (width <= 0 || height <= 0) {
        return null;
    }
    
    return [x, y, Math.max(1e-3, width), Math.max(1e-3, height)];
}