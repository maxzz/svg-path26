import { useAtom, useSetAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { doResetExportViewBoxDraftAtom, exportViewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { ViewBoxPresetSelect } from "./3-viewbox-preset";

export function ViewBoxEditor() {
    const [exportViewBoxDraft, setExportViewBoxDraft] = useAtom(exportViewBoxDraftAtom);
    const resetExportViewBox = useSetAtom(doResetExportViewBoxDraftAtom);

    return (
        <div className="space-y-2">
            <ViewBoxPresetSelect />
            <div className="col-span-2 grid grid-cols-4 gap-2 rounded border px-2 py-2">
                <NumberField
                    label="x"
                    value={exportViewBoxDraft[0]}
                    onChange={(value) => setExportViewBoxDraft((previous) => [value, previous[1], previous[2], previous[3]])}
                />
                <NumberField
                    label="y"
                    value={exportViewBoxDraft[1]}
                    onChange={(value) => setExportViewBoxDraft((previous) => [previous[0], value, previous[2], previous[3]])}
                />
                <NumberField
                    label="width"
                    min={0.000001}
                    value={exportViewBoxDraft[2]}
                    onChange={(value) => setExportViewBoxDraft((previous) => [previous[0], previous[1], value, previous[3]])}
                />
                <NumberField
                    label="height"
                    min={0.000001}
                    value={exportViewBoxDraft[3]}
                    onChange={(value) => setExportViewBoxDraft((previous) => [previous[0], previous[1], previous[2], value])}
                />
            </div>

            <Button
                variant="outline"
                className="col-span-2 h-7 px-2"
                onClick={() => resetExportViewBox()}
            >
                Reset viewBox from path bounds
            </Button>
        </div>
    );
}
