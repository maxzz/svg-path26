import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { commandCountAtom } from "@/store/0-atoms/2-0-svg-model";

export function Footer() {
    const commandCount = useAtomValue(commandCountAtom);
    const { showGrid, darkCanvas } = useSnapshot(appSettings.canvas);

    return (
        <footer className="px-4 py-2 text-xs text-muted-foreground border-t flex items-center justify-between">
            <span>Commands: {commandCount}</span>
            <span>{showGrid ? "Grid on" : "Grid off"} / {darkCanvas ? "Dark canvas" : "Light canvas"}</span>
        </footer>
    );
}
