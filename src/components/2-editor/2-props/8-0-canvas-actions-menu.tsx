import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { AddImageDialog } from "./8-2-add-image-dialog";
import { ExportSvgDialog } from "./8-1-export-svg-dialog";
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
    doNormalizePathAtom,
    doSetAbsoluteAtom,
    doSetRelativeAtom,
} from "@/store/0-atoms/2-2-editor-actions";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doDeleteNamedPathAtom, doOpenNamedPathAtom, doSaveNamedPathAtom } from "@/store/0-atoms/2-3-stored-paths-actions";
import { doAddImageAtom, isImageEditModeAtom, type EditorImage } from "@/store/0-atoms/2-4-images";
import {
    addImageDialogOpenAtom,
    exportSvgDialogOpenAtom,
    openPathDialogOpenAtom,
    savePathDialogOpenAtom,
} from "@/store/0-atoms/2-5-canvas-actions-menu";
import {
    appSettings,
} from "@/store/0-ui-settings";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { computeExportViewBox } from "./8-helpers";

export function CanvasActionsMenu() {
    const uiSettings = useSnapshot(appSettings);
    const pathValue = useAtomValue(svgPathInputAtom);
    const {
        minifyOutput: minified,
        storedPaths,
        pathName,
        exportStroke,
        exportStrokeWidth,
    } = useSnapshot(appSettings.pathEditor);
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);

    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doClear = useSetAtom(doClearPathAtom);
    const doSaveNamedPath = useSetAtom(doSaveNamedPathAtom);
    const doDeleteNamedPath = useSetAtom(doDeleteNamedPathAtom);
    const doOpenNamedPath = useSetAtom(doOpenNamedPathAtom);
    const doAddImage = useSetAtom(doAddImageAtom);

    const [openSaveDialog, setOpenSaveDialog] = useAtom(savePathDialogOpenAtom);
    const [openOpenDialog, setOpenOpenDialog] = useAtom(openPathDialogOpenAtom);
    const [openImageDialog, setOpenImageDialog] = useAtom(addImageDialogOpenAtom);
    const [saveNameDraft, setSaveNameDraft] = useState(pathName || "My path");
    const [pendingImage, setPendingImage] = useState<Omit<EditorImage, "id"> | null>(null);
    const setOpenExportDialog = useSetAtom(exportSvgDialogOpenAtom);
    const fileRef = useRef<HTMLInputElement | null>(null);

    const sortedStored = useMemo(
        () => [...storedPaths].sort((a, b) => b.updatedAt - a.updatedAt),
        [storedPaths],
    );

    const handleCopy = async () => {
        if (!pathValue) return;
        await navigator.clipboard.writeText(pathValue);
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
                        checked={uiSettings.showGrid}
                        onCheckedChange={(checked) => {
                            appSettings.showGrid = Boolean(checked);
                        }}
                    >
                        Grid
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={uiSettings.showHelpers}
                        onCheckedChange={(checked) => {
                            appSettings.showHelpers = Boolean(checked);
                        }}
                    >
                        Helpers
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={uiSettings.darkCanvas}
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
                        Normalize...
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => doSetAbsolute()}>
                        To Abs...
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => doSetRelative()}>
                        To Rel...
                    </DropdownMenuItem>
                    <DropdownMenuCheckboxItem
                        checked={minified}
                        onCheckedChange={(checked) => {
                            appSettings.pathEditor.minifyOutput = Boolean(checked);
                            doNormalize();
                        }}
                    >
                        Minify...
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

            <ExportSvgDialog />

            <AddImageDialog
                open={openImageDialog}
                onOpenChange={setOpenImageDialog}
                pendingImage={pendingImage}
                setPendingImage={setPendingImage}
                onAddImage={() => {
                    if (!pendingImage) return;
                    doAddImage(pendingImage);
                    setOpenImageDialog(false);
                    setIsImageEditMode(true);
                }}
            />
        </>
    );
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
