import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { Toolbar } from "../1-toolbar/1-toolbar";
import { PathCanvas } from "../1-editor/1-canvas/2-canvas";
import { EditorPanels } from "../1-editor/2-props/3-editor-panels";
import { appSettings } from "@/store/1-ui-settings";
import { commandCountAtom } from "@/store/0-atoms/2-svg-path-state";
import { UISymbolDefs } from "../ui/icons/symbols";

export function App() {
    return (<>
        <UISymbolDefs />
        <div className="h-screen w-screen text-foreground bg-background overflow-hidden">
            <div className="mx-auto max-w-6xl h-full flex flex-col">

                <Toolbar />

                <main className="flex-1 min-h-0 flex">
                    <aside className="shrink-0 p-4 w-104 border-r overflow-auto space-y-3">
                        <EditorPanels />
                    </aside>

                    <section className="flex-1 p-4 min-w-0">
                        <PathCanvas />
                    </section>
                </main>

                <AppFooterStatus />
            </div>
        </div>
    </>);
}

function AppFooterStatus() {
    const commandCount = useAtomValue(commandCountAtom);
    const settings = useSnapshot(appSettings);

    return (
        <footer className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>Commands: {commandCount}</span>
            <span>{settings.showGrid ? "Grid on" : "Grid off"} / {settings.darkCanvas ? "Dark canvas" : "Light canvas"}</span>
        </footer>
    );
}
