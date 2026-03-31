import { useSetAtom } from "jotai";
import { MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/shadcn/menubar";
import { aboutDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";

export function HelpMenu() {
    const setAboutDialogOpen = useSetAtom(aboutDialogOpenAtom);

    return (
        <MenubarMenu>
            <MenubarTrigger className="px-2 text-xs">
                Help
            </MenubarTrigger>

            <MenubarContent>
                <MenubarItem onClick={() => setAboutDialogOpen(true)}>
                    About
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
}
