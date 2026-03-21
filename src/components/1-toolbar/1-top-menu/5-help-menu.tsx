import { MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/shadcn/menubar";

export function HelpMenu({ onOpenAbout }: { onOpenAbout: () => void; }) {
    return (
        <MenubarMenu>
            <MenubarTrigger className="px-3 text-xs font-medium">Help</MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={onOpenAbout}>
                    About
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
}