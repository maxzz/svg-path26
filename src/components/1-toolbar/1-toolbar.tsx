import { TopMenu } from "./1-top-menu/0-all-menu";
import { ToolbarUndoRedo } from "./2-toolbar-undo-redo";
import { SettingsPopover } from "./3-toolbar-popover";
import { ButtonThemeToggle } from "./4-btn-theme-toggle";

export function Toolbar() {
    return (
        <header className="px-1 py-1 bg-muted/20 border-b shadow-xs flex items-center justify-between">
            <TopMenu />

            <div className="flex items-center gap-1">
                <ToolbarUndoRedo />
                <SettingsPopover />
                <ButtonThemeToggle />
            </div>
        </header>
    );
}
