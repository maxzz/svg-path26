import { type MouseEvent } from "react";
import { atom, type Atom } from "jotai";
import { rawPathAtom } from "./1-0-raw-path";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { createAtomAppSetting } from "./8-create-atom-app-settings";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doSetPathWithoutHistoryAtom, doUndoPathAtom } from "./1-2-history";
import { commandRowsAtom, standaloneSegmentPathsAtom, svgModelAtom } from "./2-0-svg-model";
import { doDeleteImageAtom, focusedImageIdAtom } from "./2-8-images";
import { canvasRootSvgElementAtom } from "./2-3-canvas-viewport";
import { pathViewBoxAtom } from "./2-2-path-viewbox";
import { canvasDragStateAtom } from "@/components/2-editor/3-canvas/3-canvas-drag";
import { notice } from "@/components/ui/loacal-ui/7-toaster/7-toaster";
import { applyCommandSelection, normalizeSelectedCommandIndices, remapSelectedIndicesAfterDelete, type CommandSelectionMode } from "./2-5-editor-selection-utils";
import { appSettings } from "@/store/0-ui-settings";

export const strokeWidthAtom = createAtomAppSetting("strokeWidth");

export const scaleXAtom = atom(1);
export const scaleYAtom = atom(1);
export const translateXAtom = atom(0);
export const translateYAtom = atom(0);

const selectedCommandIndicesBaseAtom = atom<number[]>([]);
export const selectedCommandIndicesAtom = atom(
    (get) => normalizeSelectedCommandIndices(get(selectedCommandIndicesBaseAtom), get(commandRowsAtom).length),
    (get, set, nextIndices: number[]) => {
        set(selectedCommandIndicesBaseAtom, normalizeSelectedCommandIndices(nextIndices, get(commandRowsAtom).length));
    }
);
export const selectedCommandIndexAtom = atom(
    (get) => {
        const selected = get(selectedCommandIndicesAtom);
        return selected.length ? selected[selected.length - 1] : null;
    },
    (_get, set, nextIndex: number | null) => {
        set(selectedCommandIndicesAtom, nextIndex === null ? [] : [nextIndex]);
    }
);

export const hoveredCommandIndexAtom = atom<number | null>(null);
export const hoveredCanvasPointAtom = atom<SvgCanvasPoint | null>(null);
export const draggedCanvasPointAtom = atom<SvgCanvasPoint | null>(null);
export const isCanvasDraggingAtom = atom(false);
const suppressCanvasFocusClearUntilAtom = atom(0);
export const canvasSegmentHitAreaElementsAtom = atom<Record<number, SVGPathElement | null>>({});
const CANVAS_FOCUS_CLEAR_SUPPRESSION_MS = 250;

export const doSuppressNextCanvasFocusClearAtom = atom(
    null,
    (_get, set) => {
        set(suppressCanvasFocusClearUntilAtom, Date.now() + CANVAS_FOCUS_CLEAR_SUPPRESSION_MS);
    }
);

export const doRegisterCanvasSegmentHitAreaAtom = atom(
    null,
    (get, set, args: { index: number; element: SVGPathElement | null; }) => {
        const current = get(canvasSegmentHitAreaElementsAtom);
        if (current[args.index] === args.element) return;

        const next = { ...current };
        if (args.element) {
            next[args.index] = args.element;
        } else {
            delete next[args.index];
        }
        set(canvasSegmentHitAreaElementsAtom, next);
    }
);

// New selective atoms for command selection and hover states by segment index

const selectedCommandBySegmentAtomCache = new Map<number, Atom<boolean>>();
const hoveredCommandBySegmentAtomCache = new Map<number, Atom<boolean>>();
const highlightedCanvasPointBySegmentAtomCache = new Map<number, Atom<SvgCanvasPoint | null>>();

export function commandSelectedAtom(segmentIndex: number) {
    const cached = selectedCommandBySegmentAtomCache.get(segmentIndex);
    if (cached) return cached;

    const created = atom((get) => get(selectedCommandIndicesAtom).includes(segmentIndex));
    selectedCommandBySegmentAtomCache.set(segmentIndex, created);
    return created;
}

export function commandHoveredAtom(segmentIndex: number) {
    const cached = hoveredCommandBySegmentAtomCache.get(segmentIndex);
    if (cached) return cached;

    const created = atom((get) => get(hoveredCommandIndexAtom) === segmentIndex);
    hoveredCommandBySegmentAtomCache.set(segmentIndex, created);
    return created;
}

export function highlightedCanvasPointAtomForSegment(segmentIndex: number) {
    const cached = highlightedCanvasPointBySegmentAtomCache.get(segmentIndex);
    if (cached) return cached;

    const created = atom(
        (get) => {
            const dragged = get(draggedCanvasPointAtom);
            if (dragged?.segmentIndex === segmentIndex) return dragged;

            const hovered = get(hoveredCanvasPointAtom);
            if (!hovered || hovered.segmentIndex !== segmentIndex) return null;
            return get(hoveredCommandIndexAtom) === segmentIndex ? hovered : null;
        }
    );
    highlightedCanvasPointBySegmentAtomCache.set(segmentIndex, created);
    return created;
}

// Clear canvas focus when clicking on the canvas background

export const doClearCanvasFocusAtom = atom(
    null,
    (get, set, event: MouseEvent<SVGSVGElement>) => {
        if (get(suppressCanvasFocusClearUntilAtom) >= Date.now()) {
            set(suppressCanvasFocusClearUntilAtom, 0);
            return;
        }
        if (event.shiftKey || event.ctrlKey || event.metaKey) return;
        if (event.target !== event.currentTarget) return;

        const dragState = get(canvasDragStateAtom);
        if (dragState && "moved" in dragState && dragState.moved) return;
        set(selectedCommandIndicesAtom, []);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
        set(focusedImageIdAtom, null);
    }
);

export const doSelectCommandAtom = atom(
    null,
    (get, set, args: { index: number; mode: CommandSelectionMode; }) => {
        set(selectedCommandIndicesAtom, applyCommandSelection(
            get(selectedCommandIndicesAtom),
            [args.index],
            args.mode,
            get(commandRowsAtom).length,
        ));
    }
);

export const doSelectCommandsAtom = atom(
    null,
    (get, set, args: { indices: number[]; mode: CommandSelectionMode; }) => {
        set(selectedCommandIndicesAtom, applyCommandSelection(
            get(selectedCommandIndicesAtom),
            args.indices,
            args.mode,
            get(commandRowsAtom).length,
        ));
    }
);

export const doSelectAllCommandsAtom = atom(
    null,
    (get, set) => {
        const rowCount = get(commandRowsAtom).length;
        if (rowCount <= 0) {
            set(selectedCommandIndicesAtom, []);
            return;
        }

        const activeIndex = get(selectedCommandIndexAtom);
        const allIndices = Array.from({ length: rowCount }, (_, i) => i);

        // Keep the “active” (last-selected) segment stable after Ctrl+A.
        if (activeIndex === null) {
            set(selectedCommandIndicesAtom, allIndices);
            return;
        }

        if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= rowCount) {
            set(selectedCommandIndicesAtom, allIndices);
            return;
        }

        set(selectedCommandIndicesAtom, allIndices.filter((it) => it !== activeIndex).concat(activeIndex));
    }
);

export const doCenterSelectedSegmentsIntoViewBoxAtom = atom(
    null,
    (get, set, args?: { axis: "x" | "y" | "both"; }) => {
        const axis = args?.axis ?? "both";
        const centerX = axis === "x" || axis === "both";
        const centerY = axis === "y" || axis === "both";

        const selectedIndices = get(selectedCommandIndicesAtom);
        if (!selectedIndices.length) return;

        const model = get(svgModelAtom).model;
        if (!model) return;

        const canvasSegmentHitAreas = get(canvasSegmentHitAreaElementsAtom);

        // Compute the selection bounding-box in viewBox (path) coordinates.
        // Prefer the actual rendered SVG path bbox (more accurate for curves); fall back to model bounds.
        let xmin = Infinity;
        let ymin = Infinity;
        let xmax = -Infinity;
        let ymax = -Infinity;

        for (const segmentIndex of selectedIndices) {
            const element = canvasSegmentHitAreas[segmentIndex];
            if (element) {
                try {
                    const box = element.getBBox();
                    const bxmin = box.x;
                    const bymin = box.y;
                    const bxmax = box.x + box.width;
                    const bymax = box.y + box.height;
                    if (
                        Number.isFinite(bxmin)
                        && Number.isFinite(bymin)
                        && Number.isFinite(bxmax)
                        && Number.isFinite(bymax)
                    ) {
                        xmin = Math.min(xmin, bxmin);
                        ymin = Math.min(ymin, bymin);
                        xmax = Math.max(xmax, bxmax);
                        ymax = Math.max(ymax, bymax);
                        continue;
                    }
                } catch {
                    // fall through to model bounds
                }
            }

            const standalonePath = model.getStandaloneSegmentPath(segmentIndex);
            if (!standalonePath) continue;

            try {
                const standaloneModel = new SvgPathModel(standalonePath);
                const bounds = standaloneModel.getBounds();
                if (!Number.isFinite(bounds.xmin) || !Number.isFinite(bounds.ymin) || !Number.isFinite(bounds.xmax) || !Number.isFinite(bounds.ymax)) continue;

                xmin = Math.min(xmin, bounds.xmin);
                ymin = Math.min(ymin, bounds.ymin);
                xmax = Math.max(xmax, bounds.xmax);
                ymax = Math.max(ymax, bounds.ymax);
            } catch {
                // no-op for a single problematic segment
            }
        }

        if (!Number.isFinite(xmin) || !Number.isFinite(ymin) || !Number.isFinite(xmax) || !Number.isFinite(ymax)) return;

        const selectionCenterX = (xmin + xmax) / 2;
        const selectionCenterY = (ymin + ymax) / 2;

        const viewBox = get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        // Translate selected segments so their bounding-box center matches the viewBox center.
        const dx = centerX ? viewBoxCenterX - selectionCenterX : 0;
        const dy = centerY ? viewBoxCenterY - selectionCenterY : 0;
        if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return;

        set(doApplySvgModelAtom, (model) => {
            model.translateSegments(selectedIndices, dx, dy);
        });
    }
);

export const doScaleSelectedSegmentsIntoViewBoxAtom = atom(
    null,
    (get, set, { margin }: { margin: number; }) => {
        const selectedIndices = get(selectedCommandIndicesAtom);
        if (!selectedIndices.length) return;

        const model = get(svgModelAtom).model;
        if (!model) return;

        const canvasSegmentHitAreas = get(canvasSegmentHitAreaElementsAtom);

        // Compute the selection bounding-box in viewBox (path) coordinates.
        let xmin = Infinity;
        let ymin = Infinity;
        let xmax = -Infinity;
        let ymax = -Infinity;

        for (const segmentIndex of selectedIndices) {
            const element = canvasSegmentHitAreas[segmentIndex];
            if (element) {
                try {
                    const box = element.getBBox();
                    const bxmin = box.x;
                    const bymin = box.y;
                    const bxmax = box.x + box.width;
                    const bymax = box.y + box.height;
                    if (
                        Number.isFinite(bxmin)
                        && Number.isFinite(bymin)
                        && Number.isFinite(bxmax)
                        && Number.isFinite(bymax)
                    ) {
                        xmin = Math.min(xmin, bxmin);
                        ymin = Math.min(ymin, bymin);
                        xmax = Math.max(xmax, bxmax);
                        ymax = Math.max(ymax, bymax);
                        continue;
                    }
                } catch {
                    // fall through to model bounds
                }
            }

            const standalonePath = model.getStandaloneSegmentPath(segmentIndex);
            if (!standalonePath) continue;

            try {
                const standaloneModel = new SvgPathModel(standalonePath);
                const bounds = standaloneModel.getBounds();
                if (!Number.isFinite(bounds.xmin) || !Number.isFinite(bounds.ymin) || !Number.isFinite(bounds.xmax) || !Number.isFinite(bounds.ymax)) continue;

                xmin = Math.min(xmin, bounds.xmin);
                ymin = Math.min(ymin, bounds.ymin);
                xmax = Math.max(xmax, bounds.xmax);
                ymax = Math.max(ymax, bounds.ymax);
            } catch {
                // no-op for a single problematic segment
            }
        }

        if (!Number.isFinite(xmin) || !Number.isFinite(ymin) || !Number.isFinite(xmax) || !Number.isFinite(ymax)) return;

        const selectionCenterX = (xmin + xmax) / 2;
        const selectionCenterY = (ymin + ymax) / 2;

        const selectionWidth = xmax - xmin;
        const selectionHeight = ymax - ymin;

        const viewBox = get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        const viewBoxWidth = viewBox[2];
        const viewBoxHeight = viewBox[3];

        const EPS = 1e-9;
        const availableWidth = viewBoxWidth - margin * 2;
        const availableHeight = viewBoxHeight - margin * 2;

        if (availableWidth <= EPS || availableHeight <= EPS) {
            notice.info("Scale margin is too large for the current viewBox.");
            return;
        }

        const scaleCandidates: number[] = [];
        if (Math.abs(selectionWidth) > EPS) {
            scaleCandidates.push(availableWidth / selectionWidth);
        }
        if (Math.abs(selectionHeight) > EPS) {
            scaleCandidates.push(availableHeight / selectionHeight);
        }

        const scaleFactor = scaleCandidates.length ? Math.min(...scaleCandidates) : 1;
        if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) return;

        const dx = viewBoxCenterX - selectionCenterX;
        const dy = viewBoxCenterY - selectionCenterY;

        const shouldSkip =
            Math.abs(scaleFactor - 1) < 1e-9
            && Math.abs(dx) < 1e-9
            && Math.abs(dy) < 1e-9;

        if (shouldSkip) return;

        set(doApplySvgModelAtom, (model) => {
            model.scaleSegments(selectedIndices, scaleFactor, scaleFactor, { x: selectionCenterX, y: selectionCenterY });
            model.translateSegments(selectedIndices, dx, dy);
        });
    }
);

const COMMAND_SHORTCUT_PATTERN = /^[mlvhcsqtaz]$/i;

// Selected standalone segment path

export const selectedStandaloneSegmentPathAtom = atom(
    (get) => {
        const selected = get(selectedCommandIndexAtom);
        if (selected === null) return null;
        return get(standaloneSegmentPathsAtom)[selected] ?? null;
    }
);

export const selectedStandaloneSegmentPathsAtom = atom(
    (get) => get(selectedCommandIndicesAtom)
        .map((index) => get(standaloneSegmentPathsAtom)[index])
        .filter((segmentPath): segmentPath is string => Boolean(segmentPath))
);

export const hoveredStandaloneSegmentPathAtom = atom(
    (get) => {
        const hovered = get(hoveredCommandIndexAtom);
        if (hovered === null) return null;
        return get(standaloneSegmentPathsAtom)[hovered] ?? null;
    }
);

// Model

const doApplySvgModelAtom = atom(
    null,
    (get, set, updater: (svg: SvgPathModel) => void) => {
        const path = get(rawPathAtom).trim();
        if (!path) return;

        try {
            const model = new SvgPathModel(path);
            updater(model);
            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(svgPathInputAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

const doApplySvgModelWithoutHistoryAtom = atom(
    null,
    (get, set, updater: (svg: SvgPathModel) => void) => {
        const path = get(rawPathAtom).trim();
        if (!path) return;

        try {
            const model = new SvgPathModel(path);
            updater(model);
            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(doSetPathWithoutHistoryAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

// Canvas point location

export const doSetPointLocationAtom = atom(
    null,
    (_get, set, args: { point: SvgCanvasPoint; to: Point; }) => {
        set(doApplySvgModelAtom, (model) => {
            model.setCanvasPointLocation(args.point, args.to);
        });
    }
);

export const doSetPointLocationWithoutHistoryAtom = atom(
    null,
    (_get, set, args: { point: SvgCanvasPoint; to: Point; }) => {
        set(doApplySvgModelWithoutHistoryAtom, (model) => {
            model.setCanvasPointLocation(args.point, args.to);
        });
    }
);

export const doTranslateSelectedSegmentsWithoutHistoryAtom = atom(
    null,
    (get, set, args: { segmentIndices: number[]; dx: number; dy: number; startPath?: string; }) => {
        const path = (args.startPath ?? get(rawPathAtom)).trim();
        if (!path) return;
        if (!args.segmentIndices.length) return;
        if (args.dx === 0 && args.dy === 0) return;

        try {
            const model = new SvgPathModel(path);
            model.translateSegments(args.segmentIndices, args.dx, args.dy);
            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(doSetPathWithoutHistoryAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

export const doSetCommandValueAtom = atom(
    null,
    (_get, set, args: { commandIndex: number; valueIndex: number; value: number; }) => {
        set(doApplySvgModelAtom, (model) => {
            model.setSegmentValue(args.commandIndex, args.valueIndex, args.value);
        });
    }
);

// Segment relative

export const doToggleSegmentRelativeAtom = atom(
    null,
    (_get, set, segmentIndex: number) => {
        set(doApplySvgModelAtom, (model) => {
            model.toggleSegmentRelative(segmentIndex);
        });
    }
);

export const doDeleteSegmentAtom = atom(
    null,
    (get, set, segmentIndex: number) => {
        set(doApplySvgModelAtom, (model) => {
            model.deleteSegment(segmentIndex);
        });
        set(selectedCommandIndicesAtom, remapSelectedIndicesAfterDelete(get(selectedCommandIndicesAtom), [segmentIndex]));
    }
);

export const doDeleteSelectedSegmentsAtom = atom(
    null,
    (get, set) => {
        const model = get(svgModelAtom).model;
        if (!model) return;

        const selected = get(selectedCommandIndicesAtom);
        const deletable = selected.filter((segmentIndex) => model.canDelete(segmentIndex));
        if (!deletable.length) return;

        set(doApplySvgModelAtom, (nextModel) => {
            [...deletable].sort((a, b) => b - a).forEach((segmentIndex) => {
                nextModel.deleteSegment(segmentIndex);
            });
        });

        set(selectedCommandIndicesAtom, remapSelectedIndicesAfterDelete(selected, deletable));
    }
);

export const doInsertSegmentAtom = atom(
    null,
    (get, set, args: { type: string; afterIndex: number | null; }) => {
        const path = get(rawPathAtom).trim();
        if (!path) {
            const initial = new SvgPathModel("M 0 0");
            const inserted = initial.insertSegment(args.type, null);
            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(svgPathInputAtom, initial.toString(decimals, minify));
            set(selectedCommandIndicesAtom, [inserted ?? 0]);
            return;
        }

        let insertedIndex: number | null = null;
        set(doApplySvgModelAtom, (model) => {
            insertedIndex = model.insertSegment(args.type, args.afterIndex);
        });
        if (insertedIndex !== null) {
            set(selectedCommandIndicesAtom, [insertedIndex]);
        }
    }
);

export const doConvertSegmentAtom = atom(
    null,
    (_get, set, args: { segmentIndex: number; type: string; }) => {
        set(doApplySvgModelAtom, (model) => {
            model.changeSegmentType(args.segmentIndex, args.type);
        });
    }
);

export const doHandleEditorKeyDownAtom = atom(
    null,
    (get, set, event: KeyboardEvent) => {
        const target = event.target as Element | null;
        const inInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

        if (event.key === "Escape" && !inInput) {
            set(selectedCommandIndicesAtom, []);
            set(hoveredCommandIndexAtom, null);
            return;
        }

        const key = event.key.toLowerCase();
        const withCtrl = event.metaKey || event.ctrlKey;
        if (withCtrl && key === "z") {
            event.preventDefault();
            if (event.shiftKey) {
                if (get(canRedoAtom)) {
                    set(doRedoPathAtom);
                }
            } else if (get(canUndoAtom)) {
                set(doUndoPathAtom);
            }
            return;
        }

        if (inInput) return;

        if (withCtrl && key === "a") {
            const canvasRootSvgElement = get(canvasRootSvgElementAtom);
            const hasCanvasFocus = Boolean(
                canvasRootSvgElement
                && target instanceof Node
                && canvasRootSvgElement.contains(target),
            );

            if (hasCanvasFocus) {
                event.preventDefault();
                set(doSelectAllCommandsAtom);
            }

            // Avoid interpreting Ctrl/Meta+A as a path-command shortcut.
            return;
        }

        const selectedCommandIndices = get(selectedCommandIndicesAtom);
        const selectedCommandIndex = selectedCommandIndices.length ? selectedCommandIndices[selectedCommandIndices.length - 1] : null;
        if ((event.key === "Backspace" || event.key === "Delete") && selectedCommandIndices.length) {
            event.preventDefault();
            set(doDeleteSelectedSegmentsAtom);
            return;
        }

        const focusedImageId = get(focusedImageIdAtom);
        if ((event.key === "Backspace" || event.key === "Delete") && focusedImageId) {
            event.preventDefault();
            set(doDeleteImageAtom, focusedImageId);
            return;
        }

        if (!COMMAND_SHORTCUT_PATTERN.test(event.key)) return;
        event.preventDefault();

        const model = get(svgModelAtom).model;
        if (event.shiftKey) {
            if (selectedCommandIndex === null) return;
            const row = get(commandRowsAtom)[selectedCommandIndex];
            if (!row) return;
            if (model && !model.canConvert(selectedCommandIndex, key)) return;

            const toType = row.command === row.command.toLowerCase() ? key.toLowerCase() : key.toUpperCase();
            set(doConvertSegmentAtom, { segmentIndex: selectedCommandIndex, type: toType });
            return;
        }

        if (model && !model.canInsertAfter(selectedCommandIndex, key)) {
            return;
        }

        set(doInsertSegmentAtom, {
            type: key,
            afterIndex: selectedCommandIndex,
        });
    }
);

// Focus point command

export const doFocusPointCommandAtom = atom(
    null,
    (_get, set, point: SvgCanvasPoint | null) => {
        set(selectedCommandIndicesAtom, point ? [point.segmentIndex] : []);
    }
);

export const doNormalizePathAtom = atom(
    null,
    (get, set) => {
        set(doApplySvgModelAtom, () => { });
    }
);

// Set relative/absolute

export const doSetRelativeAtom = atom(
    null,
    (_get, set) => {
        set(doApplySvgModelAtom, (model) => model.setRelative(true));
    }
);

export const doSetAbsoluteAtom = atom(
    null,
    (_get, set) => {
        set(doApplySvgModelAtom, (model) => model.setRelative(false));
    }
);

// Scale/translate

export const doApplyScaleAtom = atom(
    null,
    (get, set) => {
        const scaleX = get(scaleXAtom);
        const scaleY = get(scaleYAtom);
        if (scaleX === 0 || scaleY === 0) return;
        set(doApplySvgModelAtom, (model) => model.scale(scaleX, scaleY));
    }
);

export const doApplyTranslateAtom = atom(
    null,
    (get, set) => {
        const dx = get(translateXAtom);
        const dy = get(translateYAtom);
        if (dx === 0 && dy === 0) return;
        set(doApplySvgModelAtom, (model) => model.translate(dx, dy));
        set(translateXAtom, 0);
        set(translateYAtom, 0);
    }
);

// Clear path

export const doClearPathAtom = atom(
    null,
    (_get, set) => {
        set(svgPathInputAtom, "");
        set(selectedCommandIndicesAtom, []);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
        set(draggedCanvasPointAtom, null);
    }
);

//
