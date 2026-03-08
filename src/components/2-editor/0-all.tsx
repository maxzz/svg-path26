import { useSnapshot } from "valtio";
import { Group, Panel, Separator } from "react-resizable-panels";
import { appSettings, setEditorLeftPanelSize } from "@/store/1-ui-settings";
import { EditorPanels } from "../2-editor/2-props/3-editor-panels";
import { PathCanvas } from "../2-editor/3-canvas/2-canvas";

export function Editor() {
    const settings = useSnapshot(appSettings);

    return (
        <main className="flex-1 min-h-0">
            <Group
                orientation="horizontal"
                onLayoutChanged={(sizes) => {
                    const firstSize = sizes[0];
                    if (typeof firstSize === "number") {
                        setEditorLeftPanelSize(firstSize);
                    }
                }}
            >
                <Panel defaultSize={settings.editorLeftPanelSize} minSize={20}>
                    <aside className="h-full border-r p-4 overflow-auto space-y-3">
                        <EditorPanels />
                    </aside>
                </Panel>

                <Separator className="w-1 bg-border hover:bg-sky-500 transition-colors" />

                <Panel minSize={30}>
                    <section className="h-full min-w-0 p-4">
                        <PathCanvas />
                    </section>
                </Panel>
            </Group>
        </main>
    );
}
