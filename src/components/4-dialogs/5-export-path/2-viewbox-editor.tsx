import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { doResetExportViewBoxDraftAtom, exportViewBoxCustomValueDraftAtom, exportViewBoxDraftAtom, exportViewBoxPresetDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { appSettings } from "@/store/0-ui-settings";
import { ViewBoxPresetSelect, VIEWBOX_PRESET_KEYS, toCustomPresetId } from "./3-viewbox-preset";

export function ViewBoxEditor() {
    const [exportViewBoxDraft, setExportViewBoxDraft] = useAtom(exportViewBoxDraftAtom);
    const resetExportViewBox = useSetAtom(doResetExportViewBoxDraftAtom);
    const setExportViewBoxPresetDraft = useSetAtom(exportViewBoxPresetDraftAtom);
    const customPresetValue = useAtomValue(exportViewBoxCustomValueDraftAtom);
    const customPresetId = toCustomPresetId(customPresetValue);

    function updateViewBoxDraft(update: (previous: typeof exportViewBoxDraft) => typeof exportViewBoxDraft) {
        setExportViewBoxPresetDraft(customPresetId);
        setExportViewBoxDraft((previous) => update(previous));
    }

    return (
        <div className="space-y-2">
            <ViewBoxPresetSelect />
            <div className="col-span-2 grid grid-cols-4 gap-2 rounded border px-2 py-2">
                <NumberField
                    label="x"
                    value={exportViewBoxDraft[0]}
                    onChange={(value) => updateViewBoxDraft((previous) => [value, previous[1], previous[2], previous[3]])}
                />
                <NumberField
                    label="y"
                    value={exportViewBoxDraft[1]}
                    onChange={(value) => updateViewBoxDraft((previous) => [previous[0], value, previous[2], previous[3]])}
                />
                <NumberField
                    label="width"
                    min={0.000001}
                    value={exportViewBoxDraft[2]}
                    onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], value, previous[3]])}
                />
                <NumberField
                    label="height"
                    min={0.000001}
                    value={exportViewBoxDraft[3]}
                    onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], previous[2], value])}
                />
            </div>

            <Button
                variant="outline"
                className="col-span-2 h-7 px-2"
                onClick={() => {
                    setExportViewBoxPresetDraft(VIEWBOX_PRESET_KEYS.bounds);
                    appSettings.export.exportViewBoxPreset = VIEWBOX_PRESET_KEYS.bounds;
                    resetExportViewBox();
                }}
            >
                Reset viewBox from path bounds
            </Button>
        </div>
    );
}
