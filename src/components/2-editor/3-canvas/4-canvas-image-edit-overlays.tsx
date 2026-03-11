import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { canvasPreviewAtom } from "@/store/0-atoms/2-2-editor-actions";
import { canvasViewBoxAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { focusedImageIdAtom, imagesAtom, isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { buildImageHandles, eventToSvgPoint, startImageDragAtom } from "./3-canvas-drag";
import { canvasUnitsPerPixelAtom } from "./5-canvas-viewport-metrics";

export function PathCanvasImages() {
    const images = useAtomValue(imagesAtom);

    return images.map(
        (image) => (
            <image
                key={image.id}
                href={image.data}
                x={Math.min(image.x1, image.x2)}
                y={Math.min(image.y1, image.y2)}
                width={Math.abs(image.x2 - image.x1)}
                height={Math.abs(image.y2 - image.y1)}
                preserveAspectRatio={image.preserveAspectRatio ? "xMidYMid meet" : "none"}
                opacity={image.opacity}
            />
        )
    );
}

export function PathCanvasImageEditOverlays() {
    const preview = useAtomValue(canvasPreviewAtom);
    const imageEditMode = useAtomValue(isImageEditModeAtom);
    const images = useAtomValue(imagesAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const [focusedImageId, setFocusedImageId] = useAtom(focusedImageIdAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const startImageDrag = useSetAtom(startImageDragAtom);

    if (preview || !imageEditMode) return null;

    return images.map(
        (image) => (
            <g
                key={`edit:${image.id}`}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    const start = eventToSvgPoint(event.currentTarget.ownerSVGElement, event.clientX, event.clientY, viewBox);
                    if (!start) return;
                    startImageDrag({ pointerId: event.pointerId, imageId: image.id, handle: "move", start, initial: image });
                    setFocusedImageId(image.id);
                }}
            >
                <rect
                    x={Math.min(image.x1, image.x2)}
                    y={Math.min(image.y1, image.y2)}
                    width={Math.abs(image.x2 - image.x1)}
                    height={Math.abs(image.y2 - image.y1)}
                    className={getImageEditRectClasses(image.id === focusedImageId)}
                    strokeWidth={unitsPerPixel * 2}
                />
                {buildImageHandles(image).map(
                    (handle) => (
                        <circle
                            key={`${image.id}:${handle.type}`}
                            cx={handle.x}
                            cy={handle.y}
                            r={unitsPerPixel * 3}
                            className={getImageHandleClasses(image.id === focusedImageId)}
                            onPointerDown={(event) => {
                                event.stopPropagation();
                                const start = eventToSvgPoint(event.currentTarget.ownerSVGElement, event.clientX, event.clientY, viewBox);
                                if (!start) return;
                                startImageDrag({ pointerId: event.pointerId, imageId: image.id, handle: handle.type, start, initial: image });
                                setFocusedImageId(image.id);
                            }}
                        />
                    )
                )}
            </g>
        )
    );
}

const imageEditRectFocusedClasses = "fill-transparent stroke-[oklch(0.68_0.2_240)] cursor-move";
const imageEditRectDefaultClasses = "fill-transparent stroke-[oklch(0.6_0_0/0.8)] cursor-move";
const imageHandleFocusedClasses = "fill-[oklch(0.68_0.2_240)] cursor-pointer";
const imageHandleDefaultClasses = "fill-[oklch(0.65_0_0)] cursor-pointer";

function getImageEditRectClasses(focused: boolean): string {
    return focused ? imageEditRectFocusedClasses : imageEditRectDefaultClasses;
}

function getImageHandleClasses(focused: boolean): string {
    return focused ? imageHandleFocusedClasses : imageHandleDefaultClasses;
}
