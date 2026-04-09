import { atom } from "jotai";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { canvasRootSvgElementAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { doConvertSegmentAtom, doDeleteSelectedSegmentsAtom, doInsertSegmentAtom, doSelectAllCommandsAtom, hoveredCommandIndexAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { doDeleteImageAtom, focusedImageIdAtom } from "@/store/0-atoms/2-8-images";
import { commandRowsAtom, svgModelAtom } from "@/store/0-atoms/2-0-svg-model";

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

const COMMAND_SHORTCUT_PATTERN = /^[mlvhcsqtaz]$/i;
