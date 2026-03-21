import { MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/shadcn/menubar";

export function EditMenu(props: {
    canUndo: boolean;
    canRedo: boolean;
    hasPath: boolean;
    minifyOutput: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onNormalize: () => void;
    onSetAbsolute: () => void;
    onSetRelative: () => void;
    onToggleMinify: () => void;
    onCopyPath: () => void;
    onClearPath: () => void;
}) {
    const {
        canUndo,
        canRedo,
        hasPath,
        minifyOutput,
        onUndo,
        onRedo,
        onNormalize,
        onSetAbsolute,
        onSetRelative,
        onToggleMinify,
        onCopyPath,
        onClearPath,
    } = props;

    return (
        <MenubarMenu>
            <MenubarTrigger className="px-3 text-xs font-medium">Edit</MenubarTrigger>
            <MenubarContent>
                <MenubarItem disabled={!canUndo} onClick={onUndo}>
                    Undo
                    <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled={!canRedo} onClick={onRedo}>
                    Redo
                    <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
                </MenubarItem>

                <MenubarSeparator />

                <MenubarItem disabled={!hasPath} onClick={onNormalize}>
                    Normalize
                    <MenubarShortcut>Alt+N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled={!hasPath} onClick={onSetAbsolute}>
                    Convert to Absolute
                    <MenubarShortcut>Alt+A</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled={!hasPath} onClick={onSetRelative}>
                    Convert to Relative
                    <MenubarShortcut>Alt+R</MenubarShortcut>
                </MenubarItem>
                <MenubarCheckboxItem checked={minifyOutput} disabled={!hasPath} onCheckedChange={onToggleMinify}>
                    Minify Path
                    <MenubarShortcut>Alt+M</MenubarShortcut>
                </MenubarCheckboxItem>

                <MenubarSeparator />

                <MenubarItem disabled={!hasPath} onClick={onCopyPath}>
                    Copy Path
                    <MenubarShortcut>Alt+C</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled={!hasPath} onClick={onClearPath}>
                    Clear Path
                    <MenubarShortcut>Alt+X</MenubarShortcut>
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
}