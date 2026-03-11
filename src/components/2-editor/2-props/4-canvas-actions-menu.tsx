import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Switch } from "@/components/ui/shadcn/switch";
import {
    doClearPathAtom,
    doDeleteNamedPathAtom,
    doNormalizePathAtom,
    doOpenNamedPathAtom,
    doSaveNamedPathAtom,
    doSetAbsoluteAtom,
    doSetMinifyAtom,
    doSetRelativeAtom,
    exportFillAtom,
    exportFillColorAtom,
    exportStrokeAtom,
    exportStrokeColorAtom,
    exportStrokeWidthAtom,
    minifyOutputAtom,
    pathNameAtom,
} from "@/store/0-atoms/2-2-editor-actions";
import { viewPortHeightAtom, viewPortWidthAtom, viewPortXAtom, viewPortYAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { storedPathsAtom } from "@/store/0-atoms/2-3-stored-paths-actions";
import { doAddImageAtom, isImageEditModeAtom, type EditorImage } from "@/store/0-atoms/2-4-images";
import {
    appSettings,
} from "@/store/0-ui-settings";
import { SvgPathModel } from "@/svg-core/2-svg-model";

export function CanvasActionsMenu() {
    const settings = useSnapshot(appSettings);
    const minified = useAtomValue(minifyOutputAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const storedPaths = useAtomValue(storedPathsAtom);
    const [pathName, setPathName] = useAtom(pathNameAtom);
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);
    const [exportFill, setExportFill] = useAtom(exportFillAtom);
    const [exportFillColor, setExportFillColor] = useAtom(exportFillColorAtom);
    const [exportStroke, setExportStroke] = useAtom(exportStrokeAtom);
    const [exportStrokeColor, setExportStrokeColor] = useAtom(exportStrokeColorAtom);
    const [exportStrokeWidth, setExportStrokeWidth] = useAtom(exportStrokeWidthAtom);
    const exportX = useAtomValue(viewPortXAtom);
    const exportY = useAtomValue(viewPortYAtom);
    const exportWidth = useAtomValue(viewPortWidthAtom);
    const exportHeight = useAtomValue(viewPortHeightAtom);

    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doClear = useSetAtom(doClearPathAtom);
    const doSetMinify = useSetAtom(doSetMinifyAtom);
    const doSaveNamedPath = useSetAtom(doSaveNamedPathAtom);
    const doDeleteNamedPath = useSetAtom(doDeleteNamedPathAtom);
    const doOpenNamedPath = useSetAtom(doOpenNamedPathAtom);
    const doAddImage = useSetAtom(doAddImageAtom);

    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [openOpenDialog, setOpenOpenDialog] = useState(false);
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [saveNameDraft, setSaveNameDraft] = useState(pathName || "My path");
    const [pendingImage, setPendingImage] = useState<Omit<EditorImage, "id"> | null>(null);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [exportViewBoxDraft, setExportViewBoxDraft] = useState({
        x: exportX,
        y: exportY,
        width: exportWidth,
        height: exportHeight,
    });

    const sortedStored = useMemo(
        () => [...storedPaths].sort((a, b) => b.updatedAt - a.updatedAt),
        [storedPaths],
    );

    const resetExportViewBox = () => {
        const next = computeExportViewBox(pathValue, exportStroke ? exportStrokeWidth : 0, {
            x: exportX,
            y: exportY,
            width: exportWidth,
            height: exportHeight,
        });
        setExportViewBoxDraft(next);
    };

    useEffect(() => {
        if (!openExportDialog) return;
        resetExportViewBox();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openExportDialog, pathValue, exportStroke, exportStrokeWidth, exportX, exportY, exportWidth, exportHeight]);

    const handleCopy = async () => {
        if (!pathValue) return;
        await navigator.clipboard.writeText(pathValue);
    };

    const handleExport = () => {
        if (!pathValue.trim()) return;
        const width = Math.max(1e-6, exportViewBoxDraft.width);
        const height = Math.max(1e-6, exportViewBoxDraft.height);
        const fillPart = exportFill ? ` fill="${exportFillColor}"` : " fill=\"none\"";
        const strokePart = exportStroke
            ? ` stroke="${exportStrokeColor}" stroke-width="${exportStrokeWidth}"`
            : "";
        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${exportViewBoxDraft.x} ${exportViewBoxDraft.y} ${width} ${height}"><path d="${pathValue}"${strokePart}${fillPart} /></svg>`;
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

    const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        const data = await fileToDataUrl(file);
        setPendingImage({
            data,
            x1: 0,
            y1: 0,
            x2: 20,
            y2: 20,
            preserveAspectRatio: true,
            opacity: 1,
        });
        setOpenImageDialog(true);
        event.target.value = "";
    };

    return (
        <>
            <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileInputChange}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="size-7" title="More actions">
                        <IconRadix_DotsHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                        checked={settings.showGrid}
                        onCheckedChange={(checked) => {
                            appSettings.showGrid = Boolean(checked);
                        }}
                    >
                        Grid
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={settings.showHelpers}
                        onCheckedChange={(checked) => {
                            appSettings.showHelpers = Boolean(checked);
                        }}
                    >
                        Helpers
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={settings.darkCanvas}
                        onCheckedChange={(checked) => {
                            appSettings.darkCanvas = Boolean(checked);
                        }}
                    >
                        Dark Canvas
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={isImageEditMode}
                        onCheckedChange={(checked) => setIsImageEditMode(Boolean(checked))}
                    >
                        Image Edit Mode
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => doNormalize()}>
                        Normalize
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => doSetAbsolute()}>
                        To Abs
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => doSetRelative()}>
                        To Rel
                    </DropdownMenuItem>
                    <DropdownMenuCheckboxItem
                        checked={minified}
                        onCheckedChange={(checked) => doSetMinify(Boolean(checked))}
                    >
                        Minify
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setOpenSaveDialog(true)}>
                        Save Path
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setOpenOpenDialog(true)}>
                        Open Path
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={!pathValue.trim()}
                        onSelect={() => setOpenExportDialog(true)}
                    >
                        Export SVG
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                        Upload Image
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        disabled={!pathValue}
                        onSelect={async () => {
                            await handleCopy();
                        }}
                    >
                        Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={!pathValue}
                        onSelect={() => doClear()}
                    >
                        Clear
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={openSaveDialog} onOpenChange={setOpenSaveDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Save path</DialogTitle>
                        <DialogDescription>Save current path in browser storage.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label className="text-xs">Name</label>
                        <Input
                            value={saveNameDraft}
                            onChange={(event) => setSaveNameDraft(event.target.value)}
                            placeholder="My path"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenSaveDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!pathValue.trim() || !saveNameDraft.trim()}
                            onClick={() => {
                                doSaveNamedPath(saveNameDraft);
                                setPathName(saveNameDraft.trim());
                                setOpenSaveDialog(false);
                            }}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openOpenDialog} onOpenChange={setOpenOpenDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Open saved path</DialogTitle>
                        <DialogDescription>
                            Choose a path from browser storage.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-80 space-y-2 overflow-auto">
                        {sortedStored.length === 0 && (
                            <p className="text-xs text-muted-foreground">No saved paths yet.</p>
                        )}
                        {sortedStored.map((entry) => {
                            const preview = getPathPreview(entry.path);
                            return (
                                <div key={entry.name} className="flex items-center gap-3 rounded border p-2">
                                    <svg viewBox={preview.viewBox} className="h-10 w-16 rounded bg-muted/20">
                                        <path d={entry.path} fill="none" stroke="currentColor" strokeWidth={preview.strokeWidth} />
                                    </svg>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium">{entry.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Updated {new Date(entry.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-7 px-2"
                                        onClick={() => {
                                            doOpenNamedPath(entry.name);
                                            setOpenOpenDialog(false);
                                        }}
                                    >
                                        Open
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-7 px-2 text-destructive"
                                        onClick={() => doDeleteNamedPath(entry.name)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

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
                                <Switch checked={exportFill} onCheckedChange={(checked) => setExportFill(Boolean(checked))} />
                            </label>
                            <label className="flex items-center justify-between rounded border px-2 py-1.5">
                                <span>Stroke</span>
                                <Switch checked={exportStroke} onCheckedChange={(checked) => setExportStroke(Boolean(checked))} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-muted-foreground">Fill color</span>
                                <Input type="color" value={exportFillColor} onChange={(event) => setExportFillColor(event.target.value)} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-muted-foreground">Stroke color</span>
                                <Input type="color" value={exportStrokeColor} onChange={(event) => setExportStrokeColor(event.target.value)} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-muted-foreground">Stroke width</span>
                                <Input
                                    type="number"
                                    min={0}
                                    step={0.05}
                                    value={exportStrokeWidth}
                                    onChange={(event) => setExportStrokeWidth(Number(event.target.value))}
                                />
                            </label>
                            <div className="col-span-2 grid grid-cols-4 gap-2 rounded border px-2 py-2">
                                <NumberField
                                    label="x"
                                    value={exportViewBoxDraft.x}
                                    onChange={(value) => setExportViewBoxDraft((previous) => ({ ...previous, x: value }))}
                                />
                                <NumberField
                                    label="y"
                                    value={exportViewBoxDraft.y}
                                    onChange={(value) => setExportViewBoxDraft((previous) => ({ ...previous, y: value }))}
                                />
                                <NumberField
                                    label="width"
                                    min={0.000001}
                                    value={exportViewBoxDraft.width}
                                    onChange={(value) => setExportViewBoxDraft((previous) => ({ ...previous, width: value }))}
                                />
                                <NumberField
                                    label="height"
                                    min={0.000001}
                                    value={exportViewBoxDraft.height}
                                    onChange={(value) => setExportViewBoxDraft((previous) => ({ ...previous, height: value }))}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="col-span-2 h-7 px-2"
                                onClick={resetExportViewBox}
                            >
                                Reset viewBox from path bounds
                            </Button>
                        </div>

                        <div className="rounded border p-2">
                            <p className="mb-2 text-[11px] text-muted-foreground">Live preview</p>
                            <svg
                                className="h-40 w-full rounded bg-muted/20"
                                viewBox={`${exportViewBoxDraft.x} ${exportViewBoxDraft.y} ${Math.max(1e-6, exportViewBoxDraft.width)} ${Math.max(1e-6, exportViewBoxDraft.height)}`}
                            >
                                <defs>
                                    <pattern id="export-preview-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                                    </pattern>
                                </defs>
                                <rect
                                    x={exportViewBoxDraft.x}
                                    y={exportViewBoxDraft.y}
                                    width={Math.max(1e-6, exportViewBoxDraft.width)}
                                    height={Math.max(1e-6, exportViewBoxDraft.height)}
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

            <Dialog open={openImageDialog} onOpenChange={setOpenImageDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add image to canvas</DialogTitle>
                        <DialogDescription>Set initial image placement.</DialogDescription>
                    </DialogHeader>
                    {pendingImage && (
                        <div className="space-y-3">
                            <img src={pendingImage.data} alt="upload preview" className="max-h-36 w-full rounded border object-contain" />
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <NumberField
                                    label="x"
                                    value={pendingImage.x1}
                                    onChange={(value) => setPendingImage({ ...pendingImage, x1: value })}
                                />
                                <NumberField
                                    label="y"
                                    value={pendingImage.y1}
                                    onChange={(value) => setPendingImage({ ...pendingImage, y1: value })}
                                />
                                <NumberField
                                    label="width"
                                    value={pendingImage.x2 - pendingImage.x1}
                                    min={0.1}
                                    onChange={(value) => setPendingImage({ ...pendingImage, x2: pendingImage.x1 + value })}
                                />
                                <NumberField
                                    label="height"
                                    value={pendingImage.y2 - pendingImage.y1}
                                    min={0.1}
                                    onChange={(value) => setPendingImage({ ...pendingImage, y2: pendingImage.y1 + value })}
                                />
                                <label className="col-span-2 flex items-center justify-between rounded border px-2 py-1.5">
                                    <span>Preserve aspect ratio</span>
                                    <Switch
                                        checked={pendingImage.preserveAspectRatio}
                                        onCheckedChange={(checked) => setPendingImage({ ...pendingImage, preserveAspectRatio: Boolean(checked) })}
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenImageDialog(false)}>Cancel</Button>
                        <Button
                            disabled={!pendingImage}
                            onClick={() => {
                                if (!pendingImage) return;
                                doAddImage(pendingImage);
                                setOpenImageDialog(false);
                                setIsImageEditMode(true);
                            }}
                        >
                            Add image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function NumberField({ label, value, onChange, min }: { label: string; value: number; onChange: (value: number) => void; min?: number; }) {
    return (
        <label className="space-y-1">
            <span className="text-muted-foreground">{label}</span>
            <Input
                type="number"
                value={value}
                min={min}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </label>
    );
}

export function computeExportViewBox(
    path: string,
    strokePadding: number,
    fallback: { x: number; y: number; width: number; height: number; },
) {
    try {
        const model = new SvgPathModel(path);
        const bounds = model.getBounds();
        const width = Math.max(1e-6, bounds.xmax - bounds.xmin);
        const height = Math.max(1e-6, bounds.ymax - bounds.ymin);
        const pad = Math.max(0, strokePadding);
        return {
            x: bounds.xmin - pad,
            y: bounds.ymin - pad,
            width: width + 2 * pad,
            height: height + 2 * pad,
        };
    } catch {
        return fallback;
    }
}

function getPathPreview(path: string): { viewBox: string; strokeWidth: number; } {
    try {
        const model = new SvgPathModel(path);
        const bounds = model.getBounds();
        const width = Math.max(2, bounds.xmax - bounds.xmin);
        const height = Math.max(2, bounds.ymax - bounds.ymin);
        const pad = Math.max(width, height) * 0.2 + 0.5;
        return {
            viewBox: `${bounds.xmin - pad} ${bounds.ymin - pad} ${width + pad * 2} ${height + pad * 2}`,
            strokeWidth: Math.max(width, height) / 35,
        };
    } catch {
        return { viewBox: "0 0 10 10", strokeWidth: 0.5 };
    }
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
