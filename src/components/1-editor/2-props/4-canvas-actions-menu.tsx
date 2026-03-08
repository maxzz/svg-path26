import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { IconRadix_DotsHorizontal } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import {
    doClearPathAtom,
    doNormalizePathAtom,
    doSetAbsoluteAtom,
    doSetMinifyAtom,
    doSetRelativeAtom,
    minifyOutputAtom,
    svgPathInputAtom,
} from "@/store/0-atoms/2-svg-path-state";
import {
    appSettings,
    toggleDarkCanvas,
    toggleShowGrid,
    toggleShowHelpers,
} from "@/store/1-ui-settings";

export function CanvasActionsMenu() {
    const settings = useSnapshot(appSettings);
    const minified = useAtomValue(minifyOutputAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);
    const doClear = useSetAtom(doClearPathAtom);
    const doSetMinify = useSetAtom(doSetMinifyAtom);

    const handleCopy = async () => {
        if (!pathValue) return;
        await navigator.clipboard.writeText(pathValue);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-7" title="More actions">
                    <IconRadix_DotsHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                    checked={settings.showGrid}
                    onCheckedChange={() => toggleShowGrid()}
                >
                    Grid
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={settings.showHelpers}
                    onCheckedChange={() => toggleShowHelpers()}
                >
                    Helpers
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={settings.darkCanvas}
                    onCheckedChange={() => toggleDarkCanvas()}
                >
                    Dark Canvas
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => doNormalize()}>
                    Normalize
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => doSetAbsolute()}>
                    To Abs
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => doSetRelative()}>
                    To Rel
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                    checked={minified}
                    onCheckedChange={(checked) => doSetMinify(Boolean(checked))}
                >
                    Minify
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    disabled={!pathValue}
                    onSelect={async () => {
                        await handleCopy();
                    }}
                >
                    Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={!pathValue}
                    onSelect={() => doClear()}
                >
                    Clear
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
