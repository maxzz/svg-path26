import { useAtom, useSetAtom } from "jotai";
import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { isImageEditModeAtom } from "@/store/0-atoms/2-8-images";
import { optionsDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";

export function ViewMenu() {
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);
    const setOptionsDialogOpen = useSetAtom(optionsDialogOpenAtom);

    return (
        <MenubarMenu>
            <MenubarTrigger className="px-2 text-xs">
                View
            </MenubarTrigger>

            <MenubarContent>
                <MenubarCheckboxItem checked={isImageEditMode} onCheckedChange={() => setIsImageEditMode(!isImageEditMode)}>
                    Image Edit Mode
                    <MenubarShortcut>Alt+I</MenubarShortcut>
                </MenubarCheckboxItem>

                <MenubarSeparator />

                <MenubarItem onClick={() => setOptionsDialogOpen(true)}>
                    Options...
                    <MenubarShortcut>Alt+O</MenubarShortcut>
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
}
