import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";
import {
    doSetPointLocationWithoutHistoryAtom,
} from "./2-2-editor-actions";
import { targetPointsAtom } from "./2-0-svg-model";
import { canvasViewBoxAtom, doFitViewPortAtom, doPanViewPortAtom, doSetViewPortAtom, doZoomViewPortAtom } from "./2-1-canvas-viewport";
import {
    canRedoAtom,
    canUndoAtom,
    doRedoPathAtom,
    doUndoPathAtom,
} from "./1-2-history";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { doCommitCurrentPathToHistoryAtom as commitCurrentPathToHistoryAtom } from "./1-2-history";
import { doOpenNamedPathAtom, doSaveNamedPathAtom } from "./2-3-stored-paths-actions";
import { doSetPathViewBoxAtom } from "./2-6-path-viewbox";
import { appSettings } from "@/store/0-ui-settings";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";

describe("svg path state atoms", () => {
    beforeEach(() => {
        localStorage.clear();
        appSettings.pathEditor.zoom = 1;
        appSettings.pathEditor.viewPortLocked = false;
        appSettings.pathEditor.pathName = "";
        appSettings.pathEditor.storedPaths = [];
        appSettings.canvas.showViewBoxFrame = false;
        appSettings.canvas.canvasPreview = false;
        appSettings.canvas.fillPreview = false;
        appSettings.canvas.showGrid = true;
        appSettings.canvas.showHelpers = true;
        appSettings.canvas.darkCanvas = false;
        appSettings.canvas.snapToGrid = true;
        appSettings.canvas.showTicks = false;
        appSettings.pathEditor.viewBox = [0, 0, 24, 24];
        appSettings.pathEditor.decimals = 3;
        appSettings.pathEditor.minifyOutput = false;
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
        store.set(doFitViewPortAtom);

        const initial = store.get(canvasViewBoxAtom);
        expect(initial[2]).toBeGreaterThan(0);
        expect(initial[3]).toBeGreaterThan(0);

        store.set(doPanViewPortAtom, { dx: 10, dy: -5 });
        const panned = store.get(canvasViewBoxAtom);
        expect(panned[0]).not.toBe(initial[0]);
        expect(panned[1]).not.toBe(initial[1]);

        store.set(doZoomViewPortAtom, { scale: 0.9 });
        const zoomed = store.get(canvasViewBoxAtom);
        expect(zoomed[2]).toBeLessThan(panned[2]);

        appSettings.pathEditor.viewPortLocked = true;
        const lockedBefore = store.get(canvasViewBoxAtom);
        store.set(doPanViewPortAtom, { dx: 5, dy: 5 });
        expect(store.get(canvasViewBoxAtom)).toEqual(lockedBefore);
    });

    it("applies zoom scale to the viewport independently from stored zoom", () => {
        const store = createStore();
        appSettings.pathEditor.zoom = 2;
        store.set(svgPathInputAtom, "M 0 0 L 50 25");
        store.set(doFitViewPortAtom);

        const before = store.get(canvasViewBoxAtom);
        store.set(doZoomViewPortAtom, { scale: 0.9 });
        const after = store.get(canvasViewBoxAtom);

        expect(after[2]).toBeCloseTo(before[2] * 0.9);
        expect(after[3]).toBeCloseTo(before[3] * 0.9);
        expect(appSettings.pathEditor.zoom).toBeCloseTo(2 / 0.9);
    });

    it("stores and opens named paths", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 33 44");
        store.set(doSetPathViewBoxAtom, [1, 2, 30, 40]);
        store.set(doSaveNamedPathAtom, "example");

        expect(appSettings.pathEditor.storedPaths.length).toBe(1);
        expect(appSettings.pathEditor.pathName).toBe("example");
        expect(appSettings.pathEditor.storedPaths[0]?.viewBox).toEqual([1, 2, 30, 40]);

        store.set(svgPathInputAtom, "M 0 0 L 1 1");
        store.set(doSetViewPortAtom, [9, 9, 12, 12]);
        store.set(doOpenNamedPathAtom, "example");
        expect(store.get(svgPathInputAtom)).toContain("33 44");
        expect(appSettings.pathEditor.viewBox).toEqual([1, 2, 30, 40]);
        expect(store.get(canvasViewBoxAtom)).toEqual([9, 9, 12, 12]);
    });

    it("migrates legacy canvas settings into the nested canvas branch", () => {
        const settings = normalizeStoredSettings({
            theme: "dark",
            showGrid: false,
            showHelpers: false,
            darkCanvas: true,
            pathEditor: {
                snapToGrid: false,
                showTicks: true,
                fillPreview: true,
                canvasPreview: true,
                showViewBoxFrame: true,
            },
        });

        expect(settings.canvas).toMatchObject({
            showGrid: false,
            showHelpers: false,
            darkCanvas: true,
            snapToGrid: false,
            showTicks: true,
            fillPreview: true,
            canvasPreview: true,
            showViewBoxFrame: true,
        });
    });
});
