import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { appSettings } from "@/store/0-ui-settings";
import { toggleTheme } from "@/utils";

export function ViewMenu() {
    const { darkCanvas } = useSnapshot(appSettings.canvas);
    const { theme } = useSnapshot(appSettings);
    const [isImageEditMode, setIsImageEditMode] = useAtom(isImageEditModeAtom);

    return (
        <MenubarMenu>
            <MenubarTrigger className="px-3 text-xs font-medium">View</MenubarTrigger>
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

                <MenubarItem onClick={() => toggleTheme(theme)}>
                    Toggle Theme
                    <MenubarShortcut>Alt+T</MenubarShortcut>
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
}