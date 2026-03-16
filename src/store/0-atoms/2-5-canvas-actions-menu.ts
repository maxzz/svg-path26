import { atom } from "jotai";
import { viewPortHeightAtom, viewPortWidthAtom, viewPortXAtom, viewPortYAtom } from "./2-1-canvas-viewbox";
import { svgPathInputAtom } from "./1-1-svg-path-input";
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
        const fallback = {
            x: get(viewPortXAtom),
            y: get(viewPortYAtom),
            width: get(viewPortWidthAtom),
            height: get(viewPortHeightAtom),
        };

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
