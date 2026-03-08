import { ToolbarUndoRedo } from "./2-toolbar-undo-redo";
import { SettingsPopover } from "./3-toolbar-view-settings-popover";
import { ButtonThemeToggle } from "./4-btn-theme-toggle";

export function AppHeaderInfo() {
    return (
        <header className="px-4 py-3 border-b">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xs font-semibold">SVG Path Editor</h1>
                </div>
                <Toolbar />
                <ButtonThemeToggle />
            </div>
        </header>
    );
}

function Toolbar() {
    return (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
            <ToolbarUndoRedo />
            <SettingsPopover />
        </div>
    );
}
