import { useAtom } from "jotai";
import { Switch } from "@/components/ui/shadcn/switch";
import { allSubPathsEnabledAtom, subPathEnabledAtom } from "@/store/0-atoms/2-0-svg-model";

export function CompoundPathToggleRow() {
    const [allEnabled, setAllEnabled] = useAtom(allSubPathsEnabledAtom);
    return (
        <div className="px-1.5 py-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Toggle all</span>
            <Switch
                className="scale-75"
                checked={allEnabled}
                onCheckedChange={(checked) => setAllEnabled(Boolean(checked))}
                aria-label={allEnabled ? "Mute all subpaths" : "Enable all subpaths"}
            />
        </div>
    );
}

export function SubPathToggleRow({ subPathIndex }: { subPathIndex: number; }) {
    const [enabled, setEnabled] = useAtom(subPathEnabledAtom(subPathIndex));
    return (
        <div className="px-1.5 py-1 flex items-center justify-between gap-x-2 text-[10px] text-muted-foreground">
            <span>Subpath {subPathIndex + 1}</span>
            <div className="flex-1 h-px bg-linear-to-r from-slate-500/10 via-slate-500/50 to-slate-500/10" />
            <Switch
                className="scale-75"
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(Boolean(checked))}
                aria-label={enabled ? `Mute subpath ${subPathIndex + 1}` : `Enable subpath ${subPathIndex + 1}`}
            />
        </div>
    );
}
