import { useEffect, useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { type ExportViewBoxDraft, exportViewBoxCustomValueDraftAtom, exportViewBoxDraftAtom, exportViewBoxPresetDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";
import { appSettings } from "@/store/0-ui-settings";
import { type ExportViewBoxPresetStr } from "@/store/9-ui-settings-types-and-defaults";

export const VIEWBOX_PRESET_KEYS = {
    bounds: "bounds",
    current: "current",
} as const;

const LEGACY_CUSTOM_PRESET = "custom";
const CUSTOM_PRESET_PREFIX = "custom:";

export function ViewBoxPresetSelect() {
    const [exportViewBoxDraft, setExportViewBoxDraft] = useAtom(exportViewBoxDraftAtom);
    const customPresetValue = useAtomValue(exportViewBoxCustomValueDraftAtom);
    const [exportViewBoxPresetDraft, setExportViewBoxPresetDraft] = useAtom(exportViewBoxPresetDraftAtom);
    const pathViewBox = useAtomValue(pathViewBoxAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const { exportStroke, exportStrokeWidth } = useSnapshot(appSettings.export);

    const boundsViewBox = useMemo(
        () => computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, pathViewBox),
        [exportStroke, exportStrokeWidth, pathValue, pathViewBox]);

    const resolvedPresetId = resolvePresetId(exportViewBoxPresetDraft, customPresetValue);
    const selectItems = buildSelectItems(customPresetValue);

    useEffect(
        () => {
            if (exportViewBoxPresetDraft === resolvedPresetId) {
                return;
            }
            setExportViewBoxPresetDraft(resolvedPresetId);
        },
        [exportViewBoxPresetDraft, resolvedPresetId, setExportViewBoxPresetDraft]);

    useEffect(
        () => {
            if (resolvedPresetId === VIEWBOX_PRESET_KEYS.bounds) {
                if (!areViewBoxesEqual(exportViewBoxDraft, boundsViewBox)) {
                    setExportViewBoxDraft(boundsViewBox);
                }
                return;
            }

            if (resolvedPresetId === VIEWBOX_PRESET_KEYS.current) {
                if (!areViewBoxesEqual(exportViewBoxDraft, pathViewBox)) {
                    setExportViewBoxDraft(pathViewBox);
                }
                return;
            }

            if (isViewBoxString(resolvedPresetId)) {
                const nextDraft = parseViewBoxString(resolvedPresetId);
                if (!areViewBoxesEqual(exportViewBoxDraft, nextDraft)) {
                    setExportViewBoxDraft(nextDraft);
                }
            }
        },
        [boundsViewBox, exportViewBoxDraft, pathViewBox, resolvedPresetId, setExportViewBoxDraft]);

    function handlePresetChange(nextPresetId: string) {
        setExportViewBoxPresetDraft(nextPresetId);
        if (isCustomPresetId(nextPresetId)) {
            const nextDraft = parseViewBoxString(fromCustomPresetId(nextPresetId));
            if (!areViewBoxesEqual(exportViewBoxDraft, nextDraft)) {
                setExportViewBoxDraft(nextDraft);
            }
            return;
        }

        appSettings.export.exportViewBoxPreset = nextPresetId;
    }

    return (
        <label className="space-y-1">
            <span className="text-muted-foreground">Preset</span>
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
const CURRENT_VIEWBOX_LABEL = "Current";
const BOUNDS_VIEWBOX_LABEL = "Bounds";

type ViewBoxPreset = [string, ExportViewBoxPresetStr];

const STATIC_VIEWBOX_PRESETS: ViewBoxPreset[] = [
    ["16x16", "0,0,16,16"],
    ["20x20", "0,0,20,20"],
    ["24x24", "0,0,24,24"],
];

const STATIC_VIEWBOX_PRESET_VALUES = new Set(STATIC_VIEWBOX_PRESETS.map(([, value]) => value));
const STATIC_VIEWBOX_PRESET_ITEMS: ViewBoxPresetOption[] = STATIC_VIEWBOX_PRESETS.map(([label, value]) => ({ id: value, label }));

type ViewBoxPresetOption = {
    id: string;
    label: string;
};

export function viewBoxToString(viewBox: ExportViewBoxDraft): string {
    return `${viewBox[0]},${viewBox[1]},${viewBox[2]},${viewBox[3]}`;
}

function parseViewBoxString(viewBox: string): ExportViewBoxDraft {
    const parsed = viewBox.split(",").map((value) => Number(value));
    const isViewBox = parsed.length === 4 && parsed.every((value) => Number.isFinite(value));
    return isViewBox ? (parsed as unknown as ExportViewBoxDraft) : [0, 0, 1, 1];
}

function isViewBoxString(value: ExportViewBoxPresetStr): boolean {
    const parts = value.split(",");
    if (parts.length !== 4) {
        return false;
    }
    return parts.every((part) => Number.isFinite(Number(part)));
}

function areViewBoxesEqual(left: ExportViewBoxDraft, right: ExportViewBoxDraft): boolean {
    return left[0] === right[0]
        && left[1] === right[1]
        && left[2] === right[2]
        && left[3] === right[3];
}

function resolvePresetId(preset: ExportViewBoxPresetStr, fallbackViewBoxValue: string): string {
    if (preset === VIEWBOX_PRESET_KEYS.bounds || preset === VIEWBOX_PRESET_KEYS.current) {
        return preset;
    }

    if (isCustomPresetId(preset)) {
        return preset;
    }

    if (preset === LEGACY_CUSTOM_PRESET) {
        return toCustomPresetId(fallbackViewBoxValue);
    }

    if (isViewBoxString(preset)) {
        if (STATIC_VIEWBOX_PRESET_VALUES.has(preset)) {
            return preset;
        }
        return toCustomPresetId(preset);
    }

    return toCustomPresetId(fallbackViewBoxValue);
}

function buildSelectItems(customPresetValue: string): ViewBoxPresetOption[] {
    const items: ViewBoxPresetOption[] = [
        ...STATIC_VIEWBOX_PRESET_ITEMS,
        { id: VIEWBOX_PRESET_KEYS.bounds, label: BOUNDS_VIEWBOX_LABEL },
        { id: VIEWBOX_PRESET_KEYS.current, label: CURRENT_VIEWBOX_LABEL },
    ];

    items.push({
        id: toCustomPresetId(customPresetValue),
        label: `${CUSTOM_VIEWBOX_LABEL} ${customPresetValue}`,
    });

    return items;
}

export function toCustomPresetId(viewBoxValue: string): string {
    return `${CUSTOM_PRESET_PREFIX}${viewBoxValue}`;
}

export function isCustomPresetId(presetId: string): boolean {
    return presetId.startsWith(CUSTOM_PRESET_PREFIX);
}

export function fromCustomPresetId(presetId: string): string {
    return presetId.slice(CUSTOM_PRESET_PREFIX.length);
}
