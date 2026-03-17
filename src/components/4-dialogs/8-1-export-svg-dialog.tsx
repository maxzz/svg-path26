import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Switch } from "@/components/ui/shadcn/switch";
import { NumberField } from "../2-editor/2-props/8-helpers";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doResetExportViewBoxDraftAtom, exportSvgDialogOpenAtom, exportViewBoxDraftAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";
import { appSettings } from "@/store/0-ui-settings";

export function ExportSvgDialog() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const [openExportDialog, setOpenExportDialog] = useAtom(exportSvgDialogOpenAtom);
    const [exportViewBoxDraft, setExportViewBoxDraft] = useAtom(exportViewBoxDraftAtom);
    const resetExportViewBox = useSetAtom(doResetExportViewBoxDraftAtom);
    const { pathName } = useSnapshot(appSettings.pathEditor);
    const {
        exportFill,
        exportFillColor,
        exportStroke,
        exportStrokeColor,
        exportStrokeWidth,
    } = useSnapshot(appSettings.export);

    const handleExport = () => {
        if (!pathValue.trim()) return;

        const width = Math.max(1e-6, exportViewBoxDraft[2]);
        const height = Math.max(1e-6, exportViewBoxDraft[3]);
        const fillPart = exportFill ? ` fill="${exportFillColor}"` : " fill=\"none\"";
        const strokePart = exportStroke
            ? ` stroke="${exportStrokeColor}" stroke-width="${exportStrokeWidth}"`
            : "";
        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${width} ${height}"><path d="${pathValue}"${strokePart}${fillPart} /></svg>`;
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(pathName || "svg-path").replace(/\s+/g, "-")}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 200);
        setOpenExportDialog(false);
    };

    return (
        <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Export SVG</DialogTitle>
                    <DialogDescription>Export current path with chosen styling.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center justify-between rounded border px-2 py-1.5">
                            <span>Fill</span>
                            <Switch
                                checked={exportFill}
                                onCheckedChange={(checked) => {
                                    appSettings.export.exportFill = Boolean(checked);
                                }}
                            />
                        </label>
                        <label className="flex items-center justify-between rounded border px-2 py-1.5">
                            <span>Stroke</span>
                            <Switch
                                checked={exportStroke}
                                onCheckedChange={(checked) => {
                                    appSettings.export.exportStroke = Boolean(checked);
                                }}
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-muted-foreground">Fill color</span>
                            <Input
                                type="color"
                                value={exportFillColor}
                                onChange={(event) => {
                                    appSettings.export.exportFillColor = event.target.value;
                                }}
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-muted-foreground">Stroke color</span>
                            <Input
                                type="color"
                                value={exportStrokeColor}
                                onChange={(event) => {
                                    appSettings.export.exportStrokeColor = event.target.value;
                                }}
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-muted-foreground">Stroke width</span>
                            <Input
                                type="number"
                                min={0}
                                step={0.05}
                                value={exportStrokeWidth}
                                onChange={(event) => {
                                    appSettings.export.exportStrokeWidth = Number(event.target.value);
                                }}
                            />
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

                    <div className="rounded border p-2">
                        <p className="mb-2 text-[11px] text-muted-foreground">Live preview</p>
                        <svg
                            className="h-40 w-full rounded bg-muted/20"
                            viewBox={`${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${Math.max(1e-6, exportViewBoxDraft[2])} ${Math.max(1e-6, exportViewBoxDraft[3])}`}
                        >
                            <defs>
                                <pattern id="export-preview-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                                </pattern>
                            </defs>
                            <rect
                                x={exportViewBoxDraft[0]}
                                y={exportViewBoxDraft[1]}
                                width={Math.max(1e-6, exportViewBoxDraft[2])}
                                height={Math.max(1e-6, exportViewBoxDraft[3])}
                                fill="url(#export-preview-grid)"
                            />
                            <path
                                d={pathValue || "M 0 0"}
                                fill={exportFill ? exportFillColor : "none"}
                                stroke={exportStroke ? exportStrokeColor : "none"}
                                strokeWidth={exportStroke ? exportStrokeWidth : 0}
                            />
                        </svg>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenExportDialog(false)}>Cancel</Button>
                    <Button onClick={handleExport}>Export</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}