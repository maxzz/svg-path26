import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findSvgInputNodeById } from "@/svg-core/3-svg-input";
import { doCenterSelectedSegmentsIntoViewBoxAtom, doDeleteSelectedSegmentsAtom, doSetCommandValueAtom, doSetPointLocationWithoutHistoryAtom, selectedCommandIndicesAtom } from "./2-4-0-editor-actions";
import { doScaleSelectedSegmentsIntoViewBoxAtom } from "./2-4-1-editor-actions-scale";
import { commandRowsAtom, svgModelAtom, pathPointsAtom } from "./2-0-svg-model";
import { canvasViewPortAtom, doFitViewPortAtom, doFitViewPortToPathViewBoxAtom, doPanViewPortAtom, doSetViewPortAtom, doZoomViewPortAtom, rootSvgElementSizeAtom } from "./2-3-canvas-viewport";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "./1-2-history";
import { doApplySvgInputTextAtom, doSelectSvgInputNodeAtom, svgInputDocumentAtom, svgInputSelectedNodeIdAtom } from "./1-3-svg-input";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { doCommitCurrentPathToHistoryAtom as commitCurrentPathToHistoryAtom } from "./1-2-history";
import { doAsyncExecuteConfirmDialogAtom, isOpenConfirmDialogAtom } from "../../components/4-dialogs/8-1-confirmation/9-types-confirmation";
import { doOpenNamedPathAtom, doSaveNamedPathAtom } from "./2-6-stored-paths-actions";
import { doSetPathViewBoxAtom, pathViewBoxAtom } from "./2-2-path-viewbox";
import { doResetScaleToViewBoxMarginDraftAtom, doScaleSelectedSegmentsIntoViewBoxFromDraftAtom, scaleToViewBoxMarginDraftAtom } from "../../components/4-dialogs/7-scale-to-viewbox/8-scale-to-viewbox-atoms";
import { appSettings } from "@/store/0-ui-settings";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";
import { DEFAULT_DIALOGS_SETTINGS, DEFAULT_PATH_EDITOR_SETTINGS } from "@/store/9-ui-settings-types-and-defaults";
import { SvgPathModel } from "@/svg-core/2-svg-model";

function getSelectionBounds(model: SvgPathModel, selectionIndices: number[]) {
    let xmin = Infinity;
    let ymin = Infinity;
    let xmax = -Infinity;
    let ymax = -Infinity;

    for (const segmentIndex of selectionIndices) {
        const standalonePath = model.getStandaloneSegmentPath(segmentIndex);
        if (!standalonePath) continue;

        const standaloneModel = new SvgPathModel(standalonePath);
        const bounds = standaloneModel.getBounds();
        if (!Number.isFinite(bounds.xmin) || !Number.isFinite(bounds.ymin) || !Number.isFinite(bounds.xmax) || !Number.isFinite(bounds.ymax)) continue;

        xmin = Math.min(xmin, bounds.xmin);
        ymin = Math.min(ymin, bounds.ymin);
        xmax = Math.max(xmax, bounds.xmax);
        ymax = Math.max(ymax, bounds.ymax);
    }

    if (!Number.isFinite(xmin) || !Number.isFinite(ymin) || !Number.isFinite(xmax) || !Number.isFinite(ymax)) return null;

    return {
        xmin,
        ymin,
        xmax,
        ymax,
        centerX: (xmin + xmax) / 2,
        centerY: (ymin + ymax) / 2,
    };
}

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
        appSettings.dialogs.scaleToViewBox.margin = DEFAULT_DIALOGS_SETTINGS.scaleToViewBox.margin;
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

            expect(localStorage.getItem("svg-path26__v4")).toBeNull();

            await vi.advanceTimersByTimeAsync(149);
            expect(localStorage.getItem("svg-path26__v4")).toBeNull();

            await vi.advanceTimersByTimeAsync(1);

            const storedSettings = localStorage.getItem("svg-path26__v4");
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

        const point = store.get(pathPointsAtom)[1];
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

    it("centers current selection into viewPort on both axes without changing zoom", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 0 L 10 10");
        store.set(selectedCommandIndicesAtom, [1]);
        store.set(doSetPathViewBoxAtom, [0, 0, 20, 20]);
        store.set(doSetViewPortAtom, [2, 3, 20, 20]);

        const beforeViewPort = store.get(canvasViewPortAtom);
        const viewBox = store.get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        store.set(doCenterSelectedSegmentsIntoViewBoxAtom, { axis: "both" });

        expect(store.get(canvasViewPortAtom)).toEqual(beforeViewPort);
        expect(store.get(pathViewBoxAtom)).toEqual(viewBox);

        const model = store.get(svgModelAtom).model;
        if (!model) throw new Error("expected parsed model");

        const bounds = getSelectionBounds(model, [1]);
        expect(bounds).not.toBeNull();
        expect(bounds!.centerX).toBeCloseTo(viewBoxCenterX);
        expect(bounds!.centerY).toBeCloseTo(viewBoxCenterY);
    });

    it("centers current selection into viewBox on X only", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 0 L 10 10");
        store.set(selectedCommandIndicesAtom, [1]);
        store.set(doSetPathViewBoxAtom, [0, 0, 20, 20]);
        store.set(doSetViewPortAtom, [2, 3, 20, 20]);

        const beforeViewPort = store.get(canvasViewPortAtom);
        const viewBox = store.get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;

        const modelBefore = store.get(svgModelAtom).model;
        if (!modelBefore) throw new Error("expected parsed model");
        const beforeBounds = getSelectionBounds(modelBefore, [1]);
        if (!beforeBounds) throw new Error("expected selection bounds");

        store.set(doCenterSelectedSegmentsIntoViewBoxAtom, { axis: "x" });

        expect(store.get(canvasViewPortAtom)).toEqual(beforeViewPort);
        expect(store.get(pathViewBoxAtom)).toEqual(viewBox);

        const modelAfter = store.get(svgModelAtom).model;
        if (!modelAfter) throw new Error("expected parsed model");
        const afterBounds = getSelectionBounds(modelAfter, [1]);
        if (!afterBounds) throw new Error("expected selection bounds");

        expect(afterBounds.centerX).toBeCloseTo(viewBoxCenterX);
        expect(afterBounds.centerY).toBeCloseTo(beforeBounds.centerY);
    });

    it("centers current selection into viewBox on Y only", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 0 L 10 10");
        store.set(selectedCommandIndicesAtom, [1]);
        store.set(doSetPathViewBoxAtom, [0, 0, 20, 20]);
        store.set(doSetViewPortAtom, [2, 3, 20, 20]);

        const beforeViewPort = store.get(canvasViewPortAtom);
        const viewBox = store.get(pathViewBoxAtom);
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        const modelBefore = store.get(svgModelAtom).model;
        if (!modelBefore) throw new Error("expected parsed model");
        const beforeBounds = getSelectionBounds(modelBefore, [1]);
        if (!beforeBounds) throw new Error("expected selection bounds");

        store.set(doCenterSelectedSegmentsIntoViewBoxAtom, { axis: "y" });

        expect(store.get(canvasViewPortAtom)).toEqual(beforeViewPort);
        expect(store.get(pathViewBoxAtom)).toEqual(viewBox);

        const modelAfter = store.get(svgModelAtom).model;
        if (!modelAfter) throw new Error("expected parsed model");
        const afterBounds = getSelectionBounds(modelAfter, [1]);
        if (!afterBounds) throw new Error("expected selection bounds");

        expect(afterBounds.centerY).toBeCloseTo(viewBoxCenterY);
        expect(afterBounds.centerX).toBeCloseTo(beforeBounds.centerX);
    });

    it("scales current selection into the viewBox with margin while preserving aspect ratio", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 5");
        store.set(selectedCommandIndicesAtom, [1]);
        store.set(doSetPathViewBoxAtom, [0, 0, 20, 20]);
        store.set(doSetViewPortAtom, [2, 3, 20, 20]);

        const beforeViewPort = store.get(canvasViewPortAtom);
        const viewBox = store.get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        store.set(doScaleSelectedSegmentsIntoViewBoxAtom, { margin: 2 });

        expect(store.get(canvasViewPortAtom)).toEqual(beforeViewPort);
        expect(store.get(pathViewBoxAtom)).toEqual(viewBox);

        const modelAfter = store.get(svgModelAtom).model;
        if (!modelAfter) throw new Error("expected parsed model");
        const afterBounds = getSelectionBounds(modelAfter, [1]);
        if (!afterBounds) throw new Error("expected selection bounds");

        expect(afterBounds.centerX).toBeCloseTo(viewBoxCenterX);
        expect(afterBounds.centerY).toBeCloseTo(viewBoxCenterY);
        expect(afterBounds.xmax - afterBounds.xmin).toBeCloseTo(16);
        expect(afterBounds.ymax - afterBounds.ymin).toBeCloseTo(8);
    });

    it("uses the stored scale-to-viewBox dialog margin through the dialog draft action", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 10");
        store.set(selectedCommandIndicesAtom, [1]);
        store.set(doSetPathViewBoxAtom, [0, 0, 20, 20]);
        store.set(doSetViewPortAtom, [2, 3, 20, 20]);
        appSettings.dialogs.scaleToViewBox.margin = 1.5;
        store.set(doResetScaleToViewBoxMarginDraftAtom);

        const beforeViewPort = store.get(canvasViewPortAtom);
        const viewBox = store.get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        store.set(doScaleSelectedSegmentsIntoViewBoxFromDraftAtom);

        expect(store.get(canvasViewPortAtom)).toEqual(beforeViewPort);
        expect(store.get(pathViewBoxAtom)).toEqual(viewBox);

        const modelAfter = store.get(svgModelAtom).model;
        if (!modelAfter) throw new Error("expected parsed model");
        const afterBounds = getSelectionBounds(modelAfter, [1]);
        if (!afterBounds) throw new Error("expected selection bounds");

        expect(afterBounds.centerX).toBeCloseTo(viewBoxCenterX);
        expect(afterBounds.centerY).toBeCloseTo(viewBoxCenterY);
        expect(afterBounds.xmax - afterBounds.xmin).toBeCloseTo(17);
        expect(afterBounds.ymax - afterBounds.ymin).toBeCloseTo(17);
    });

    it("rejects a margin that would collapse the available viewBox area", () => {
        const store = createStore();
        store.set(svgPathInputAtom, "M 0 0 L 10 10");
        store.set(selectedCommandIndicesAtom, [1]);
        store.set(doSetPathViewBoxAtom, [0, 0, 20, 20]);
        appSettings.dialogs.scaleToViewBox.margin = 1;
        store.set(scaleToViewBoxMarginDraftAtom, 10);

        const beforePath = store.get(svgPathInputAtom);

        store.set(doScaleSelectedSegmentsIntoViewBoxFromDraftAtom);

        expect(store.get(svgPathInputAtom)).toBe(beforePath);
        expect(appSettings.dialogs.scaleToViewBox.margin).toBe(1);
    });

    it("fits the current path at 1x zoom and then scales from that baseline", () => {
        const store = createStore();
        appSettings.pathEditor.zoom = 2;
        store.set(rootSvgElementSizeAtom, { width: 120, height: 90 });
        store.set(svgPathInputAtom, "M 0 0 L 50 25");
        store.set(doFitViewPortAtom);

        const before = store.get(canvasViewPortAtom);
        expect(before[0]).toBeCloseTo(-12.5);
        expect(before[1]).toBeCloseTo(-15.625);
        expect(before[2]).toBeCloseTo(75);
        expect(before[3]).toBeCloseTo(56.25);
        expect(appSettings.pathEditor.zoom).toBe(1);
        store.set(doZoomViewPortAtom, { scale: 0.9 });
        const after = store.get(canvasViewPortAtom);

        expect(after[2]).toBeCloseTo(before[2] * 0.9);
        expect(after[3]).toBeCloseTo(before[3] * 0.9);
        expect(appSettings.pathEditor.zoom).toBeCloseTo(1 / 0.9);
    });

    it("fits the stored path viewBox into the canvas aspect at 1x zoom", () => {
        const store = createStore();
        appSettings.pathEditor.zoom = 3;
        store.set(rootSvgElementSizeAtom, { width: 120, height: 90 });
        store.set(doSetPathViewBoxAtom, [0, 0, 24, 24]);

        store.set(doFitViewPortToPathViewBoxAtom);

        const fitted = store.get(canvasViewPortAtom);
        expect(fitted[0]).toBeCloseTo(-16.8);
        expect(fitted[1]).toBeCloseTo(-9.6);
        expect(fitted[2]).toBeCloseTo(57.6);
        expect(fitted[3]).toBeCloseTo(43.2);
        expect(appSettings.pathEditor.zoom).toBe(1);
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

    it("opens and resolves the confirmation dialog promise", async () => {
        const store = createStore();

        const confirmPromise = store.set(doAsyncExecuteConfirmDialogAtom, {
            title: "Overwrite saved path?",
            icon: "!",
            message: "Replace existing path?",
            buttonOk: "Overwrite",
            buttonCancel: "Cancel",
            isDafaultOk: false,
        }) as Promise<boolean>;

        const confirmDialog = store.get(isOpenConfirmDialogAtom);
        expect(confirmDialog?.ui.title).toBe("Overwrite saved path?");
        confirmDialog?.resolve(true);
        store.set(isOpenConfirmDialogAtom, undefined);

        await expect(confirmPromise).resolves.toBe(true);

        const cancelPromise = store.set(doAsyncExecuteConfirmDialogAtom, {
            title: "Overwrite saved path?",
            icon: "!",
            message: "Replace existing path?",
            buttonOk: "Overwrite",
            buttonCancel: "Cancel",
            isDafaultOk: false,
        }) as Promise<boolean>;

        const cancelDialog = store.get(isOpenConfirmDialogAtom);
        cancelDialog?.resolve(false);
        store.set(isOpenConfirmDialogAtom, undefined);

        await expect(cancelPromise).resolves.toBe(false);
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

    it("creates an SVG input document when the path changes without existing SVG input", () => {
        const store = createStore();

        expect(store.get(svgInputDocumentAtom)).toBeNull();

        store.set(svgPathInputAtom, "M 3 3 L 8 8");

        const root = store.get(svgInputDocumentAtom)?.root;
        const pathNode = root ? findSvgInputNodeById(root, "0.0") : null;

        expect(root?.tagName).toBe("svg");
        expect(root?.attributes.find((attribute) => attribute.name === "xmlns")?.value).toBe("http://www.w3.org/2000/svg");
        expect(root?.attributes.find((attribute) => attribute.name === "viewBox")?.value).toBe("0 0 24 24");
        expect(pathNode?.tagName).toBe("path");
        expect(pathNode?.pathData).toBe("M 3 3 L 8 8");
        expect(store.get(svgInputSelectedNodeIdAtom)).toBe("0.0");
    });

    it("syncs the bound SVG input path when command edits change the current path", () => {
        const store = createStore();

        store.set(doApplySvgInputTextAtom, `
            <svg viewBox="0 0 10 10">
                <g>
                    <path d="M 1 1 L 2 2" />
                </g>
            </svg>
        `);
        store.set(doSelectSvgInputNodeAtom, "0.0.0");

        store.set(doSetCommandValueAtom, {
            commandIndex: 1,
            valueIndex: 1,
            value: 7,
        });

        const root = store.get(svgInputDocumentAtom)?.root;
        const pathNode = root ? findSvgInputNodeById(root, "0.0.0") : null;

        expect(store.get(svgPathInputAtom)).toBe("M 1 1 L 2 7");
        expect(pathNode?.pathData).toBe("M 1 1 L 2 7");
        expect(pathNode?.attributes.find((attribute) => attribute.name === "d")?.value).toBe("M 1 1 L 2 7");
    });

    it("syncs the bound SVG input path while dragging points on the canvas", () => {
        const store = createStore();

        store.set(doApplySvgInputTextAtom, `
            <svg viewBox="0 0 10 10">
                <g>
                    <path d="M 1 1 L 2 2" />
                </g>
            </svg>
        `);
        store.set(doSelectSvgInputNodeAtom, "0.0.0");

        store.set(doSetPointLocationWithoutHistoryAtom, {
            point: store.get(pathPointsAtom)[1],
            to: { x: 20, y: 30 },
        });

        const root = store.get(svgInputDocumentAtom)?.root;
        const pathNode = root ? findSvgInputNodeById(root, "0.0.0") : null;

        expect(store.get(svgPathInputAtom)).toBe("M 1 1 L 20 30");
        expect(pathNode?.pathData).toBe("M 1 1 L 20 30");
        expect(pathNode?.attributes.find((attribute) => attribute.name === "d")?.value).toBe("M 1 1 L 20 30");
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
