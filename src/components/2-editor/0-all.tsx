import { EditorPanels } from "../2-editor/2-props/3-editor-panels";
import { PathCanvas } from "../2-editor/3-canvas/2-canvas";

export function Editor() {
    return (
        <main className="flex-1 min-h-0 flex">
            <aside className="shrink-0 p-4 w-104 border-r overflow-auto space-y-3">
                <EditorPanels />
            </aside>

            <section className="flex-1 p-4 min-w-0">
                <PathCanvas />
            </section>
        </main>
    );
}
