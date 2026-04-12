import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appSettings } from "@/store/0-ui-settings";
import { canUndoAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { controlPointsAtom, pathPointsAtom } from "@/store/0-atoms/2-0-svg-model";
import { doSetPathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { canvasRootSvgElementAtom, canvasViewPortAtom, doSetViewPortAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { isCanvasDraggingAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { imagesAtom, type EditorImage } from "@/store/0-atoms/2-8-images";
import { canvasDragStateAtom, doApplyActiveCanvasDragAtClientAtom, doCancelActiveCanvasDragAtom, doCommitActiveCanvasDragAtom, doStartCanvasDragAtom, doStartControlPointsDragAtom, doStartImageDragAtom, doStartPointDragAtom, doStartSelectedSegmentsDragAtom } from "./3-canvas-drag";

describe("canvas drag atoms", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        appSettings.canvas.snapToGrid = true;
        appSettings.canvas.canvasPreview = false;
        appSettings.pathEditor.dragPrecision = 0;
        appSettings.pathEditor.viewPortLocked = false;
        appSettings.pathEditor.viewBox = [0, 0, 24, 24];
    });

    it("applies and commits point drags through the active drag atoms", () => {
        const store = createCanvasDragStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 10");

        const startPath = store.get(svgPathInputAtom);
        const point = store.get(pathPointsAtom)[1];
        expect(point).toBeDefined();

        store.set(doStartPointDragAtom, {
            point: point!,
            pointerId: 1,
            startPath,
        });
        store.set(doApplyActiveCanvasDragAtClientAtom, {
            clientX: 25,
            clientY: 35,
        });

        expect(store.get(svgPathInputAtom)).toContain("25 35");
        expect(store.get(svgPathInputAtom)).not.toBe(startPath);

        store.set(doCommitActiveCanvasDragAtom);

        expect(store.get(canvasDragStateAtom)).toBeNull();
        expect(store.get(isCanvasDraggingAtom)).toBe(false);
        expect(store.get(canUndoAtom)).toBe(true);

        store.set(doUndoPathAtom);
        expect(store.get(svgPathInputAtom)).toBe(startPath);
    });

    it("applies selection drags with edge auto-pan offsets and cancels back to the start path", () => {
        const store = createCanvasDragStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 10");
        store.set(doSetPathViewBoxAtom, [0, 0, 120, 90]);
        store.set(selectedCommandIndicesAtom, [1]);

        const startPath = store.get(svgPathInputAtom);
        store.set(doStartSelectedSegmentsDragAtom, startPath, undefined, {
            pointerId: 2,
            clientX: 10,
            clientY: 10,
        });
        store.set(doApplyActiveCanvasDragAtClientAtom, {
            clientX: 20,
            clientY: 20,
            extraDx: 2,
            extraDy: 3,
        });

        expect(store.get(canvasDragStateAtom)).toMatchObject({
            mode: "selection",
            moved: true,
        });
        expect(store.get(svgPathInputAtom)).toContain("22 23");

        store.set(doCancelActiveCanvasDragAtom);

        expect(store.get(canvasDragStateAtom)).toBeNull();
        expect(store.get(isCanvasDraggingAtom)).toBe(false);
        expect(store.get(svgPathInputAtom)).toBe(startPath);
    });

    it("moves only explicitly selected control points instead of translating the whole segment", () => {
        const store = createCanvasDragStore();
        store.set(svgPathInputAtom, "M 0 0 C 10 0 10 10 20 10 Q 30 15 40 20");

        const controls = store.get(controlPointsAtom).filter((point) => point.movable);
        const draggedPoint = controls.find((point) => point.id === "1:control:1");
        const linkedPoint = controls.find((point) => point.id === "2:control:0");
        expect(draggedPoint).toBeDefined();
        expect(linkedPoint).toBeDefined();

        const startPath = store.get(svgPathInputAtom);
        store.set(doStartControlPointsDragAtom, {
            points: [draggedPoint!, linkedPoint!],
            draggedPoint: draggedPoint!,
            pointerId: 5,
            startPath,
            start: { x: draggedPoint!.x, y: draggedPoint!.y },
            clientX: draggedPoint!.x,
            clientY: draggedPoint!.y,
        });
        store.set(doApplyActiveCanvasDragAtClientAtom, {
            clientX: draggedPoint!.x + 5,
            clientY: draggedPoint!.y + 5,
        });

        expect(store.get(canvasDragStateAtom)).toMatchObject({
            mode: "control-points",
            moved: true,
        });
        expect(store.get(svgPathInputAtom)).toContain("C 10 0 15 15 20 10");
        expect(store.get(svgPathInputAtom)).toContain("Q 35 20 40 20");
        expect(store.get(svgPathInputAtom)).toContain("M 0 0");

        store.set(doCancelActiveCanvasDragAtom);

        expect(store.get(svgPathInputAtom)).toBe(startPath);
        expect(store.get(canvasDragStateAtom)).toBeNull();
        expect(store.get(isCanvasDraggingAtom)).toBe(false);
    });

    it("pans the viewport through the active canvas drag atom", () => {
        const store = createCanvasDragStore();
        const before = store.get(canvasViewPortAtom);

        store.set(doStartCanvasDragAtom, {
            pointerId: 3,
            clientX: 20,
            clientY: 30,
        });
        store.set(doApplyActiveCanvasDragAtClientAtom, {
            clientX: 32,
            clientY: 45,
        });

        expect(store.get(canvasViewPortAtom)).toEqual([before[0] - 12, before[1] - 15, before[2], before[3]]);
        expect(store.get(canvasDragStateAtom)).toMatchObject({
            mode: "canvas",
            moved: true,
            lastClientX: 32,
            lastClientY: 45,
        });
    });

    it("restores the initial image bounds when an image drag is cancelled", () => {
        const store = createCanvasDragStore();
        const image: EditorImage = {
            id: "im:test",
            x1: 5,
            y1: 10,
            x2: 25,
            y2: 30,
            preserveAspectRatio: false,
            opacity: 1,
            data: "data:image/png;base64,AA==",
        };

        store.set(imagesAtom, [image]);
        store.set(doStartImageDragAtom, {
            pointerId: 4,
            imageId: image.id,
            handle: "move",
            start: { x: 0, y: 0 },
            initial: image,
        });
        store.set(doApplyActiveCanvasDragAtClientAtom, {
            clientX: 20,
            clientY: 15,
        });

        expect(store.get(imagesAtom)[0]).toMatchObject({
            x1: 25,
            y1: 25,
            x2: 45,
            y2: 45,
        });

        store.set(doCancelActiveCanvasDragAtom);

        expect(store.get(imagesAtom)[0]).toEqual(image);
        expect(store.get(canvasDragStateAtom)).toBeNull();
        expect(store.get(isCanvasDraggingAtom)).toBe(false);
    });
});

function createCanvasDragStore() {
    const store = createStore();
    store.set(doSetViewPortAtom, [0, 0, 120, 90]);
    store.set(canvasRootSvgElementAtom, createMockSvgRoot());
    return store;
}

function createMockSvgRoot(width = 120, height = 90) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: width,
        bottom: height,
        width,
        height,
        toJSON() {
            return {};
        },
    } as DOMRect);
    return svg;
}