import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { TransformPanel } from "./2-transform-panel";
import { EditorPathStatusPanel } from "./1-1-path-status";
import { CommandSelectionSection } from "./3-command-selection";
import { ImagesPanel } from "./4-images-panel";
import { doHandleEditorKeyDownAtom } from "@/store/0-atoms/2-2-editor-actions";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { CanvasActionsMenu } from "./7-canvas-actions-menu";

export function EditorPanels() {
    const handleEditorKeyDown = useSetAtom(doHandleEditorKeyDownAtom);

    useEffect(
        () => {
            const onKeyDown = (event: KeyboardEvent) => handleEditorKeyDown(event);

            window.addEventListener("keydown", onKeyDown);
            return () => window.removeEventListener("keydown", onKeyDown);
        },
        [handleEditorKeyDown]);

    return (
        <aside className="p-4 h-full border-r overflow-auto space-y-1">
            <PathInputSection />
            <EditorPathStatusPanel />

            <TransformPanel />

            <CommandSelectionSection />
            <ImagesPanel />
        </aside>
    );
}

function PathInputSection() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom);
    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor="svg-path-input" className="text-xs font-medium">
                    Path input
                </label>
                <CanvasActionsMenu />
            </div>

            <textarea
                id="svg-path-input"
                className="min-h-40 w-full resize-y rounded-md border bg-background p-3 font-mono text-xs outline-ring/50 focus:outline-2"
                value={pathValue}
                onChange={(event) => setPathValue(event.target.value)}
                placeholder="M 10 10 L 100 100"
            />
        </section>
    );
}
