import { useAtom, useSetAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Switch } from "@/components/ui/shadcn/switch";
import { doAddImageAtom, isImageEditModeAtom, pendingImageAtom } from "@/store/0-atoms/2-4-images";
import { addImageDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";

export function AddImageDialog() {
    const [open, setOpen] = useAtom(addImageDialogOpenAtom);
    const [pendingImage, setPendingImage] = useAtom(pendingImageAtom);

    const doAddImage = useSetAtom(doAddImageAtom);
    const setIsImageEditMode = useSetAtom(isImageEditModeAtom);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add image to canvas</DialogTitle>
                    <DialogDescription>Set initial image placement.</DialogDescription>
                </DialogHeader>
                {pendingImage && (
                    <div className="space-y-3">
                        <img src={pendingImage.data} alt="upload preview" className="max-h-36 w-full rounded border object-contain" />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <NumberField
                                label="x"
                                value={pendingImage.x1}
                                onChange={(value) => setPendingImage((previous) => previous ? { ...previous, x1: value } : previous)}
                            />
                            <NumberField
                                label="y"
                                value={pendingImage.y1}
                                onChange={(value) => setPendingImage((previous) => previous ? { ...previous, y1: value } : previous)}
                            />
                            <NumberField
                                label="width"
                                value={pendingImage.x2 - pendingImage.x1}
                                min={0.1}
                                onChange={(value) => setPendingImage((previous) => previous ? { ...previous, x2: previous.x1 + value } : previous)}
                            />
                            <NumberField
                                label="height"
                                value={pendingImage.y2 - pendingImage.y1}
                                min={0.1}
                                onChange={(value) => setPendingImage((previous) => previous ? { ...previous, y2: previous.y1 + value } : previous)}
                            />
                            <label className="col-span-2 flex items-center justify-between rounded border px-2 py-1.5">
                                <span>Preserve aspect ratio</span>
                                <Switch
                                    checked={pendingImage.preserveAspectRatio}
                                    onCheckedChange={(checked) => setPendingImage((previous) => previous ? { ...previous, preserveAspectRatio: Boolean(checked) } : previous)}
                                />
                            </label>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        disabled={!pendingImage}
                        onClick={() => {
                            if (!pendingImage) return;
                            doAddImage(pendingImage);
                            setOpen(false);
                            setIsImageEditMode(true);
                        }}
                    >
                        Add image
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}