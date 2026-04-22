import { atom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type ViewBoxStr } from "@/store/9-ui-settings-types-and-defaults";
import { svgPathInputAtom } from "../../../store/0-atoms/1-1-svg-path-input";
import { pathViewBoxAtom } from "../../../store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";
import { isViewBoxString, parseViewBoxString, viewBoxToString } from "@/store/8-utils/1-viewbox-utils";

// Open dialog atom

const exportSvgDialogOpenBaseAtom = atom(false);

export const exportSvgDialogOpenAtom = atom(
    (get) => get(exportSvgDialogOpenBaseAtom),
    (get, set, open: boolean) => {
        if (open) {
            const { exportStroke, exportStrokeWidth } = appSettings.export;
            const pathViewBox = get(pathViewBoxAtom);
            const pathValue = get(svgPathInputAtom);
            const boundsViewBox = computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, pathViewBox);
            const presetStr = appSettings.export.viewBoxPreset;
            const customValue = resolveCustomPresetValue(presetStr, boundsViewBox, pathViewBox);

            set(viewBoxStrDraftAtom, presetStr);
            set(viewBoxCustomValueStrDraftAtom, customValue);

            if (presetStr === "current") {
                set(viewBoxDraftAtom, pathViewBox);
            } else if (presetStr === "bounds") {
                set(viewBoxDraftAtom, boundsViewBox);
            } else if (isViewBoxString(presetStr)) {
                set(viewBoxDraftAtom, parseViewBoxString(presetStr));
            } else {
                set(viewBoxDraftAtom, boundsViewBox);
            }
        }
        set(exportSvgDialogOpenBaseAtom, open);
    },
);

export const doResetExportViewBoxDraftAtom = atom(
    null,
    (get, set) => {
        const { exportStroke, exportStrokeWidth } = appSettings.export;
        const fallback = get(pathViewBoxAtom);
        const pathValue = get(svgPathInputAtom);
        const exportViewBox = computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, fallback);
        
        set(viewBoxDraftAtom, exportViewBox);
    },
);

// Local state atoms

export type ExportViewBoxDraft = ViewBox;

export const viewBoxDraftAtom = atom<ExportViewBoxDraft>([0, 0, 1, 1]);
export const viewBoxStrDraftAtom = atom<ViewBoxStr>(appSettings.export.viewBoxPreset);

export const viewBoxCustomValueStrDraftAtom = atom<string>(viewBoxToString([0, 0, 1, 1]));

function resolveCustomPresetValue(preset: ViewBoxStr, boundsViewBox: ViewBox, currentViewBox: ViewBox): string {
    if (preset === "current") {
        return viewBoxToString(currentViewBox);
    }

    if (preset === "bounds") {
        return viewBoxToString(boundsViewBox);
    }

    if (isViewBoxString(preset)) {
        return preset;
    }

    return viewBoxToString(boundsViewBox);
}
