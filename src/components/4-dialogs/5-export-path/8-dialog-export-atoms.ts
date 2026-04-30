import { atom, type Getter, type SetStateAction, type Setter } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type SvgoPresetDefaultPluginName, type ViewBoxStr } from "@/store/9-ui-settings-types-and-defaults";
import { svgPathInputAtom } from "../../../store/0-atoms/1-1-svg-path-input";
import { pathViewBoxAtom } from "../../../store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";
import { isViewBoxString, parseViewBoxString, viewBoxToString } from "@/store/8-utils/1-viewbox-utils";
import { buildExportSvgData, optimizeExportSvgData } from "./7-export-utils";

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

            const nextViewBoxDraft = resolveViewBoxDraft(presetStr, boundsViewBox, pathViewBox);
            set(viewBoxDraftAtom, nextViewBoxDraft);
            refreshExportSvgCode(get, set, nextViewBoxDraft);
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
        refreshExportSvgCode(get, set, exportViewBox);
    },
);

// Local state atoms

export type ExportViewBoxDraft = ViewBox;

export const viewBoxDraftAtom = atom<ExportViewBoxDraft>([0, 0, 1, 1]);
export const viewBoxStrDraftAtom = atom<ViewBoxStr>(appSettings.export.viewBoxPreset);

export const viewBoxCustomValueStrDraftAtom = atom<string>(viewBoxToString([0, 0, 1, 1]));

export const doSetExportViewBoxDraftAtom = atom(
    null,
    (get, set, update: SetStateAction<ExportViewBoxDraft>) => {
        const previous = get(viewBoxDraftAtom);
        const nextViewBoxDraft = typeof update === "function"
            ? (update as (previous: ExportViewBoxDraft) => ExportViewBoxDraft)(previous)
            : update;

        set(viewBoxDraftAtom, nextViewBoxDraft);
        refreshExportSvgCode(get, set, nextViewBoxDraft);
    },
);

// Exported SVG code atoms

export const rawExportSvgCodeAtom = atom("");
export const optimizedExportSvgCodeAtom = atom("");
export const optimizedExportSvgErrorAtom = atom("");
export const exportSvgCodeAccordionValueAtom = atom("");
export const exportSvgCodeCopiedAtom = atom(false);

const exportSvgCodeCopiedTimerAtom = atom<number | null>(null);

export const displayedExportSvgCodeAtom = atom((get) => (
    appSettings.export.svgo.enabled
        ? get(optimizedExportSvgCodeAtom)
        : get(rawExportSvgCodeAtom)
));

export const doRefreshExportSvgCodeAtom = atom(
    null,
    (get, set) => {
        refreshExportSvgCode(get, set);
    },
);

export const doCopyDisplayedExportSvgCodeAtom = atom(
    null,
    async (get, set) => {
        const svgCode = get(displayedExportSvgCodeAtom);
        if (!svgCode.trim()) {
            return;
        }

        await navigator.clipboard.writeText(svgCode);

        const currentTimer = get(exportSvgCodeCopiedTimerAtom);
        if (currentTimer !== null) {
            window.clearTimeout(currentTimer);
        }

        set(exportSvgCodeCopiedAtom, true);
        const nextTimer = window.setTimeout(
            () => {
                set(exportSvgCodeCopiedAtom, false);
                set(exportSvgCodeCopiedTimerAtom, null);
            },
            700
        );
        set(exportSvgCodeCopiedTimerAtom, nextTimer);
    },
);

// SVGO settings action atoms

export const doSetOptimizeSvgEnabledAtom = atom(
    null,
    (_get, _set, enabled: boolean) => {
        appSettings.export.svgo.enabled = enabled;
    },
);

export const doSetSvgoMultipassAtom = atom(
    null,
    (get, set, multipass: boolean) => {
        appSettings.export.svgo.multipass = multipass;
        refreshExportSvgCode(get, set);
    },
);

export const doSetSvgoFloatPrecisionAtom = atom(
    null,
    (get, set, floatPrecision: number) => {
        appSettings.export.svgo.floatPrecision = floatPrecision;
        refreshExportSvgCode(get, set);
    },
);

export const doSetSvgoPresetDefaultPluginAtom = atom(
    null,
    (get, set, { pluginName, enabled }: { pluginName: SvgoPresetDefaultPluginName; enabled: boolean; }) => {
        appSettings.export.svgo.presetDefault[pluginName] = enabled;
        refreshExportSvgCode(get, set);
    },
);

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

function resolveViewBoxDraft(preset: ViewBoxStr, boundsViewBox: ViewBox, currentViewBox: ViewBox): ViewBox {
    if (preset === "current") {
        return currentViewBox;
    }

    if (preset === "bounds") {
        return boundsViewBox;
    }

    if (isViewBoxString(preset)) {
        return parseViewBoxString(preset);
    }

    return boundsViewBox;
}

function refreshExportSvgCode(get: Getter, set: Setter, exportViewBoxDraft = get(viewBoxDraftAtom)): void {
    const pathValue = get(svgPathInputAtom);
    const rawSvgData = buildExportSvgData({ pathValue, exportViewBoxDraft });
    const optimizedResult = optimizeExportSvgData(rawSvgData, appSettings.export.svgo);

    set(rawExportSvgCodeAtom, rawSvgData);
    set(optimizedExportSvgCodeAtom, optimizedResult.svgData);
    set(optimizedExportSvgErrorAtom, optimizedResult.error);
}
