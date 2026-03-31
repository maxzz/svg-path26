import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { doDeleteSelectedSegmentsAtom, doSetPointLocationWithoutHistoryAtom, selectedCommandIndicesAtom } from "./2-2-editor-actions";
import { commandRowsAtom, targetPointsAtom } from "./2-0-svg-model";
import { canvasViewPortAtom, doFitViewPortAtom, doPanViewPortAtom, doSetViewPortAtom, doZoomViewPortAtom } from "./2-1-canvas-viewport";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "./1-2-history";
import { doApplySvgInputTextAtom, doSelectSvgInputNodeAtom, svgInputDocumentAtom, svgInputSelectedNodeIdAtom } from "./1-3-svg-input";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { doCommitCurrentPathToHistoryAtom as commitCurrentPathToHistoryAtom } from "./1-2-history";
import { confirmationDialogAtom, doCloseConfirmationDialogAtom, doOpenConfirmationDialogAtom } from "./2-7-confirmation-dialog";
import { doOpenNamedPathAtom, doSaveNamedPathAtom } from "./2-3-stored-paths-actions";
import { doSetPathViewBoxAtom } from "./2-6-path-viewbox";
import { appSettings } from "@/store/0-ui-settings";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";
import { DEFAULT_PATH_EDITOR_SETTINGS } from "@/store/9-ui-settings-types-and-defaults";

describe("svg path state atoms", () => {
    beforeEach(() => {
        localStorage.clear();
        appSettings.pathEditor.rawPath = DEFAULT_PATH_EDITOR_SETTINGS.rawPath;
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
        appSettings.pathEditor.showSvgTreeConnectorLines = true;
    });

    it("debounces app settings persistence", async () => {
        vi.useFakeTimers();

        try {
            appSettings.canvas.showGrid = false;
            appSettings.canvas.showHelpers = false;

            expect(localStorage.getItem("svg-path26__v3")).toBeNull();

            await vi.advanceTimersByTimeAsync(149);
            expect(localStorage.getItem("svg-path26__v3")).toBeNull();

            await vi.advanceTimersByTimeAsync(1);

            const storedSettings = localStorage.getItem("svg-path26__v3");
            expect(storedSettings).not.toBeNull();
            expect(storedSettings).toContain('"showGrid":false');
            expect(storedSettings).toContain('"showHelpers":false');
        } finally {
            await vi.runOnlyPendingTimersAsync();
            vi.useRealTimers();
        }
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

    it("deletes every selected segment while keeping surviving selections aligned", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 10 L 20 20 L 30 30");
        store.set(selectedCommandIndicesAtom, [0, 2, 3]);

        store.set(doDeleteSelectedSegmentsAtom);

        expect(store.get(commandRowsAtom)).toHaveLength(2);
        expect(store.get(selectedCommandIndicesAtom)).toEqual([0]);
        expect(store.get(svgPathInputAtom)).toContain("L 10 10");
        expect(store.get(svgPathInputAtom)).not.toContain("L 20 20");
        expect(store.get(svgPathInputAtom)).not.toContain("L 30 30");
    });

    it("fits, pans and zooms viewport with lock handling", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 50 25");
        store.set(doFitViewPortAtom);

        const initial = store.get(canvasViewPortAtom);
        expect(initial[2]).toBeGreaterThan(0);
        expect(initial[3]).toBeGreaterThan(0);

        store.set(doPanViewPortAtom, { dx: 10, dy: -5 });
        const panned = store.get(canvasViewPortAtom);
        expect(panned[0]).not.toBe(initial[0]);
        expect(panned[1]).not.toBe(initial[1]);

        store.set(doZoomViewPortAtom, { scale: 0.9 });
        const zoomed = store.get(canvasViewPortAtom);
        expect(zoomed[2]).toBeLessThan(panned[2]);

        appSettings.pathEditor.viewPortLocked = true;
        const lockedBefore = store.get(canvasViewPortAtom);
        store.set(doPanViewPortAtom, { dx: 5, dy: 5 });
        expect(store.get(canvasViewPortAtom)).toEqual(lockedBefore);
    });

    it("applies zoom scale to the viewport independently from stored zoom", () => {
        const store = createStore();
        appSettings.pathEditor.zoom = 2;
        store.set(svgPathInputAtom, "M 0 0 L 50 25");
        store.set(doFitViewPortAtom);

        const before = store.get(canvasViewPortAtom);
        store.set(doZoomViewPortAtom, { scale: 0.9 });
        const after = store.get(canvasViewPortAtom);

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
        expect(store.get(canvasViewPortAtom)).toEqual([9, 9, 12, 12]);
    });

    it("rewrites an existing saved path while keeping its original creation timestamp", () => {
        vi.useFakeTimers();

        try {
            const store = createStore();

            vi.setSystemTime(new Date("2026-03-30T10:00:00Z"));
            store.set(svgPathInputAtom, "M 0 0 L 10 10");
            store.set(doSetPathViewBoxAtom, [0, 0, 10, 10]);
            store.set(doSaveNamedPathAtom, "example");

            const created = appSettings.pathEditor.storedPaths[0];
            expect(created?.createdAt).toBeDefined();

            vi.setSystemTime(new Date("2026-03-30T11:00:00Z"));
            store.set(svgPathInputAtom, "M 0 0 L 20 20");
            store.set(doSetPathViewBoxAtom, [1, 2, 20, 20]);
            store.set(doSaveNamedPathAtom, "example");

            const updated = appSettings.pathEditor.storedPaths[0];
            expect(appSettings.pathEditor.storedPaths).toHaveLength(1);
            expect(updated?.path).toBe("M 0 0 L 20 20");
            expect(updated?.viewBox).toEqual([1, 2, 20, 20]);
            expect(updated?.createdAt).toBe(created?.createdAt);
            expect(updated?.updatedAt).toBeGreaterThan(created?.updatedAt ?? 0);
        } finally {
            vi.useRealTimers();
        }
    });

    it("opens and resolves the confirmation dialog callbacks", () => {
        const store = createStore();
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        store.set(doOpenConfirmationDialogAtom, {
            title: "Overwrite saved path?",
            message: "Replace existing path?",
            onConfirm,
            onCancel,
        });

        expect(store.get(confirmationDialogAtom)?.title).toBe("Overwrite saved path?");

        store.set(doCloseConfirmationDialogAtom, { confirmed: true });
        expect(store.get(confirmationDialogAtom)).toBeNull();
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();

        store.set(doOpenConfirmationDialogAtom, {
            title: "Overwrite saved path?",
            message: "Replace existing path?",
            onConfirm,
            onCancel,
        });
        store.set(doCloseConfirmationDialogAtom, { confirmed: false });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("loads standalone path data through the SVG input atom", () => {
        const store = createStore();

        store.set(doApplySvgInputTextAtom, `d="M 1 1 L 2 2"`);

        expect(store.get(svgInputDocumentAtom)?.root.tagName).toBe("path");
        expect(store.get(svgInputSelectedNodeIdAtom)).toBe("0");
        expect(store.get(svgPathInputAtom)).toBe("M 1 1 L 2 2");
    });

    it("updates the path editor when a path node is selected from SVG input", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 9 9");

        store.set(doApplySvgInputTextAtom, `
            <svg viewBox="0 0 10 10">
                <g>
                    <path d="M 1 1 L 2 2" />
                </g>
            </svg>
        `);

        expect(store.get(svgInputDocumentAtom)?.root.tagName).toBe("svg");
        expect(store.get(svgInputSelectedNodeIdAtom)).toBe("0");
        expect(store.get(svgPathInputAtom)).toBe("M 0 0 L 9 9");

        store.set(doSelectSvgInputNodeAtom, "0.0.0");

        expect(store.get(svgInputSelectedNodeIdAtom)).toBe("0.0.0");
        expect(store.get(svgPathInputAtom)).toBe("M 1 1 L 2 2");
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

    it("merges new section defaults and SVG tree settings into stored settings", () => {
        const settings = normalizeStoredSettings({
            sections: { options: false },
            pathEditor: {},
        });

        expect(settings.sections["svg-input"]).toBe(true);
        expect(settings.sections.options).toBe(false);
        expect(settings.pathEditor.showSvgTreeConnectorLines).toBe(true);
    });
});
