import { useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { type ExportViewBoxDraft, exportViewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";
import { appSettings } from "@/store/0-ui-settings";
import { type ExportViewBoxPreset } from "@/store/9-ui-settings-types-and-defaults";

export const VIEWBOX_PRESET_KEYS = {
    bounds: "bounds",
    current: "current",
    custom: "custom",
} as const;

export function ViewBoxPresetSelect() {
    const [, setExportViewBoxDraft] = useAtom(exportViewBoxDraftAtom);
    const pathViewBox = useAtomValue(pathViewBoxAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const { exportStroke, exportStrokeWidth, exportViewBoxPreset } = useSnapshot(appSettings.export);

    const boundsViewBox = computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, pathViewBox);
    const resolvedPresetId = resolvePresetId(exportViewBoxPreset);
    const isLegacyCustomPreset = isViewBoxString(exportViewBoxPreset)
        && !STATIC_VIEWBOX_PRESET_VALUES.has(exportViewBoxPreset);
    const selectItems: ViewBoxPresetOption[] = [
        ...STATIC_VIEWBOX_PRESET_ITEMS,
        { id: VIEWBOX_PRESET_KEYS.bounds, label: BOUNDS_VIEWBOX_LABEL },
        { id: VIEWBOX_PRESET_KEYS.current, label: CURRENT_VIEWBOX_LABEL },
        { id: VIEWBOX_PRESET_KEYS.custom, label: CUSTOM_VIEWBOX_LABEL },
    ];

    useEffect(
        () => {
            if (!isLegacyCustomPreset) {
                return;
            }

            setExportViewBoxDraft(parseViewBoxString(exportViewBoxPreset));
            appSettings.export.exportViewBoxPreset = VIEWBOX_PRESET_KEYS.custom;
        },
        [exportViewBoxPreset, isLegacyCustomPreset, setExportViewBoxDraft]);

    useEffect(
        () => {
            if (resolvedPresetId === VIEWBOX_PRESET_KEYS.bounds) {
                setExportViewBoxDraft(boundsViewBox);
                return;
            }

            if (resolvedPresetId === VIEWBOX_PRESET_KEYS.current) {
                setExportViewBoxDraft(pathViewBox);
                return;
            }

            if (resolvedPresetId === VIEWBOX_PRESET_KEYS.custom) {
                return;
            }

            if (STATIC_VIEWBOX_PRESET_VALUES.has(resolvedPresetId)) {
                setExportViewBoxDraft(parseViewBoxString(resolvedPresetId));
            }
        },
        [boundsViewBox, pathViewBox, resolvedPresetId, setExportViewBoxDraft]);

    function handlePresetChange(nextPresetId: string) {
        appSettings.export.exportViewBoxPreset = nextPresetId;
    }

    return (
        <label className="space-y-1">
            <span className="text-muted-foreground">ViewBox preset</span>
            <Select value={resolvedPresetId} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {selectItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </label>
    );
}

const CUSTOM_VIEWBOX_LABEL = "Custom";
const CURRENT_VIEWBOX_LABEL = "current viewBox";
const BOUNDS_VIEWBOX_LABEL = "bounds";

type ViewBoxPreset = [string, ExportViewBoxPreset];

const STATIC_VIEWBOX_PRESETS: ViewBoxPreset[] = [
    ["16x16", "0,0,16,16"],
    ["20x20", "0,0,20,20"],
    ["24x24", "0,0,24,24"],
];

const STATIC_VIEWBOX_PRESET_VALUES = new Set(STATIC_VIEWBOX_PRESETS.map(([, value]) => value));
const STATIC_VIEWBOX_PRESET_ITEMS: ViewBoxPresetOption[] = STATIC_VIEWBOX_PRESETS.map(([label, value]) => ({
    id: value,
    label,
}));

type ViewBoxPresetOption = {
    id: string;
    label: string;
};

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

function resolvePresetId(preset: ExportViewBoxPreset): string {
    if (preset === VIEWBOX_PRESET_KEYS.bounds
        || preset === VIEWBOX_PRESET_KEYS.current
        || preset === VIEWBOX_PRESET_KEYS.custom) {
        return preset;
    }

    if (STATIC_VIEWBOX_PRESET_VALUES.has(preset)) {
        return preset;
    }

    return VIEWBOX_PRESET_KEYS.custom;
}

function isViewBoxString(value: ExportViewBoxPreset): boolean {
    const parts = value.split(",");
    if (parts.length !== 4) {
        return false;
    }
    return parts.every((part) => Number.isFinite(Number(part)));
}
