import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { FileMenu } from "./1-menu-file";
import { EditMenu } from "./2-menu-edit";
import { ViewMenu } from "./3-menu-view";
import { HelpMenu } from "./4-menu-help";
import { Menubar } from "@/components/ui/shadcn/menubar";
import { doHandleTopMenuKeyDownAtom } from "./8-top-menu-shortcuts";

export function TopMenu() {
    const handleTopMenuKeyDown = useSetAtom(doHandleTopMenuKeyDownAtom);

    useEffect(
        () => {
            const controller = new AbortController();
            window.addEventListener("keydown", handleTopMenuKeyDown, { signal: controller.signal });
            return () => controller.abort();
        },
        [handleTopMenuKeyDown]);

    return (<>
        <Menubar className="p-0 h-auto border-none bg-transparent shadow-none">
            <FileMenu />
            <EditMenu />
            <ViewMenu />
            <HelpMenu />
        </Menubar>
    </>);
}
