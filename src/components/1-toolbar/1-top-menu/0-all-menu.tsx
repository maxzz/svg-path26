import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { Menubar } from "@/components/ui/shadcn/menubar";
import { doHandleTopMenuKeyDownAtom } from "./1-top-menu-shortcuts";
import { FileMenu } from "./2-file-menu";
import { EditMenu } from "./3-edit-menu";
import { ViewMenu } from "./4-view-menu";
import { HelpMenu } from "./5-help-menu";

export function TopMenu() {
    const handleTopMenuKeyDown = useSetAtom(doHandleTopMenuKeyDownAtom);

    useEffect(() => {
        const controller = new AbortController();
        window.addEventListener("keydown", handleTopMenuKeyDown, { signal: controller.signal });
        return () => controller.abort();
    }, [handleTopMenuKeyDown]);

    return (<>
        <Menubar className="h-auto border-none bg-transparent p-0 shadow-none">
            <FileMenu />
            <EditMenu />
            <ViewMenu />
            <HelpMenu />
        </Menubar>

    </>);
}
