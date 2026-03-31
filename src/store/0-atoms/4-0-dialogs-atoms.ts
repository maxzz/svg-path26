import { atom } from "jotai";
import { doResetExportViewBoxDraftAtom } from "./4-1-dialog-export-atoms";

// Dialog atoms extracted from 2-5-canvas-actions-menu

const exportSvgDialogOpenBaseAtom = atom(false);
const savePathDialogOpenBaseAtom = atom(false);
const openPathDialogOpenBaseAtom = atom(false);
const addImageDialogOpenBaseAtom = atom(false);
const aboutDialogOpenBaseAtom = atom(false);

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

export const aboutDialogOpenAtom = atom(
    (get) => get(aboutDialogOpenBaseAtom),
    (_get, set, open: boolean) => {
        set(aboutDialogOpenBaseAtom, open);
    },
);
