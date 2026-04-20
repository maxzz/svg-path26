import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { doHandleEditorKeyDownAtom } from "./8-atoms";

import { Section_SvgPreview } from "../1-section-svg-preview/0-all-svg-preview";
import { Section_SvgInput } from "../2-section-input-svg/0-all-input-svg";
import { Section_PathInput } from "../3-section-input-path/0-all-input-path";
import { Section_PathCommands } from "../4-section-path-commands/0-all-path-commands";
import { Section_Operations } from "../5-section-operations/0-all-operations";
import { Section_Options } from "../6-section-options/0-all-options";
import { Section_Images } from "../7-section-images/0-all-images";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";

export function EditorPanels() {
    const handleEditorKeyDown = useSetAtom(doHandleEditorKeyDownAtom);

    useEffect(
        () => {
            const onKeyDown = (event: KeyboardEvent) => handleEditorKeyDown(event);

            const controller = new AbortController();
            window.addEventListener("keydown", onKeyDown, { signal: controller.signal });
            return () => controller.abort();
        },
        [handleEditorKeyDown]);

    return (
        <aside className="h-full border-r flex flex-col justify-between">
            <ScrollArea className="flex-1 grow pr-1">
                <Section_SvgPreview />
                <Section_SvgInput />
                <Section_PathInput />
                <Section_PathCommands />
                <Section_Images />
                <Section_Operations />
            </ScrollArea>

            <Section_Options />
        </aside>
    );
}
