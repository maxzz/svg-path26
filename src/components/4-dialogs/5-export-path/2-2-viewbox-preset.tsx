import { useEffect, useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { type ViewBoxStr } from "@/store/9-ui-settings-types-and-defaults";
import { type ExportViewBoxDraft, viewBoxCustomValueStrDraftAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";
import { appSettings } from "@/store/0-ui-settings";
import { classNames } from "@/utils";

export function ViewBoxPresetSelect({className}: {className?: string}) {
    const { exportStroke, exportStrokeWidth } = useSnapshot(appSettings.export);

    const pathValue = useAtomValue(svgPathInputAtom);
    const pathViewBox = useAtomValue(pathViewBoxAtom);
    const viewBoxCustomValueStrDraft = useAtomValue(viewBoxCustomValueStrDraftAtom);
    const [viewBoxDraft, setViewBoxDraft] = useAtom(viewBoxDraftAtom);
    const [viewBoxStrDraft, setViewBoxStrDraft] = useAtom(viewBoxStrDraftAtom);

    const boundsViewBox = useMemo(
        () => computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, pathViewBox),
        [exportStroke, exportStrokeWidth, pathValue, pathViewBox]);

    const resolvedPresetId = resolvePresetId(viewBoxStrDraft, viewBoxCustomValueStrDraft);
    const selectItems = buildSelectItems(viewBoxCustomValueStrDraft);

    useEffect(
        () => {
            if (viewBoxStrDraft === resolvedPresetId) {
                return;
            }
            setViewBoxStrDraft(resolvedPresetId);
        },
        [resolvedPresetId, viewBoxStrDraft, setViewBoxStrDraft]);

    useEffect(
        () => {
            if (resolvedPresetId === VIEWBOX_PRESET_KEYS.bounds) {
                if (!areViewBoxesEqual(viewBoxDraft, boundsViewBox)) {
                    setViewBoxDraft(boundsViewBox);
                }
                return;
            }

            if (resolvedPresetId === VIEWBOX_PRESET_KEYS.current) {
                if (!areViewBoxesEqual(viewBoxDraft, pathViewBox)) {
                    setViewBoxDraft(pathViewBox);
                }
                return;
            }

            if (isViewBoxString(resolvedPresetId)) {
                const nextDraft = parseViewBoxString(resolvedPresetId);
                if (!areViewBoxesEqual(viewBoxDraft, nextDraft)) {
                    setViewBoxDraft(nextDraft);
                }
            }
        },
        [boundsViewBox, viewBoxDraft, pathViewBox, resolvedPresetId, setViewBoxDraft]);

    function handlePresetChange(nextPresetId: string) {
        setViewBoxStrDraft(nextPresetId);
        if (isCustomPresetId(nextPresetId)) {
            const nextDraft = parseViewBoxString(fromCustomPresetId(nextPresetId));
            if (!areViewBoxesEqual(viewBoxDraft, nextDraft)) {
                setViewBoxDraft(nextDraft);
            }
            return;
        }

        appSettings.export.viewBoxPreset = nextPresetId;
    }

    return (
        <Select value={resolvedPresetId} onValueChange={handlePresetChange}>
            <SelectTrigger className={classNames("h-6!", className)}>
                <SelectValue />
            </SelectTrigger>

            <SelectContent>
                {selectItems.map(
                    (item) => (
                        <SelectItem key={item.id} value={item.id}>
                            {item.label}
                        </SelectItem>
                    )
                )}
            </SelectContent>
        </Select>
    );
}

//

const VIEWBOX_PRESET_KEYS = {
    bounds: "bounds",
    current: "current",
} as const;

const STATIC_VIEWBOX_PRESETS: [string, ViewBoxStr][] = [
    ["16x16", "0,0,16,16"],
    ["20x20", "0,0,20,20"],
    ["24x24", "0,0,24,24"],
];

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

function isViewBoxString(value: ViewBoxStr): boolean {
    const parts = value.split(",");
    if (parts.length !== 4) {
        return false;
    }
    return parts.every((part) => Number.isFinite(Number(part)));
}

function areViewBoxesEqual(left: ExportViewBoxDraft, right: ExportViewBoxDraft): boolean {
    return left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3];
}

//

function resolvePresetId(preset: ViewBoxStr, fallbackViewBoxValue: string): string {
    if (preset === VIEWBOX_PRESET_KEYS.bounds || preset === VIEWBOX_PRESET_KEYS.current) {
        return preset;
    }

    if (isCustomPresetId(preset)) {
        return preset;
    }

    if (isViewBoxString(preset)) {
        if (STATIC_VIEWBOX_PRESET_VALUES.has(preset)) {
            return preset;
        }
        return toCustomPresetId(preset);
    }

    return toCustomPresetId(fallbackViewBoxValue);
}

const STATIC_VIEWBOX_PRESET_VALUES = new Set(STATIC_VIEWBOX_PRESETS.map(([, value]) => value));

//

function buildSelectItems(customPresetValue: string): ViewBoxPresetOption[] {
    const items: ViewBoxPresetOption[] = [
        ...STATIC_VIEWBOX_PRESET_ITEMS,
        { id: VIEWBOX_PRESET_KEYS.bounds, label: "Bounds" },
        { id: VIEWBOX_PRESET_KEYS.current, label: "Current" },
    ];

    items.push({
        id: toCustomPresetId(customPresetValue),
        label: `Custom: ${customPresetValue}`,
    });

    return items;
}

const STATIC_VIEWBOX_PRESET_ITEMS: ViewBoxPresetOption[] = STATIC_VIEWBOX_PRESETS.map(([label, value]) => ({ id: value, label }));

//

const CUSTOM_PRESET_PREFIX = "custom:";

export function toCustomPresetId(viewBoxValue: string): string {
    return `${CUSTOM_PRESET_PREFIX}${viewBoxValue}`;
}

export function isCustomPresetId(presetId: string): boolean {
    return presetId.startsWith(CUSTOM_PRESET_PREFIX);
}

function fromCustomPresetId(presetId: string): string {
    return presetId.slice(CUSTOM_PRESET_PREFIX.length);
}
