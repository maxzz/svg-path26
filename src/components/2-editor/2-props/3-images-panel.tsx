import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { doDeleteImageAtom, doUpdateImageAtom, focusedImageIdAtom, imagesAtom, isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { cn } from "@/utils";
import { Button } from "@/components/ui/shadcn/button";

export function ImagesPanel() {
    const [isImageEditMode] = useAtom(isImageEditModeAtom);
    const images = useAtomValue(imagesAtom);
    const [focusedImageId, setFocusedImageId] = useAtom(focusedImageIdAtom);
    const doDeleteImage = useSetAtom(doDeleteImageAtom);
    const doUpdateImage = useSetAtom(doUpdateImageAtom);

    if (!isImageEditMode && images.length === 0) return null;

    return (
        <section className="rounded-lg border p-3">
            <h2 className="mb-2 text-sm font-semibold">Images</h2>
            <div className="space-y-2">
                {images.length === 0 && (
                    <p className="text-xs text-muted-foreground">No images loaded.</p>
                )}
                {images.map((image) => (
                    <div
                        key={image.id}
                        className={cn(
                            "rounded border p-2 space-y-2",
                            focusedImageId === image.id ? "border-sky-500/50 bg-sky-500/10" : "bg-muted/20"
                        )}
                        onClick={() => setFocusedImageId(image.id)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">Image {image.id.slice(-4)}</span>
                            <Button
                                variant="outline"
                                className="ml-auto h-6 px-2 text-xs text-destructive"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    doDeleteImage(image.id);
                                }}
                            >
                                Delete
                            </Button>
                        </div>

                        <label className="flex items-center justify-between text-xs">
                            <span>Opacity</span>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={image.opacity}
                                onChange={(event) => doUpdateImage({
                                    id: image.id,
                                    patch: { opacity: Number(event.target.value) },
                                })}
                            />
                        </label>

                        <label className="flex items-center justify-between text-xs">
                            <span>Preserve aspect</span>
                            <input
                                type="checkbox"
                                checked={image.preserveAspectRatio}
                                onChange={(event) => doUpdateImage({
                                    id: image.id,
                                    patch: { preserveAspectRatio: event.target.checked },
                                })}
                            />
                        </label>
                    </div>
                ))}
            </div>
        </section>
    );
}