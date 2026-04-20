import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { type ExportViewBoxDraft, doResetExportViewBoxDraftAtom, exportViewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";
import { appSettings } from "@/store/0-ui-settings";
import { type ExportViewBoxPreset } from "@/store/9-ui-settings-types-and-defaults";

export function ViewBoxEditor() {
    const [exportViewBoxDraft, setExportViewBoxDraft] = useAtom(exportViewBoxDraftAtom);
    const resetExportViewBox = useSetAtom(doResetExportViewBoxDraftAtom);
    const pathViewBox = useAtomValue(pathViewBoxAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const { exportStroke, exportStrokeWidth, exportViewBoxPreset } = useSnapshot(appSettings.export);

    const boundsViewBox = computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, pathViewBox);
    const viewBoxPresets: ViewBoxPreset[] = [
        ...STATIC_VIEWBOX_PRESETS,
        ["bounds", viewBoxToString(boundsViewBox)],
        ["current viewBox", viewBoxToString(pathViewBox)],
    ];

    const resolvedPresetLabel = resolveViewBoxPresetLabel(exportViewBoxDraft, viewBoxPresets);
    const selectItems: ViewBoxPreset[] = [
        ...viewBoxPresets,
        [CUSTOM_VIEWBOX_LABEL, viewBoxToString(exportViewBoxDraft)],
    ];

    const viewBoxPresetValue = viewBoxToString(exportViewBoxDraft);

    useEffect(
        () => {
            if (exportViewBoxPreset !== viewBoxPresetValue) {
                appSettings.export.exportViewBoxPreset = viewBoxPresetValue;
            }
        },
        [exportViewBoxPreset, viewBoxPresetValue]);

    function handlePresetChange(nextPresetLabel: string) {
        const presetMatch = viewBoxPresets.find(([label]) => label === nextPresetLabel);
        const nextValue = presetMatch?.[1] ?? viewBoxToString(exportViewBoxDraft);
        appSettings.export.exportViewBoxPreset = nextValue;

        if (!presetMatch) {
            return;
        }

        setExportViewBoxDraft(parseViewBoxString(nextValue));
    }

    return (
        <div className="space-y-2">
            <ViewBoxPresetSelect
                resolvedPresetLabel={resolvedPresetLabel}
                selectItems={selectItems}
                onPresetChange={handlePresetChange}
            />
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

function ViewBoxPresetSelect({
    resolvedPresetLabel,
    selectItems,
    onPresetChange,
}: {
    resolvedPresetLabel: string;
    selectItems: ViewBoxPreset[];
    onPresetChange: (nextPresetLabel: string) => void;
}) {
    return (
        <label className="space-y-1">
            <span className="text-muted-foreground">ViewBox preset</span>
            <Select value={resolvedPresetLabel} onValueChange={onPresetChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {selectItems.map(([label]) => (
                        <SelectItem key={label} value={label}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </label>
    );
}

const CUSTOM_VIEWBOX_LABEL = "Custom";

type ViewBoxPreset = [string, ExportViewBoxPreset];

const STATIC_VIEWBOX_PRESETS: ViewBoxPreset[] = [
    ["16x16", "0,0,16,16"],
    ["20x20", "0,0,20,20"],
    ["24x24", "0,0,24,24"],
];

function viewBoxToString(viewBox: ExportViewBoxDraft): string {
    return `${viewBox[0]},${viewBox[1]},${viewBox[2]},${viewBox[3]}`;
}

function parseViewBoxString(viewBox: string): ExportViewBoxDraft {
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

function resolveViewBoxPresetLabel(viewBox: ExportViewBoxDraft, presets: ViewBoxPreset[]): string {
    const viewBoxKey = viewBoxToString(viewBox);
    const match = presets.find(([, presetViewBox]) => presetViewBox === viewBoxKey);
    return match?.[0] ?? CUSTOM_VIEWBOX_LABEL;
}
