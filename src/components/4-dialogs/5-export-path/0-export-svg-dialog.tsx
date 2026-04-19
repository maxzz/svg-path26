import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";
import { Switch } from "@/components/ui/shadcn/switch";
import { NumberField } from "@/components/ui/loacal-ui/2-number-field";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { type ExportViewBoxDraft, doResetExportViewBoxDraftAtom, exportSvgDialogOpenAtom, exportViewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { computeExportViewBox } from "@/components/2-editor/2-props/4-section-path-commands/8-svg-utils";
import { appSettings } from "@/store/0-ui-settings";
import { type ExportViewBoxPreset } from "@/store/9-ui-settings-types-and-defaults";

const CUSTOM_VIEWBOX_PRESET: ExportViewBoxPreset = "Custom";

type ViewBoxPreset = [ExportViewBoxPreset, ExportViewBoxDraft];

const STATIC_VIEWBOX_PRESETS: ViewBoxPreset[] = [
    ["16x16", [0, 0, 16, 16]],
    ["20x20", [0, 0, 20, 20]],
    ["24x24", [0, 0, 24, 24]],
];

function viewBoxMatches(left: ExportViewBoxDraft, right: ExportViewBoxDraft): boolean {
    return left[0] === right[0]
        && left[1] === right[1]
        && left[2] === right[2]
        && left[3] === right[3];
}

function resolveViewBoxPreset(viewBox: ExportViewBoxDraft, presets: ViewBoxPreset[]): ExportViewBoxPreset {
    const match = presets.find(([, presetViewBox]) => viewBoxMatches(viewBox, presetViewBox));
    return match?.[0] ?? CUSTOM_VIEWBOX_PRESET;
}

export function ExportSvgDialog() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const exportViewBoxDraft = useAtomValue(exportViewBoxDraftAtom);

    function handleExport() {
        const didExport = exportSvgToFile({ pathValue, exportViewBoxDraft, });
        if (didExport) {
            setOpenExportDialog(false);
        }
    }

    return (
        <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
            <DialogContent className="max-w-sm!">
                <DialogHeader>
                    <DialogTitle>Export SVG</DialogTitle>
                    <DialogDescription>Export current path with chosen styling.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs">
                    <FillStrokeControls />
                    <ViewBoxEditor />
                    <SvgPreview />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenExportDialog(false)}>Cancel</Button>
                    <Button onClick={handleExport}>Export</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}

function FillStrokeControls() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = useSnapshot(appSettings.export);
    return (
        <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-y-2">
            <div className="grid grid-cols-subgrid col-span-3 items-center gap-x-2">
                <label className="flex items-center justify-between px-2 py-1.5">
                    <span className="w-10">
                        Fill
                    </span>
                    <Switch
                        checked={exportFill}
                        onCheckedChange={(checked) => appSettings.export.exportFill = Boolean(checked)}
                    />
                </label>

                <Input
                    className="w-16 px-1 py-0.5 disabled:opacity-20"
                    type="color"
                    disabled={!exportFill}
                    value={exportFillColor}
                    onChange={(event) => appSettings.export.exportFillColor = event.target.value}
                />
            </div>

            <div className="grid grid-cols-subgrid col-span-3 items-center gap-x-2">
                <label className="flex items-center justify-between px-2 py-1.5">
                    <span className="w-10">
                        Stroke
                    </span>
                    <Switch
                        checked={exportStroke}
                        onCheckedChange={(checked) => appSettings.export.exportStroke = Boolean(checked)}
                    />
                </label>

                <Input
                    className="w-16 px-1 py-0.5 disabled:opacity-20"
                    type="color"
                    disabled={!exportStroke}
                    value={exportStrokeColor}
                    onChange={(event) => appSettings.export.exportStrokeColor = event.target.value}
                />

                <label className="flex items-center gap-x-2">
                    <span className="whitespace-nowrap">
                        Stroke width
                    </span>
                    <Input
                        className="w-16 disabled:opacity-20"
                        disabled={!exportStroke}
                        type="number"
                        min={0.1}
                        step={0.05}
                        value={exportStrokeWidth}
                        onChange={(event) => appSettings.export.exportStrokeWidth = Number(event.target.value)}
                    />
                </label>
            </div>
        </div>
    );
}

function ViewBoxEditor() {
    const [exportViewBoxDraft, setExportViewBoxDraft] = useAtom(exportViewBoxDraftAtom);
    const resetExportViewBox = useSetAtom(doResetExportViewBoxDraftAtom);
    const pathViewBox = useAtomValue(pathViewBoxAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const { exportStroke, exportStrokeWidth, exportViewBoxPreset } = useSnapshot(appSettings.export);

    const boundsViewBox = computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, pathViewBox);
    const viewBoxPresets: ViewBoxPreset[] = [
        ...STATIC_VIEWBOX_PRESETS,
        ["bounds", boundsViewBox],
        ["current viewBox", pathViewBox],
    ];
    const resolvedPreset = resolveViewBoxPreset(exportViewBoxDraft, viewBoxPresets);
    const selectItems: ViewBoxPreset[] = [
        ...viewBoxPresets,
        [CUSTOM_VIEWBOX_PRESET, exportViewBoxDraft],
    ];

    useEffect(() => {
        if (exportViewBoxPreset !== resolvedPreset) {
            appSettings.export.exportViewBoxPreset = resolvedPreset;
        }
    }, [exportViewBoxPreset, resolvedPreset]);

    function handlePresetChange(nextPreset: ExportViewBoxPreset) {
        appSettings.export.exportViewBoxPreset = nextPreset;

        const presetMatch = viewBoxPresets.find(([label]) => label === nextPreset);
        if (!presetMatch) {
            return;
        }

        setExportViewBoxDraft([
            presetMatch[1][0],
            presetMatch[1][1],
            presetMatch[1][2],
            presetMatch[1][3],
        ]);
    }

    return (
        <div className="space-y-2">
            <label className="space-y-1">
                <span className="text-muted-foreground">ViewBox preset</span>
                <Select value={resolvedPreset} onValueChange={(value) => handlePresetChange(value as ExportViewBoxPreset)}>
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

function SvgPreview() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = useSnapshot(appSettings.export);

    const exportViewBoxDraft = useAtomValue(exportViewBoxDraftAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const previewWidth = Math.max(1e-6, exportViewBoxDraft[2]);
    const previewHeight = Math.max(1e-6, exportViewBoxDraft[3]);
    return (
        <div className="rounded border p-2">
            <p className="mb-2 text-[11px] text-muted-foreground">Live preview</p>
            <svg
                className="h-40 w-full rounded bg-muted/20"
                viewBox={`${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${previewWidth} ${previewHeight}`}
            >
                <defs>
                    <pattern id="export-preview-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                    </pattern>
                </defs>
                <rect
                    x={exportViewBoxDraft[0]}
                    y={exportViewBoxDraft[1]}
                    width={previewWidth}
                    height={previewHeight}
                    fill="url(#export-preview-grid)"
                />
                <path
                    d={pathValue || "M 0 0"}
                    fill={exportFill ? exportFillColor : "none"}
                    stroke={exportStroke ? exportStrokeColor : "none"}
                    strokeWidth={exportStroke ? exportStrokeWidth : 0}
                />
            <rect
                x={exportViewBoxDraft[0]}
                y={exportViewBoxDraft[1]}
                width={previewWidth}
                height={previewHeight}
                fill="none"
                stroke="oklch(0.6 0 0 / 0.75)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
            />
            </svg>
        </div>
    );
}

function exportSvgToFile({ pathValue, exportViewBoxDraft }: { pathValue: string; exportViewBoxDraft: ExportViewBoxDraft; }): boolean {
    if (!pathValue.trim()) {
        return false;
    }

    const { pathName } = appSettings.pathEditor;
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = appSettings.export;

    const width = Math.max(1e-6, exportViewBoxDraft[2]);
    const height = Math.max(1e-6, exportViewBoxDraft[3]);
    const fillPart = exportFill ? ` fill="${exportFillColor}"` : " fill=\"none\"";
    const strokePart = exportStroke
        ? ` stroke="${exportStrokeColor}" stroke-width="${exportStrokeWidth}"`
        : "";
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${width} ${height}"><path d="${pathValue}"${strokePart}${fillPart} /></svg>`;
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${(pathName || "svg-path").replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 200);
    return true;
}
