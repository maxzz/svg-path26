import { atom } from "jotai";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { pathViewBoxAtom } from "./2-6-path-viewbox";
import { appSettings } from "@/store/0-ui-settings";
import { computeExportViewBox } from "@/components/2-editor/2-props/8-helpers";

export type ExportViewBoxDraft = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export const exportViewBoxDraftAtom = atom<ExportViewBoxDraft>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
});

export const doResetExportViewBoxDraftAtom = atom(
    null,
    (get, set) => {
        const { exportStroke, exportStrokeWidth } = appSettings.export;
        const fallback = get(pathViewBoxAtom);

        set(
            exportViewBoxDraftAtom,
            computeExportViewBox(
                get(svgPathInputAtom),
                exportStroke ? exportStrokeWidth : 0,
                fallback,
            ),
        );
    },
);

// Dialog atoms

const exportSvgDialogOpenBaseAtom = atom(false);
const savePathDialogOpenBaseAtom = atom(false);
const openPathDialogOpenBaseAtom = atom(false);
const addImageDialogOpenBaseAtom = atom(false);

export const exportSvgDialogOpenAtom = atom(
    (get) => get(exportSvgDialogOpenBaseAtom),
    (_get, set, open: boolean) => {
        if (open) {
            set(doResetExportViewBoxDraftAtom);
        }
        set(exportSvgDialogOpenBaseAtom, open);
    },
);

export const savePathDialogOpenAtom = atom(
    (get) => get(savePathDialogOpenBaseAtom),
    (_get, set, open: boolean) => {
        set(savePathDialogOpenBaseAtom, open);
    },
);

export const openPathDialogOpenAtom = atom(
    (get) => get(openPathDialogOpenBaseAtom),
    (_get, set, open: boolean) => {
        set(openPathDialogOpenBaseAtom, open);
    },
);

export const addImageDialogOpenAtom = atom(
    (get) => get(addImageDialogOpenBaseAtom),
    (_get, set, open: boolean) => {
        set(addImageDialogOpenBaseAtom, open);
    },
);
