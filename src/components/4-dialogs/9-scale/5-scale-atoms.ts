import { atom } from "jotai";

import { SvgPathModel } from "@/svg-core/2-svg-model";
import { computeSelectionBounds, pivotFromBounds, type SelectionBounds } from "./3-scale-selection";
import type { ScaleDialogAxisMode, ScaleDialogPivotPoint } from "@/store/10-dialogs-ui-settings-types-and-defaults";
import { canvasSegmentHitAreaElementsAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-editor-actions";
import { rawPathAtom } from "@/store/0-atoms/1-0-raw-path";
import { createAtomAppSetting } from "@/store/0-atoms/8-create-atom-app-settings";
import { dialogsSettings } from "@/store/0-ui-settings";

export const scaleDialogOriginalRawPathAtom = atom<string | null>(null);
export const scaleDialogOriginalModelAtom = atom<SvgPathModel | null>(null);

export const scaleDialogSelectionIndicesDraftAtom = atom<number[]>([]);
export const scaleDialogSelectionBoundsAtom = atom<SelectionBounds | null>(null);

export const scaleDialogModeAtom = atom<ScaleDialogAxisMode>("uniform");
export const scaleDialogScaleXAtom = atom<number>(1);
export const scaleDialogScaleYAtom = atom<number>(1);
export const scaleDialogLinkedAtom = atom<boolean>(true);
export const scaleDialogPivotAtom = atom<ScaleDialogPivotPoint>("center");
export const scaleDialogPreviewOnCanvasAtom = atom<boolean>(false);

export const scaleDialogDecimalsAtom = createAtomAppSetting("decimals");
export const scaleDialogMinifyOutputAtom = createAtomAppSetting("minifyOutput");

export const doInitScaleDialogDraftAtom = atom(
    null,
    (get, set) => {
        // Note: we intentionally don't reset mode/scale/pivot here. When the dialog is reopened,
        // `doInitScaleDialogDraftAtom` rehydrates them from persisted UI settings.

        const currentPath = get(rawPathAtom);
        set(scaleDialogOriginalRawPathAtom, currentPath);

        let parsedModel: SvgPathModel | null = null;
        try {
            parsedModel = new SvgPathModel(currentPath.trim());
        } catch {
            parsedModel = null;
        }
        set(scaleDialogOriginalModelAtom, parsedModel);

        const selectionIndices = get(selectedCommandIndicesAtom);
        set(scaleDialogSelectionIndicesDraftAtom, selectionIndices);

        const hitAreas = get(canvasSegmentHitAreaElementsAtom);
        set(scaleDialogSelectionBoundsAtom, parsedModel
            ? computeSelectionBounds(selectionIndices, hitAreas, parsedModel)
            : null);

        // Initialize dialog controls from persisted UI settings.
        const ui = dialogsSettings.scale;
        set(scaleDialogModeAtom, ui.mode);
        set(scaleDialogScaleXAtom, ui.scaleX);
        set(scaleDialogScaleYAtom, ui.mode === "uniform" && ui.linked ? ui.scaleX : ui.scaleY);
        set(scaleDialogLinkedAtom, ui.linked);
        set(scaleDialogPivotAtom, ui.pivot);
        set(scaleDialogPreviewOnCanvasAtom, ui.previewOnCanvas);
    }
);

export const scaleDialogPreviewAtom = atom(
    (get) => {
        const originalModel = get(scaleDialogOriginalModelAtom);
        if (!originalModel) return null;

        const selectionIndicesDraft = get(scaleDialogSelectionIndicesDraftAtom);
        if (!selectionIndicesDraft.length) return null;

        const selectionBounds = get(scaleDialogSelectionBoundsAtom);
        if (!selectionBounds) return null;

        const mode = get(scaleDialogModeAtom);
        const scaleX = get(scaleDialogScaleXAtom);
        const scaleY = get(scaleDialogScaleYAtom);
        const linked = get(scaleDialogLinkedAtom);
        const pivot = get(scaleDialogPivotAtom);

        const pivotPoint = pivotFromBounds(selectionBounds, pivot);

        const effectiveScaleX = mode === "uniform" || mode === "x" ? scaleX : 1;
        const effectiveScaleY = mode === "uniform"
            ? (linked ? scaleX : scaleY)
            : mode === "y"
                ? scaleY
                : 1;

        const decimals = get(scaleDialogDecimalsAtom);
        const minifyOutput = get(scaleDialogMinifyOutputAtom);

        const model = originalModel.clone();
        model.scaleSegments(selectionIndicesDraft, effectiveScaleX, effectiveScaleY, pivotPoint);

        const path = model.toString(decimals, minifyOutput);
        const bounds = model.getBounds();

        return { path, bounds };
    }
);
