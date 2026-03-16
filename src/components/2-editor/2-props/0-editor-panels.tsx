import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { TransformPanel } from "./1-transform-panel";
import { CommandsListPanel } from "./2-0-commands-list";
import { ImagesPanel } from "./3-images-panel";
import { doHandleEditorKeyDownAtom } from "@/store/0-atoms/2-2-editor-actions";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";

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
            <div className="grow flex-1 overflow-auto [scrollbar-gutter:stable]">
                <PathInputSection />

                <TransformPanel />

                <CommandsListPanel />
                <ImagesPanel />
            </div>

            <PathInputSectionStatus />
        </aside>
    );
}

function PathInputSection() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom);
    return (
        <SectionPanel sectionKey="path-input" label="Path Input" contentClassName="px-px py-0.5">
            <textarea
                id="svg-path-input"
                className="pl-4 py-1 w-full min-h-8 field-sizing-content font-mono tracking-tight text-xs bg-background outline-ring/50 focus:-outline shadow-inner resize-y"
                value={pathValue}
                onChange={(event) => setPathValue(event.target.value)}
                placeholder="M 10 10 L 100 100"
            />
        </SectionPanel>
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
