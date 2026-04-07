import { atom } from "jotai";

import type { SvgPathModel } from "@/svg-core/2-svg-model";
import type { SelectionBounds } from "./1-scale-selection";
import type { ScaleDialogAxisMode, ScaleDialogPivotPoint } from "@/store/10-dialogs-ui-settings-types-and-defaults";

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

