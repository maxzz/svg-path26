import { atom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { svgPathInputAtom } from "../../../store/0-atoms/1-1-svg-path-input";
import { pathViewBoxAtom } from "../../../store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";

export type ExportViewBoxDraft = ViewBox;

const exportSvgDialogOpenBaseAtom = atom(false);

export const exportViewBoxDraftAtom = atom<ExportViewBoxDraft>([0, 0, 1, 1]);

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

export const exportSvgDialogOpenAtom = atom(
    (get) => get(exportSvgDialogOpenBaseAtom),
    (_get, set, open: boolean) => {
        if (open) {
            set(doResetExportViewBoxDraftAtom);
        }
        set(exportSvgDialogOpenBaseAtom, open);
    },
);
