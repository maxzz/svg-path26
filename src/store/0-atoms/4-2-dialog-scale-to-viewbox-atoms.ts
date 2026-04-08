import { atom } from "jotai";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { appSettings } from "@/store/0-ui-settings";
import { doScaleSelectedSegmentsIntoViewBoxAtom } from "./2-4-editor-actions";
import { pathViewBoxAtom } from "./2-2-path-viewbox";

const SCALE_TO_VIEWBOX_MARGIN_EPS = 1e-9;

export const scaleToViewBoxMarginDraftAtom = atom<number>(appSettings.dialogs.scaleToViewBox.margin);

export const doResetScaleToViewBoxMarginDraftAtom = atom(
    null,
    (_get, set) => {
        set(scaleToViewBoxMarginDraftAtom, normalizeScaleToViewBoxMargin(appSettings.dialogs.scaleToViewBox.margin));
    },
);

export const doScaleSelectedSegmentsIntoViewBoxFromDraftAtom = atom(
    null,
    (get, set) => {
        const marginDraft = get(scaleToViewBoxMarginDraftAtom);
        const viewBox = get(pathViewBoxAtom);
        if (!isValidScaleToViewBoxMargin(marginDraft, viewBox)) return;

        const margin = normalizeScaleToViewBoxMargin(marginDraft);
        appSettings.dialogs.scaleToViewBox.margin = margin;
        set(doScaleSelectedSegmentsIntoViewBoxAtom, { margin });
    },
);

export function isValidScaleToViewBoxMargin(value: number, viewBox: ViewBox) {
    if (!Number.isFinite(value) || value < 0) return false;

    const margin = normalizeScaleToViewBoxMargin(value);
    const availableWidth = viewBox[2] - margin * 2;
    const availableHeight = viewBox[3] - margin * 2;
    return availableWidth > SCALE_TO_VIEWBOX_MARGIN_EPS && availableHeight > SCALE_TO_VIEWBOX_MARGIN_EPS;
}

function normalizeScaleToViewBoxMargin(value: number) {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}
