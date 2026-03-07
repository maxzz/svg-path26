import { useAtomValue, useSetAtom } from "jotai";
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

export function CanvasActionsMenu() {
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
        <div className="absolute top-3 right-3 z-20">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" title="More actions">
                        <IconRadix_DotsHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
        </div>
    );
}
