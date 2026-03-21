import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doClearPathAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom } from "@/store/0-atoms/2-2-editor-actions";
import { appSettings } from "@/store/0-ui-settings";

export function EditMenu() {
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);
    const pathValue = useAtomValue(svgPathInputAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);

    const doUndo = useSetAtom(doUndoPathAtom);
    const doRedo = useSetAtom(doRedoPathAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doClear = useSetAtom(doClearPathAtom);

    const hasPath = Boolean(pathValue.trim());

    async function copyPath() {
        if (!hasPath) return;
        await navigator.clipboard.writeText(pathValue);
    }

    function toggleMinify() {
        appSettings.pathEditor.minifyOutput = !minifyOutput;
        doNormalize();
    }

    return (
        <MenubarMenu>
            <MenubarTrigger className="px-2 text-xs">
                Edit
            </MenubarTrigger>

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
                <MenubarCheckboxItem checked={minifyOutput} disabled={!hasPath} onCheckedChange={toggleMinify}>
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
    );
}
