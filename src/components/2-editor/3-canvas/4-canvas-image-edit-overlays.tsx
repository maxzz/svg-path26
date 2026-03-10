import type { RefObject } from "react";
import type { EditorImage } from "@/store/0-atoms/2-svg-path-state";
import type { Point } from "@/svg-core/model";
import { buildImageHandles, eventToSvgPoint } from "./3-canvas-drag";
import type { ImageHandle } from "./3-canvas-drag";

type StartImageDragArgs = {
    pointerId: number;
    imageId: string;
    handle: ImageHandle;
    start: Point;
    initial: EditorImage;
};

type PathCanvasImageEditOverlaysProps = {
    preview: boolean;
    imageEditMode: boolean;
    images: EditorImage[];
    focusedImageId: string | null;
    setFocusedImageId: (imageId: string | null) => void;
    svgRef: RefObject<SVGSVGElement | null>;
    viewBox: [number, number, number, number];
    startImageDrag: (args: StartImageDragArgs) => void;
};

export function PathCanvasImageEditOverlays({
    preview,
    imageEditMode,
    images,
    focusedImageId,
    setFocusedImageId,
    svgRef,
    viewBox,
    startImageDrag,
}: PathCanvasImageEditOverlaysProps) {
    const [, , vw, vh] = viewBox;

    if (preview || !imageEditMode) return null;

    return images.map(
        (image) => (
            <g
                key={`edit:${image.id}`}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    const start = eventToSvgPoint(svgRef.current, event.clientX, event.clientY, viewBox);
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
                    strokeWidth={Math.max(vw, vh) / 900}
                />
                {buildImageHandles(image).map(
                    (handle) => (
                        <circle
                            key={`${image.id}:${handle.type}`}
                            cx={handle.x}
                            cy={handle.y}
                            r={Math.max(vw, vh) / 180}
                            className={getImageHandleClasses(image.id === focusedImageId)}
                            onPointerDown={(event) => {
                                event.stopPropagation();
                                const start = eventToSvgPoint(svgRef.current, event.clientX, event.clientY, viewBox);
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
