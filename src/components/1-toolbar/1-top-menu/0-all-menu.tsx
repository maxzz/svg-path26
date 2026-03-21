import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Menubar } from "@/components/ui/shadcn/menubar";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { doClearPathAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom } from "@/store/0-atoms/2-2-editor-actions";
import { aboutDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { appSettings } from "@/store/0-ui-settings";
import { toggleTheme } from "@/utils";
import { doHandleTopMenuKeyDownAtom } from "./1-top-menu-shortcuts";
import { FileMenu } from "./2-file-menu";
import { EditMenu } from "./3-edit-menu";
import { ViewMenu } from "./4-view-menu";
import { HelpMenu } from "./5-help-menu";

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

    const setAboutDialogOpen = useSetAtom(aboutDialogOpenAtom);

    const hasPath = Boolean(pathValue.trim());
    const handleTopMenuKeyDown = useSetAtom(doHandleTopMenuKeyDownAtom);

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

    useEffect(() => {
        const controller = new AbortController();
        window.addEventListener("keydown", handleTopMenuKeyDown, { signal: controller.signal });
        return () => controller.abort();
    }, [handleTopMenuKeyDown]);

    return (<>
        <Menubar className="h-auto border-none bg-transparent p-0 shadow-none">
            <FileMenu />
            <EditMenu
                canUndo={canUndo}
                canRedo={canRedo}
                hasPath={hasPath}
                minifyOutput={minifyOutput}
                onUndo={() => doUndo()}
                onRedo={() => doRedo()}
                onNormalize={() => doNormalize()}
                onSetAbsolute={() => doSetAbsolute()}
                onSetRelative={() => doSetRelative()}
                onToggleMinify={() => toggleMinify()}
                onCopyPath={() => void copyPath()}
                onClearPath={() => doClear()}
            />
            <ViewMenu
                darkCanvas={darkCanvas}
                isImageEditMode={isImageEditMode}
                onToggleDarkCanvas={() => toggleDarkCanvas()}
                onToggleImageEditMode={() => toggleImageEditMode()}
                onToggleTheme={() => toggleTheme(theme)}
            />
            <HelpMenu onOpenAbout={() => setAboutDialogOpen(true)} />
        </Menubar>

    </>);
}
