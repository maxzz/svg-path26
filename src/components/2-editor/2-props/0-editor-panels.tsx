import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { TransformPanel } from "./1-transform-panel";
import { CommandsList } from "./2-0-commands-list";
import { ImagesPanel } from "./3-images-panel";
import { doHandleEditorKeyDownAtom } from "@/store/0-atoms/2-2-editor-actions";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { CanvasActionsMenu } from "./8-props-top-menu";

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
        <aside className="p-4 h-full border-r overflow-auto space-y-1">
            <PathInputSection />
            <PathInputSectionStatus />

            <TransformPanel />

            <CommandsList />
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

function PathInputSectionStatus() {
    const error = useAtomValue(parseErrorAtom);
    const commandCount = useAtomValue(commandCountAtom);

    return (
        <section className="rounded-lg border p-3">
            <h2 className="mb-2 text-xs font-semibold">
                Path Status
            </h2>
            {error ? (
                <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                    {error}
                </p>
            ) : (
                <p className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                    Path parsed successfully.
                </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
                Commands parsed: {commandCount}
            </p>
        </section>
    );
}
