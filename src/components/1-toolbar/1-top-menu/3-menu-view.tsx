import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { isImageEditModeAtom } from "@/store/0-atoms/2-8-images";
import { optionsDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { appSettings } from "@/store/0-ui-settings";
import { toggleTheme } from "@/utils";

export function ViewMenu() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const { theme } = useSnapshot(appSettings);
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);
    const setOptionsDialogOpen = useSetAtom(optionsDialogOpenAtom);

    return (
        <MenubarMenu>
            <MenubarTrigger className="px-2 text-xs">
                View
            </MenubarTrigger>

            <MenubarContent>
                <MenubarCheckboxItem checked={darkCanvas} onCheckedChange={() => { appSettings.canvas.darkCanvas = !darkCanvas; }}>
                    Dark Canvas
                    <MenubarShortcut>Alt+D</MenubarShortcut>
                </MenubarCheckboxItem>
                <MenubarCheckboxItem checked={isImageEditMode} onCheckedChange={() => setIsImageEditMode(!isImageEditMode)}>
                    Image Edit Mode
                    <MenubarShortcut>Alt+I</MenubarShortcut>
                </MenubarCheckboxItem>

                <MenubarSeparator />

                <MenubarItem onClick={() => setOptionsDialogOpen(true)}>
                    Options...
                    <MenubarShortcut>Alt+O</MenubarShortcut>
                </MenubarItem>

                <MenubarItem onClick={() => toggleTheme(theme)}>
                    Toggle Theme
                    <MenubarShortcut>Alt+T</MenubarShortcut>
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
}
