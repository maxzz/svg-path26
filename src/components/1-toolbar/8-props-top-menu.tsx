import { useEffect, useRef } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { doClearPathAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom } from "@/store/0-atoms/2-2-editor-actions";
import { aboutDialogOpenAtom, addImageDialogOpenAtom, exportSvgDialogOpenAtom, openPathDialogOpenAtom, savePathDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { isImageEditModeAtom, pendingImageAtom } from "@/store/0-atoms/2-4-images";
import { appSettings } from "@/store/0-ui-settings";
import { toggleTheme } from "@/utils";

export function TopMenu() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);
    const { theme } = useSnapshot(appSettings);
    const pathValue = useAtomValue(svgPathInputAtom);
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);

    const doUndo = useSetAtom(doUndoPathAtom);
    const doRedo = useSetAtom(doRedoPathAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doClear = useSetAtom(doClearPathAtom);

    const setOpenExportDialog = useSetAtom(exportSvgDialogOpenAtom);
    const setSaveDialogOpen = useSetAtom(savePathDialogOpenAtom);
    const setOpenDialogOpen = useSetAtom(openPathDialogOpenAtom);
    const setAboutDialogOpen = useSetAtom(aboutDialogOpenAtom);

    const fileRef = useRef<HTMLInputElement | null>(null);
    const hasPath = Boolean(pathValue.trim());
    const handleTopMenuKeyDown = useSetAtom(doHandleTopMenuKeyDownAtom);

    const openSaveDialog = () => setSaveDialogOpen(true);
    const openStoredPaths = () => setOpenDialogOpen(true);
    const openExportDialog = () => hasPath && setOpenExportDialog(true);
    const uploadImage = () => fileRef.current?.click();

    async function copyPath() {
        if (!hasPath) return;
        await navigator.clipboard.writeText(pathValue);
    }

    function toggleDarkCanvas() {
        appSettings.canvas.darkCanvas = !darkCanvas;
    }

    function toggleImageEditMode() {
        setIsImageEditMode(!isImageEditMode);
    }

    function toggleMinify() {
        appSettings.pathEditor.minifyOutput = !minifyOutput;
        doNormalize();
    }

    useEffect(
        () => {
            const controller = new AbortController();
            window.addEventListener("keydown", handleTopMenuKeyDown, { signal: controller.signal });
            return () => controller.abort();
        },
        [handleTopMenuKeyDown]
    );

    return (<>
        <ImageUploadInput fileRef={fileRef} />

        <Menubar className="h-auto border-none bg-transparent p-0 shadow-none">
            <MenubarMenu>
                <MenubarTrigger className="px-3 text-xs font-medium">File</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={openStoredPaths}>
                        Open Saved Path...
                        <MenubarShortcut>Ctrl+O</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem disabled={!hasPath} onClick={openSaveDialog}>
                        Save Path...
                        <MenubarShortcut>Ctrl+S</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem disabled={!hasPath} onClick={openExportDialog}>
                        Export SVG...
                        <MenubarShortcut>Ctrl+E</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onClick={uploadImage}>
                        Upload Image...
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger className="px-3 text-xs font-medium">Edit</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem disabled={!canUndo} onClick={() => doUndo()}>
                        Undo
                        <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem disabled={!canRedo} onClick={() => doRedo()}>
                        Redo
                        <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
                    </MenubarItem>

                    <MenubarSeparator />

                    <MenubarItem disabled={!hasPath} onClick={() => doNormalize()}>
                        Normalize
                        <MenubarShortcut>Alt+N</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem disabled={!hasPath} onClick={() => doSetAbsolute()}>
                        Convert to Absolute
                        <MenubarShortcut>Alt+A</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem disabled={!hasPath} onClick={() => doSetRelative()}>
                        Convert to Relative
                        <MenubarShortcut>Alt+R</MenubarShortcut>
                    </MenubarItem>
                    <MenubarCheckboxItem checked={minifyOutput} disabled={!hasPath} onCheckedChange={() => toggleMinify()}>
                        Minify Path
                        <MenubarShortcut>Alt+M</MenubarShortcut>
                    </MenubarCheckboxItem>

                    <MenubarSeparator />

                    <MenubarItem disabled={!hasPath} onClick={() => void copyPath()}>
                        Copy Path
                        <MenubarShortcut>Alt+C</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem disabled={!hasPath} onClick={() => doClear()}>
                        Clear Path
                        <MenubarShortcut>Alt+X</MenubarShortcut>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger className="px-3 text-xs font-medium">View</MenubarTrigger>
                <MenubarContent>
                    <MenubarCheckboxItem checked={darkCanvas} onCheckedChange={() => toggleDarkCanvas()}>
                        Dark Canvas
                        <MenubarShortcut>Alt+D</MenubarShortcut>
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem checked={isImageEditMode} onCheckedChange={() => toggleImageEditMode()}>
                        Image Edit Mode
                        <MenubarShortcut>Alt+I</MenubarShortcut>
                    </MenubarCheckboxItem>

                    <MenubarSeparator />

                    <MenubarItem onClick={() => toggleTheme(theme)}>
                        Toggle Theme
                        <MenubarShortcut>Alt+T</MenubarShortcut>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger className="px-3 text-xs font-medium">Help</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={() => setAboutDialogOpen(true)}>
                        About
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>

    </>);
}

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;

    const tagName = target.tagName;
    return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
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

const doHandleTopMenuKeyDownAtom = atom(
    null,
    (get, set, event: KeyboardEvent) => {
        const target = event.target;
        if (isEditableTarget(target)) return;

        const key = event.key.toLowerCase();
        const withPrimary = event.ctrlKey || event.metaKey;
        const withAltOnly = event.altKey && !withPrimary && !event.shiftKey;
        const hasPath = Boolean(get(svgPathInputAtom).trim());

        if (withPrimary && !event.shiftKey && key === "o") {
            event.preventDefault();
            set(openPathDialogOpenAtom, true);
            return;
        }
        if (withPrimary && !event.shiftKey && key === "s") {
            event.preventDefault();
            set(savePathDialogOpenAtom, true);
            return;
        }
        if (withPrimary && !event.shiftKey && key === "e") {
            if (!hasPath) return;
            event.preventDefault();
            set(exportSvgDialogOpenAtom, true);
            return;
        }
        if (!withAltOnly) return;

        if (key === "n") {
            if (!hasPath) return;
            event.preventDefault();
            set(doNormalizePathAtom);
            return;
        }
        if (key === "a") {
            if (!hasPath) return;
            event.preventDefault();
            set(doSetAbsoluteAtom);
            return;
        }
        if (key === "r") {
            if (!hasPath) return;
            event.preventDefault();
            set(doSetRelativeAtom);
            return;
        }
        if (key === "m") {
            if (!hasPath) return;
            event.preventDefault();
            appSettings.pathEditor.minifyOutput = !appSettings.pathEditor.minifyOutput;
            set(doNormalizePathAtom);
            return;
        }
        if (key === "d") {
            event.preventDefault();
            appSettings.canvas.darkCanvas = !appSettings.canvas.darkCanvas;
            return;
        }
        if (key === "i") {
            event.preventDefault();
            set(isImageEditModeAtom, !get(isImageEditModeAtom));
            return;
        }
        if (key === "t") {
            event.preventDefault();
            toggleTheme(appSettings.theme);
            return;
        }
        if (key === "c") {
            if (!hasPath) return;
            event.preventDefault();
            void navigator.clipboard.writeText(get(svgPathInputAtom));
            return;
        }
        if (key === "x") {
            if (!hasPath) return;
            event.preventDefault();
            set(doClearPathAtom);
        }
    }
);
