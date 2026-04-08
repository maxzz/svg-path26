import { atom } from "jotai";
import { subscribe } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { doScaleSelectedSegmentsIntoViewBoxAtom } from "./2-4-editor-actions";

const scaleToViewBoxMarginSettingBaseAtom = atom(appSettings.dialogs.scaleToViewBox.margin);

scaleToViewBoxMarginSettingBaseAtom.onMount = (setValue) => {
    setValue(appSettings.dialogs.scaleToViewBox.margin);

    return subscribe(appSettings, () => {
        setValue(appSettings.dialogs.scaleToViewBox.margin);
    });
};

export const scaleToViewBoxMarginSettingAtom = atom(
    (get) => get(scaleToViewBoxMarginSettingBaseAtom),
    (get, set, update: SetStateAction<number>) => {
        const current = get(scaleToViewBoxMarginSettingBaseAtom);
        const nextValue = typeof update === "function"
            ? update(current)
            : update;

        if (!Number.isFinite(nextValue)) return;

        const normalized = normalizeScaleToViewBoxMargin(nextValue);
        appSettings.dialogs.scaleToViewBox.margin = normalized;
        set(scaleToViewBoxMarginSettingBaseAtom, normalized);
    }
);

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
        set(scaleToViewBoxMarginSettingAtom, margin);
        set(doScaleSelectedSegmentsIntoViewBoxAtom, { margin });
    },
);

export function isValidScaleToViewBoxMargin(value: number) {
    return Number.isFinite(value) && value >= 0 && value <= 100;
}

function normalizeScaleToViewBoxMargin(value: number) {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}
