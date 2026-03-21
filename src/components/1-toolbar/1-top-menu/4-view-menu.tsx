import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";

export function ViewMenu(props: {
    darkCanvas: boolean;
    isImageEditMode: boolean;
    onToggleDarkCanvas: () => void;
    onToggleImageEditMode: () => void;
    onToggleTheme: () => void;
}) {
    const {
        darkCanvas,
        isImageEditMode,
        onToggleDarkCanvas,
        onToggleImageEditMode,
        onToggleTheme,
    } = props;

    return (
        <MenubarMenu>
            <MenubarTrigger className="px-3 text-xs font-medium">View</MenubarTrigger>
            <MenubarContent>
                <MenubarCheckboxItem checked={darkCanvas} onCheckedChange={onToggleDarkCanvas}>
                    Dark Canvas
                    <MenubarShortcut>Alt+D</MenubarShortcut>
                </MenubarCheckboxItem>
                <MenubarCheckboxItem checked={isImageEditMode} onCheckedChange={onToggleImageEditMode}>
                    Image Edit Mode
                    <MenubarShortcut>Alt+I</MenubarShortcut>
                </MenubarCheckboxItem>

                <MenubarSeparator />

                <MenubarItem onClick={onToggleTheme}>
                    Toggle Theme
                    <MenubarShortcut>Alt+T</MenubarShortcut>
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
}