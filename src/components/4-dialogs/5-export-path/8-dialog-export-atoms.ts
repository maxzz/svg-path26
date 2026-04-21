import { atom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type ViewBoxStr } from "@/store/9-ui-settings-types-and-defaults";
import { svgPathInputAtom } from "../../../store/0-atoms/1-1-svg-path-input";
import { pathViewBoxAtom } from "../../../store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";

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

            set(exportViewBoxPresetDraftAtom, presetStr);
            set(exportViewBoxCustomValueDraftAtom, customValue);

            if (presetStr === "current") {
                set(exportViewBoxDraftAtom, pathViewBox);
            } else if (presetStr === "bounds") {
                set(exportViewBoxDraftAtom, boundsViewBox);
            } else if (isViewBoxString(presetStr)) {
                set(exportViewBoxDraftAtom, parseViewBoxString(presetStr));
            } else {
                set(exportViewBoxDraftAtom, boundsViewBox);
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
        
        set(exportViewBoxDraftAtom, exportViewBox);
    },
);

// Local state atoms

export type ExportViewBoxDraft = ViewBox;

export const exportViewBoxDraftAtom = atom<ExportViewBoxDraft>([0, 0, 1, 1]);

export const exportViewBoxPresetDraftAtom = atom<ViewBoxStr>(appSettings.export.viewBoxPreset);

export const exportViewBoxCustomValueDraftAtom = atom<string>(viewBoxToString([0, 0, 1, 1]));

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

function viewBoxToString(viewBox: ViewBox): string {
    return `${viewBox[0]},${viewBox[1]},${viewBox[2]},${viewBox[3]}`;
}

function parseViewBoxString(viewBox: string): ViewBox {
    const parsed = viewBox.split(",").map((value) => Number(value));
    if (parsed.length !== 4) {
        return [0, 0, 1, 1];
    }
    const [x, y, width, height] = parsed;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        return [0, 0, 1, 1];
    }
    return [x, y, width, height];
}

function isViewBoxString(value: string): boolean {
    const parts = value.split(",");
    if (parts.length !== 4) {
        return false;
    }
    return parts.every((part) => Number.isFinite(Number(part)));
}
