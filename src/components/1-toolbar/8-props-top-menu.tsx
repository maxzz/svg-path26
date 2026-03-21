import { useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/shadcn/dropdown-menu";
import { doClearPathAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom } from "@/store/0-atoms/2-2-editor-actions";
import { addImageDialogOpenAtom, exportSvgDialogOpenAtom, openPathDialogOpenAtom, savePathDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { isImageEditModeAtom, pendingImageAtom } from "@/store/0-atoms/2-4-images";
import { appSettings } from "@/store/0-ui-settings";

export function CanvasActionsMenu() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);
    const pathValue = useAtomValue(svgPathInputAtom);
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);

    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doClear = useSetAtom(doClearPathAtom);

    const setOpenExportDialog = useSetAtom(exportSvgDialogOpenAtom);
    const setSaveDialogOpen = useSetAtom(savePathDialogOpenAtom);
    const setOpenDialogOpen = useSetAtom(openPathDialogOpenAtom);

    const fileRef = useRef<HTMLInputElement | null>(null);

    return (<>
        <ImageUploadInput fileRef={fileRef} />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-7" title="More actions">
                    <IconRadix_DotsHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem checked={darkCanvas} onCheckedChange={(checked) => { appSettings.canvas.darkCanvas = Boolean(checked); }}>
                    Dark Canvas
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={isImageEditMode} onCheckedChange={(checked) => setIsImageEditMode(Boolean(checked))}>
                    Image Edit Mode
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="pl-8" onSelect={() => doNormalize()}>
                    Normalize...
                </DropdownMenuItem>
                <DropdownMenuItem className="pl-8" onSelect={() => doSetAbsolute()}>
                    To Abs...
                </DropdownMenuItem>
                <DropdownMenuItem className="pl-8" onSelect={() => doSetRelative()}>
                    To Rel...
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem checked={minifyOutput} onCheckedChange={(checked) => { appSettings.pathEditor.minifyOutput = Boolean(checked); doNormalize(); }}>
                    Minify path
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="pl-8" onSelect={() => setSaveDialogOpen(true)}>
                    Save Path to browser storage
                </DropdownMenuItem>
                <DropdownMenuItem className="pl-8" onSelect={() => setOpenDialogOpen(true)}>
                    Open saved path
                </DropdownMenuItem>
                <DropdownMenuItem className="pl-8" disabled={!pathValue.trim()} onSelect={() => setOpenExportDialog(true)}>
                    Export SVG
                </DropdownMenuItem>
                <DropdownMenuItem className="pl-8" onSelect={() => fileRef.current?.click()}>
                    Upload Image
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="pl-8" disabled={!pathValue} onSelect={async () => { !!pathValue && await navigator.clipboard.writeText(pathValue); }}>
                    Copy
                </DropdownMenuItem>
                <DropdownMenuItem className="pl-8" disabled={!pathValue} onSelect={() => doClear()}>
                    Clear
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    </>);
}

function ImageUploadInput({ fileRef }: { fileRef: React.RefObject<HTMLInputElement | null>; }) {
    const setPendingImage = useSetAtom(pendingImageAtom);
    const setOpenImageDialog = useSetAtom(addImageDialogOpenAtom);

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
        <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileInputChange}
        />
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
