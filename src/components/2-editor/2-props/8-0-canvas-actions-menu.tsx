import { useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { AddImageDialog } from "./8-2-add-image-dialog";
import { ExportSvgDialog } from "./8-1-export-svg-dialog";
import { SavePathDialog } from "./8-3-save-path-dialog";
import { OpenPathDialog } from "./8-4-open-path-dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import {
    doClearPathAtom,
    doNormalizePathAtom,
    doSetAbsoluteAtom,
    doSetRelativeAtom,
} from "@/store/0-atoms/2-2-editor-actions";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doAddImageAtom, isImageEditModeAtom, type EditorImage } from "@/store/0-atoms/2-4-images";
import {
    addImageDialogOpenAtom,
    exportSvgDialogOpenAtom,
    openPathDialogOpenAtom,
    savePathDialogOpenAtom,
} from "@/store/0-atoms/2-5-canvas-actions-menu";
import { appSettings } from "@/store/0-ui-settings";

export function CanvasActionsMenu() {
    const uiSettings = useSnapshot(appSettings);
    const pathValue = useAtomValue(svgPathInputAtom);
    const { minifyOutput: minified } = useSnapshot(appSettings.pathEditor);
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);

    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doClear = useSetAtom(doClearPathAtom);
    const doAddImage = useSetAtom(doAddImageAtom);

    const [openImageDialog, setOpenImageDialog] = useAtom(addImageDialogOpenAtom);
    const [pendingImage, setPendingImage] = useState<Omit<EditorImage, "id"> | null>(null);
    const setOpenExportDialog = useSetAtom(exportSvgDialogOpenAtom);
    const setSaveDialogOpen = useSetAtom(savePathDialogOpenAtom);
    const setOpenDialogOpen = useSetAtom(openPathDialogOpenAtom);
    const fileRef = useRef<HTMLInputElement | null>(null);

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
                    <DropdownMenuItem onSelect={() => setSaveDialogOpen(true)}>
                        Save Path
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setOpenDialogOpen(true)}>
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

            <SavePathDialog />
            <OpenPathDialog />

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


function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
