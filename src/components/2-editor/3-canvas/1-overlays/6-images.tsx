import { atom, useAtomValue, useSetAtom } from "jotai";
import { type PointerEvent } from "react";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { canvasViewPortAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { type EditorImage, focusedImageIdAtom, imagesAtom, isImageEditModeAtom } from "@/store/0-atoms/2-8-images";
import { type ImageHandle, eventToSvgPoint, doStartImageDragAtom } from "../3-canvas-drag";
import { canvasUnitsPerPixelAtom } from "../../../../store/0-atoms/2-3-canvas-viewport-derives";

export function PathCanvasImages() {
    const images = useAtomValue(imagesAtom);

    return images.map(
        (image: EditorImage) => (
            <image
                href={image.data}
                preserveAspectRatio={image.preserveAspectRatio ? "xMidYMid meet" : "none"}

                x={Math.min(image.x1, image.x2)}
                y={Math.min(image.y1, image.y2)}
                width={Math.abs(image.x2 - image.x1)}
                height={Math.abs(image.y2 - image.y1)}

                opacity={image.opacity}
                pointerEvents="none"
                key={image.id}
            />
        )
    );
}

export function PathCanvasImageEditOverlays() {
    const { canvasPreview } = useSnapshot(appSettings.canvas);
    const imageEditMode = useAtomValue(isImageEditModeAtom);

    const images = useAtomValue(imagesAtom);
    const unitsPerPixel = useAtomValue(canvasUnitsPerPixelAtom);
    const focusedImageId = useAtomValue(focusedImageIdAtom);

    const doImageEditRect_PointerDown = useSetAtom(doImageEditRect_PointerDownAtom);
    const doImageEditHandle_PointerDown = useSetAtom(doImageEditHandle_PointerDownAtom);

    if (canvasPreview || !imageEditMode) return null;

    return images.map(
        (image) => (
            <g
                onPointerDown={(event) => { doImageEditRect_PointerDown(image, event); }}
                key={`edit:${image.id}`}
            >
                <rect
                    className={getImageEditRectClasses(image.id === focusedImageId)}

                    x={Math.min(image.x1, image.x2)}
                    y={Math.min(image.y1, image.y2)}
                    width={Math.abs(image.x2 - image.x1)}
                    height={Math.abs(image.y2 - image.y1)}
                    
                    strokeWidth={unitsPerPixel * 2}
                />

                {buildImageHandles(image).map(
                    (handle) => (
                        <circle
                            className={getImageHandleClasses(image.id === focusedImageId)}
                            cx={handle.x}
                            cy={handle.y}
                            r={unitsPerPixel * 3}
                            onPointerDown={(event) => { doImageEditHandle_PointerDown(image, handle.type, event); }}
                            key={`${image.id}:${handle.type}`}
                        />
                    )
                )}
            </g>
        )
    );
}

// Image edit interaction handlers/atoms

const doImageEditRect_PointerDownAtom = atom(
    null,
    (get, set, image: EditorImage, event: PointerEvent<SVGElement>) => {
        event.stopPropagation();
        const viewPort = get(canvasViewPortAtom);
        const start = eventToSvgPoint(event.currentTarget.ownerSVGElement, event.clientX, event.clientY, viewPort);
        if (!start) return;

        set(doStartImageDragAtom, { pointerId: event.pointerId, imageId: image.id, handle: "move", start, initial: image });
        set(focusedImageIdAtom, image.id);
    }
);

const doImageEditHandle_PointerDownAtom = atom(
    null,
    (get, set, image: EditorImage, handle: ImageHandle, event: PointerEvent<SVGElement>) => {
        event.stopPropagation();
        const viewPort = get(canvasViewPortAtom);
        const start = eventToSvgPoint(event.currentTarget.ownerSVGElement, event.clientX, event.clientY, viewPort);
        if (!start) return;

        set(doStartImageDragAtom, { pointerId: event.pointerId, imageId: image.id, handle, start, initial: image });
        set(focusedImageIdAtom, image.id);
    }
);

// Image Edit Rect Classes

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

function buildImageHandles(image: EditorImage): Array<{ type: ImageHandle; x: number; y: number; }> {
    const left = image.x1;
    const right = image.x2;
    const top = image.y1;
    const bottom = image.y2;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;

    return [
        { type: "left", x: left, y: cy },
        { type: "right", x: right, y: cy },
        { type: "top", x: cx, y: top },
        { type: "bottom", x: cx, y: bottom },
        { type: "topLeft", x: left, y: top },
        { type: "topRight", x: right, y: top },
        { type: "bottomLeft", x: left, y: bottom },
        { type: "bottomRight", x: right, y: bottom },
    ];
}
