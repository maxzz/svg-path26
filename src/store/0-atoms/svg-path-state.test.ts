import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";
import {
    canRedoAtom,
    canUndoAtom,
    canvasViewBoxAtom,
    commitCurrentPathToHistoryAtom,
    doFitViewBoxAtom,
    doOpenNamedPathAtom,
    doPanViewBoxAtom,
    doRedoPathAtom,
    doSetPointLocationWithoutHistoryAtom,
    doSaveNamedPathAtom,
    doUndoPathAtom,
    doZoomViewBoxAtom,
    targetPointsAtom,
    pathNameAtom,
    storedPathsAtom,
    svgPathInputAtom,
    viewPortLockedAtom,
    zoomAtom,
} from "./2-svg-path-state";

describe("svg path state atoms", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("supports undo/redo flow", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 1 1");
        store.set(svgPathInputAtom, "M 0 0 L 2 2");

        expect(store.get(canUndoAtom)).toBe(true);
        expect(store.get(canRedoAtom)).toBe(false);

        store.set(doUndoPathAtom);
        expect(store.get(svgPathInputAtom)).toContain("1 1");
        expect(store.get(canRedoAtom)).toBe(true);

        store.set(doRedoPathAtom);
        expect(store.get(svgPathInputAtom)).toContain("2 2");
    });

    it("commits point drag history only after release", () => {
        const store = createStore();
        const startPath = store.get(svgPathInputAtom);

        const point = store.get(targetPointsAtom)[1];
        store.set(doSetPointLocationWithoutHistoryAtom, {
            point,
            to: { x: 20, y: 30 },
        });

        expect(store.get(canUndoAtom)).toBe(false);

        store.set(commitCurrentPathToHistoryAtom, startPath);

        expect(store.get(canUndoAtom)).toBe(true);

        store.set(doUndoPathAtom);

        expect(store.get(svgPathInputAtom)).toBe(startPath);
    });

    it("fits, pans and zooms viewport with lock handling", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 50 25");
        store.set(doFitViewBoxAtom);

        const initial = store.get(canvasViewBoxAtom);
        expect(initial[2]).toBeGreaterThan(0);
        expect(initial[3]).toBeGreaterThan(0);

        store.set(doPanViewBoxAtom, { dx: 10, dy: -5 });
        const panned = store.get(canvasViewBoxAtom);
        expect(panned[0]).not.toBe(initial[0]);
        expect(panned[1]).not.toBe(initial[1]);

        store.set(doZoomViewBoxAtom, { scale: 0.9 });
        const zoomed = store.get(canvasViewBoxAtom);
        expect(zoomed[2]).toBeLessThan(panned[2]);

        store.set(viewPortLockedAtom, true);
        const lockedBefore = store.get(canvasViewBoxAtom);
        store.set(doPanViewBoxAtom, { dx: 5, dy: 5 });
        expect(store.get(canvasViewBoxAtom)).toEqual(lockedBefore);
    });

    it("applies zoom scale to the viewport independently from stored zoom", () => {
        const store = createStore();
        store.set(zoomAtom, 2);
        store.set(svgPathInputAtom, "M 0 0 L 50 25");
        store.set(doFitViewBoxAtom);

        const before = store.get(canvasViewBoxAtom);
        store.set(doZoomViewBoxAtom, { scale: 0.9 });
        const after = store.get(canvasViewBoxAtom);

        expect(after[2]).toBeCloseTo(before[2] * 0.9);
        expect(after[3]).toBeCloseTo(before[3] * 0.9);
        expect(store.get(zoomAtom)).toBeCloseTo(2 / 0.9);
    });

    it("stores and opens named paths", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 33 44");
        store.set(doSaveNamedPathAtom, "example");

        expect(store.get(storedPathsAtom).length).toBe(1);
        expect(store.get(pathNameAtom)).toBe("example");

        store.set(svgPathInputAtom, "M 0 0 L 1 1");
        store.set(doOpenNamedPathAtom, "example");
        expect(store.get(svgPathInputAtom)).toContain("33 44");
    });
});
