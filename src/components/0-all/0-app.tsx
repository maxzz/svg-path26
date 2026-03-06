import { useAtom, useAtomValue } from "jotai"
import { useSnapshot } from "valtio"
import { Toolbar } from "./1-toolbar"
import { PathCanvas } from "./2-canvas"
import { EditorPanels } from "./3-editor-panels"
import { uiSettings } from "@/store/1-ui-settings"
import {
    commandCountAtom,
    svgPathInputAtom,
} from "@/store/2-svg-path-state"

export function App() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom)
    const commandCount = useAtomValue(commandCountAtom)
    const settings = useSnapshot(uiSettings)

    return (
        <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
            <div className="mx-auto flex h-full max-w-6xl flex-col">
                <header className="border-b px-4 py-3">
                    <h1 className="text-xl font-semibold">SVG Path Editor</h1>
                    <p className="text-sm text-muted-foreground">
                        React + Vite layout using Jotai (path state) and Valtio (UI settings).
                    </p>
                </header>

                <Toolbar />

                <main className="flex min-h-0 flex-1">
                    <aside className="w-104 shrink-0 space-y-3 overflow-auto border-r p-4">
                        <section className="space-y-2">
                            <label htmlFor="svg-path-input" className="text-sm font-medium">
                                Path input
                            </label>
                            <textarea
                                id="svg-path-input"
                                className="min-h-40 w-full resize-y rounded-md border bg-background p-3 font-mono text-xs outline-ring/50 focus:outline-2"
                                value={pathValue}
                                onChange={(event) => setPathValue(event.target.value)}
                                placeholder="M 10 10 L 100 100"
                            />
                        </section>
                        <EditorPanels />
                    </aside>

                    <section className="min-w-0 flex-1 p-4">
                        <PathCanvas />
                    </section>
                </main>

                <footer className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                    <span>Commands: {commandCount}</span>
                    <span>{settings.showGrid ? "Grid on" : "Grid off"} / {settings.darkCanvas ? "Dark canvas" : "Light canvas"}</span>
                </footer>
            </div>
        </div>
    )
}
