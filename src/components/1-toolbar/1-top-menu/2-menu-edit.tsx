import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { canRedoAtom, canUndoAtom, doRedoPathAtom, doUndoPathAtom } from "@/store/0-atoms/1-2-history";
import { commandRowsAtom } from "@/store/0-atoms/2-0-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doClearPathAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { doSelectAllCommandsAtom } from "@/store/1-atoms-commands/2-select-all";
import { scaleToViewBoxDialogOpenAtom } from "@/components/4-dialogs/7-1-scale-to-viewbox/1-scale-to-viewbox-atoms";
import { appSettings } from "@/store/0-ui-settings";
import { doCenterSelectedSegmentsIntoViewBoxAtom } from "@/store/1-atoms-commands/1-center-selected";
import { doAsyncOpenUpdateViewBoxDialogAndApplyAtom } from "@/components/4-dialogs/7-2-update-view-box/8-1-update-viewbox-atoms";
import { openPathDialogOpenAtom, savePathDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";

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
    const openUpdateViewBoxDialog = useSetAtom(doAsyncOpenUpdateViewBoxDialogAndApplyAtom);
    const setSaveDialogOpen = useSetAtom(savePathDialogOpenAtom);
    const setOpenDialogOpen = useSetAtom(openPathDialogOpenAtom);

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
                <MenubarItem onClick={openUpdateViewBoxDialog}>
                    Update viewBox... <MenubarShortcut>Alt+V</MenubarShortcut>
                </MenubarItem>

                <MenubarItem disabled={!hasSelection} onClick={() => setScaleToViewBoxDialogOpen(true)}>
                    Scale selection to viewBox...
                </MenubarItem>

                <MenubarSub>
                    <MenubarSubTrigger>
                        Center selection
                    </MenubarSubTrigger>

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

                <MenubarSeparator />

                <MenubarItem onClick={() => setOpenDialogOpen(true)}>
                    Open Saved Path... <MenubarShortcut>Ctrl+O</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled={!hasPath} onClick={() => setSaveDialogOpen(true)}>
                    Save Path... <MenubarShortcut>Ctrl+S</MenubarShortcut>
                </MenubarItem>

                <MenubarSeparator />

                <MenubarItem disabled={!canSelectAll} onClick={doSelectAll}>
                    Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
                </MenubarItem>

                <MenubarSeparator />

                <MenubarItem disabled={!hasPath} onClick={copyPath}>
                    Copy Path <MenubarShortcut>Alt+C</MenubarShortcut>
                </MenubarItem>

                <MenubarItem disabled={!hasPath} onClick={doClear}>
                    Clear Path <MenubarShortcut>Alt+X</MenubarShortcut>
                </MenubarItem>

                <MenubarSeparator />

                <MenubarItem disabled={!canUndo} onClick={doUndo}>
                    Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                </MenubarItem>

                <MenubarItem disabled={!canRedo} onClick={doRedo}>
                    Redo <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
                </MenubarItem>
                
                <MenubarSeparator />

                <MenubarItem disabled={!hasPath} onClick={doNormalize}>
                    Normalize
                </MenubarItem>

                <MenubarItem disabled={!hasPath} onClick={doSetAbsolute}>
                    Convert to Absolute
                </MenubarItem>

                <MenubarItem disabled={!hasPath} onClick={doSetRelative}>
                    Convert to Relative
                </MenubarItem>

                <MenubarCheckboxItem checked={minifyOutput} disabled={!hasPath} onCheckedChange={toggleMinify}>
                    Minify Path <MenubarShortcut>Alt+M</MenubarShortcut>
                </MenubarCheckboxItem>

            </MenubarContent>
        </MenubarMenu>
    );
}
