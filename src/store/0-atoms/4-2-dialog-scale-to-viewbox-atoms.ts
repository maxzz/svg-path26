import { atom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { doScaleSelectedSegmentsIntoViewBoxAtom } from "./2-4-editor-actions";

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
        if (!isValidScaleToViewBoxMargin(marginDraft)) return;

        const margin = normalizeScaleToViewBoxMargin(marginDraft);
        appSettings.dialogs.scaleToViewBox.margin = margin;
        set(doScaleSelectedSegmentsIntoViewBoxAtom, { margin });
    },
);

export function isValidScaleToViewBoxMargin(value: number) {
    return Number.isFinite(value) && value >= 0 && value <= 100;
}

function normalizeScaleToViewBoxMargin(value: number) {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}
