import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { commandRowsAtom } from "@/store/0-atoms/2-0-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doCenterSelectedSegmentsIntoViewBoxAtom, doClearPathAtom, doNormalizePathAtom, doSelectAllCommandsAtom, doSetAbsoluteAtom, doSetRelativeAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { scaleToViewBoxDialogOpenAtom } from "@/components/4-dialogs/7-scale-to-viewbox/8-scale-to-viewbox-atoms";
import { appSettings } from "@/store/0-ui-settings";

export function EditMenu() {
    const { minifyOutput } = useSnapshot(appSettings.pathEditor);
    const pathValue = useAtomValue(svgPathInputAtom);
    const commandRows = useAtomValue(commandRowsAtom);
    const selectedCommandIndices = useAtomValue(selectedCommandIndicesAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);

    const doUndo = useSetAtom(doUndoPathAtom);
    const doRedo = useSetAtom(doRedoPathAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doClear = useSetAtom(doClearPathAtom);
    const doSelectAll = useSetAtom(doSelectAllCommandsAtom);
    const doCenter = useSetAtom(doCenterSelectedSegmentsIntoViewBoxAtom);
    const setScaleToViewBoxDialogOpen = useSetAtom(scaleToViewBoxDialogOpenAtom);

    const hasPath = Boolean(pathValue.trim());
    const canSelectAll = commandRows.length > 0;
    const hasSelection = selectedCommandIndices.length > 0;

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

                <MenubarItem disabled={!canSelectAll} onClick={() => doSelectAll()}>
                    Select All
                    <MenubarShortcut>Ctrl+A</MenubarShortcut>
                </MenubarItem>

                <MenubarSub>
                    <MenubarSubTrigger>Center</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarItem disabled={!hasSelection} onClick={() => doCenter({ axis: "both" })}>
                            Center X+Y
                        </MenubarItem>
                        <MenubarItem disabled={!hasSelection} onClick={() => doCenter({ axis: "x" })}>
                            Center X
                        </MenubarItem>
                        <MenubarItem disabled={!hasSelection} onClick={() => doCenter({ axis: "y" })}>
                            Center Y
                        </MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>

                <MenubarItem disabled={!hasSelection} onClick={() => setScaleToViewBoxDialogOpen(true)}>
                    Scale to viewBox...
                </MenubarItem>

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
