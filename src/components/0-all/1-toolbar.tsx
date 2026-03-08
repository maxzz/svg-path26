import { ToolbarUndoRedo } from "./2-toolbar-undo-redo";
import { SettingsPopover } from "./3-toolbar-view-settings-popover";

export function Toolbar() {
    return (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
            <ToolbarUndoRedo />
            <SettingsPopover />
        </div>
    );
}
