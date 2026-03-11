import { atom, useSetAtom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/shadcn/resizable";
import { EditorPanels } from "../2-editor/2-props/3-editor-panels";
import { PathCanvas } from "./3-canvas/0-canvas";

export function Editor() {
    const savedSizes = appSettings.editorPanelSizes;
    const defaultLeftPanelSize = savedSizes?.[0] ?? 33;
    const defaultRightPanelSize = savedSizes?.[1] ?? 67;
    const setEditorPanelLayout = useSetAtom(setEditorPanelLayoutAtom);

    return (
        <main className="flex-1 min-h-0">
            <ResizablePanelGroup orientation="horizontal" onLayoutChange={setEditorPanelLayout}>
                <ResizablePanel id="editor-controls" defaultSize={`${defaultLeftPanelSize}`} minSize="20%">
                    <aside className="h-full border-r p-4 overflow-auto space-y-3">
                        <EditorPanels />
                    </aside>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel id="editor-canvas" defaultSize={`${defaultRightPanelSize}`} minSize="30%">
                    <section className="h-full min-w-0 p-4">
                        <PathCanvas />
                    </section>
                </ResizablePanel>
            </ResizablePanelGroup>
        </main>
    );
}

const setEditorPanelLayoutAtom = atom(
    null,
    (_get, _set, layout: { [key: string]: number; }) => {
        appSettings.editorPanelSizes = [
            layout["editor-controls"],
            layout["editor-canvas"],
        ];
    }
);
