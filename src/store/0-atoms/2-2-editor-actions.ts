import { type MouseEvent } from "react";
import { atom, type Atom } from "jotai";
import { rawPathAtom } from "./1-0-raw-path";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { createAtomAppSetting } from "./8-create-atom-app-settings";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doSetPathWithoutHistoryAtom, doUndoPathAtom } from "./1-2-history";
import { commandRowsAtom, standaloneSegmentPathsAtom, svgModelAtom } from "./2-0-svg-model";
import { doDeleteImageAtom, focusedImageIdAtom } from "./2-4-images";
import { canvasDragStateAtom } from "@/components/2-editor/3-canvas/3-canvas-drag";
import { appSettings } from "@/store/0-ui-settings";

export const strokeWidthAtom = createAtomAppSetting("strokeWidth");

export const scaleXAtom = atom(1);
export const scaleYAtom = atom(1);
export const translateXAtom = atom(0);
export const translateYAtom = atom(0);

const selectedCommandIndexBaseAtom = atom<number | null>(null);
export const selectedCommandIndexAtom = atom(
    (get) => {
        const index = get(selectedCommandIndexBaseAtom);
        const rowCount = get(commandRowsAtom).length;
        if (index === null) return null;
        if (index < 0 || index >= rowCount) return null;
        return index;
    },
    (get, set, nextIndex: number | null) => {
        if (nextIndex === null) {
            set(selectedCommandIndexBaseAtom, null);
            return;
        }
        const rowCount = get(commandRowsAtom).length;
        if (nextIndex < 0 || nextIndex >= rowCount) {
            set(selectedCommandIndexBaseAtom, null);
            return;
        }
        set(selectedCommandIndexBaseAtom, nextIndex);
    }
);

export const hoveredCommandIndexAtom = atom<number | null>(null);
export const hoveredCanvasPointAtom = atom<SvgCanvasPoint | null>(null);
export const draggedCanvasPointAtom = atom<SvgCanvasPoint | null>(null);
export const isCanvasDraggingAtom = atom(false);

// New selective atoms for command selection and hover states by segment index

const selectedCommandBySegmentAtomCache = new Map<number, Atom<boolean>>();
const hoveredCommandBySegmentAtomCache = new Map<number, Atom<boolean>>();
const highlightedCanvasPointBySegmentAtomCache = new Map<number, Atom<SvgCanvasPoint | null>>();

export function commandSelectedAtom(segmentIndex: number) {
    const cached = selectedCommandBySegmentAtomCache.get(segmentIndex);
    if (cached) return cached;

    const created = atom((get) => get(selectedCommandIndexAtom) === segmentIndex);
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
        if (event.target !== event.currentTarget) return;
        
        const dragState = get(canvasDragStateAtom);
        if (dragState?.mode === "canvas" && dragState.moved) return;
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
        set(focusedImageIdAtom, null);
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

        const selected = get(selectedCommandIndexAtom);
        if (selected === null) return;

        if (selected === segmentIndex) {
            set(selectedCommandIndexAtom, null);
        } else if (selected > segmentIndex) {
            set(selectedCommandIndexAtom, selected - 1);
        }
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
            set(selectedCommandIndexAtom, inserted ?? 0);
            return;
        }

        let insertedIndex: number | null = null;
        set(doApplySvgModelAtom, (model) => {
            insertedIndex = model.insertSegment(args.type, args.afterIndex);
        });
        if (insertedIndex !== null) {
            set(selectedCommandIndexAtom, insertedIndex);
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
        const target = event.target as HTMLElement | null;
        const inInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

        if (event.key === "Escape" && !inInput) {
            set(selectedCommandIndexAtom, null);
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

        const selectedCommandIndex = get(selectedCommandIndexAtom);
        if ((event.key === "Backspace" || event.key === "Delete") && selectedCommandIndex !== null) {
            event.preventDefault();
            set(doDeleteSegmentAtom, selectedCommandIndex);
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
        set(selectedCommandIndexAtom, point ? point.segmentIndex : null);
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
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
        set(draggedCanvasPointAtom, null);
    }
);

//
