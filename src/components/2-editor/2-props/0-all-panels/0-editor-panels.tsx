import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { doHandleEditorKeyDownAtom } from "@/store/0-atoms/2-4-0-editor-actions";

import { Section_SvgPreview } from "../1-section-svg-preview/0-all-svg-preview";
import { Section_SvgInput } from "../2-section-input-svg/0-all-input-svg";
import { Section_PathInput } from "../3-section-input-path/0-all-input-path";
import { Section_PathCommands } from "../4-section-path-commands/0-all-path-commands";
import { Section_Operations } from "../5-section-operations/0-all-operations";
import { Section_Options } from "../6-section-options/0-all-options";
import { Section_Images } from "../7-section-images/0-all-images";

export function EditorPanels() {
    const { showSvgPreviewSection } = useSnapshot(appSettings);
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
            <div className="grow flex-1 overflow-auto [scrollbar-gutter:stable]">
                {showSvgPreviewSection && <Section_SvgPreview />}
                <Section_SvgInput />
                <Section_PathInput />
                <Section_PathCommands />
                <Section_Images />
                <Section_Operations />
            </div>

            <Section_Options />
        </aside>
    );
}
