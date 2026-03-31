import { useMemo } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { appSettings } from "@/store/0-ui-settings";
import { doDeleteNamedPathAtom, doOpenNamedPathAtom } from "@/store/0-atoms/2-3-stored-paths-actions";
import { openPathDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-dialogs-menu";
import { SvgPathModel } from "@/svg-core/2-svg-model";

export function OpenPathDialog() {
    const { storedPaths } = useSnapshot(appSettings.pathEditor);
    const [open, setOpen] = useAtom(openPathDialogOpenAtom);
    const doOpenNamedPath = useSetAtom(doOpenNamedPathAtom);
    const doDeleteNamedPath = useSetAtom(doDeleteNamedPathAtom);

    const sortedStored = useMemo(
        () => [...storedPaths].sort((a, b) => b.updatedAt - a.updatedAt),
        [storedPaths]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Open saved path
                    </DialogTitle>
                    <DialogDescription>
                        Choose a path from browser storage.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-80 space-y-2 overflow-auto">
                    {sortedStored.length === 0 && (
                        <p className="text-xs text-muted-foreground">No saved paths yet.</p>
                    )}

                    {sortedStored.map(
                        (entry) => {
                            const preview = getPathPreview(entry.path);
                            return (
                                <div key={entry.name} className="flex items-center gap-3 rounded border p-2">
                                    <svg viewBox={preview.viewBox} className="h-10 w-16 rounded bg-muted/20">
                                        <path d={entry.path} fill="none" stroke="currentColor" strokeWidth={preview.strokeWidth} />
                                    </svg>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium">{entry.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Updated {new Date(entry.updatedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <Button className="h-7 px-2" variant="outline" onClick={() => {doOpenNamedPath(entry.name); setOpen(false);}}>
                                        Open
                                    </Button>

                                    <Button className="h-7 px-2 text-destructive" variant="outline" onClick={() => doDeleteNamedPath(entry.name)}>
                                        Delete
                                    </Button>
                                </div>
                            );
                        }
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function getPathPreview(path: string): { viewBox: string; strokeWidth: number; } {
    try {
        const model = new SvgPathModel(path);
        const bounds = model.getBounds();
        const width = Math.max(2, bounds.xmax - bounds.xmin);
        const height = Math.max(2, bounds.ymax - bounds.ymin);
        const pad = Math.max(width, height) * 0.2 + 0.5;

        return {
            viewBox: `${bounds.xmin - pad} ${bounds.ymin - pad} ${width + pad * 2} ${height + pad * 2}`,
            strokeWidth: Math.max(width, height) / 35,
        };
    } catch {
        return { viewBox: "0 0 10 10", strokeWidth: 0.5 };
    }
}
