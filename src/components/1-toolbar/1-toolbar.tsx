import { CanvasActionsMenu } from "./8-props-top-menu";
import { ToolbarUndoRedo } from "./2-toolbar-undo-redo";
import { SettingsPopover } from "./3-toolbar-popover";
import { ButtonThemeToggle } from "./4-btn-theme-toggle";

export function Toolbar() {
    return (
        <header className="px-4 py-1 bg-muted/20 border-b shadow-xs flex items-center justify-between gap-3">
            <h1 className="text-xs font-semibold">SVG Path Editor</h1>

            <div className="flex items-center gap-2">
                <div className="px-4 flex items-center gap-1">
                    <ToolbarUndoRedo />
                    <SettingsPopover />
                </div>
                <CanvasActionsMenu />
                <ButtonThemeToggle />
            </div>
        </header>
    );
}
