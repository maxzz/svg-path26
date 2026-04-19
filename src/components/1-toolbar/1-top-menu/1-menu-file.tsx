import { useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { MenubarContent, MenubarItem, MenubarMenu, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { addImageDialogOpenAtom, exportSvgDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { pendingImageAtom } from "@/store/0-atoms/2-8-images";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";

export function FileMenu() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const setOpenExportDialog = useSetAtom(exportSvgDialogOpenAtom);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const hasPath = Boolean(pathValue.trim());

    return (<>
        <ImageUploadInput fileRef={fileRef} />

        <MenubarMenu>
            <MenubarTrigger className="px-2 text-xs">
                File
            </MenubarTrigger>

            <MenubarContent>
                <MenubarItem disabled={!hasPath} onClick={() => setOpenExportDialog(true)}>
                    Export SVG... <MenubarShortcut>Ctrl+E</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={() => fileRef.current?.click()}>
                    Upload Image...
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
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
    return new Promise(
        (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        }
    );
}
