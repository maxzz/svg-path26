import { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doSaveNamedPathAtom } from "@/store/0-atoms/2-3-stored-paths-actions";
import { savePathDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";
import { doAsyncExecuteConfirmDialogAtom } from "@/components/4-dialogs/confirmation/2-7-confirmation-dialog";
import { getConfirmOverwriteSavedPathMessages } from "@/components/4-dialogs/confirmation/8-confirmation-ui-messages";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { cn } from "@/utils";

export function SavePathDialog() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const { pathName, storedPaths } = useSnapshot(appSettings.pathEditor);
    const [open, setOpen] = useAtom(savePathDialogOpenAtom);
    const doSaveNamedPath = useSetAtom(doSaveNamedPathAtom);
    const doAsyncExecuteConfirmDialog = useSetAtom(doAsyncExecuteConfirmDialogAtom);

    const [saveNameDraft, setSaveNameDraft] = useState(pathName || "My path");

    const sortedStoredPaths = useMemo(
        () => [...storedPaths].sort((a, b) => b.updatedAt - a.updatedAt),
        [storedPaths],
    );

    const trimmedSaveName = saveNameDraft.trim();
    const existingMatch = sortedStoredPaths.find((entry) => entry.name === trimmedSaveName) ?? null;

    useEffect(
        () => {
            setSaveNameDraft(pathName || "My path");
        },
        [pathName],
    );

    async function handleSaveClick() {
        if (!pathValue.trim() || !trimmedSaveName) return;

        if (existingMatch) {
            const ok = await doAsyncExecuteConfirmDialog(getConfirmOverwriteSavedPathMessages(existingMatch.name));
            if (!ok) return;

            doSaveNamedPath(trimmedSaveName);
            setOpen(false);
            return;
        }

        doSaveNamedPath(trimmedSaveName);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Save path
                    </DialogTitle>
                    <DialogDescription>
                        Save current path in browser storage.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-xs">Name</label>
                        <Input
                            value={saveNameDraft}
                            onChange={(event) => setSaveNameDraft(event.target.value)}
                            placeholder="My path"
                        />
                        {existingMatch ? (
                            <p className="text-[11px] text-muted-foreground">
                                Saving with this name will overwrite the existing saved path after confirmation.
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs">
                                Existing saved paths
                            </label>
                            <span className="text-[10px] text-muted-foreground">
                                Click a name to reuse it
                            </span>
                        </div>

                        <ScrollArea className="h-44 rounded-md border" fixedWidth parentContentWidth>
                            <div className="space-y-1 p-2">
                                {sortedStoredPaths.length === 0 ? (
                                    <p className="px-1 py-2 text-xs text-muted-foreground">
                                        No saved paths yet.
                                    </p>
                                ) : sortedStoredPaths.map(
                                    (entry) => {
                                        const selected = entry.name === trimmedSaveName;
                                        const preview = getPathPreview(entry.path);
                                        return (
                                            <button
                                                key={entry.name}
                                                type="button"
                                                className={cn(
                                                    "flex w-full items-center gap-3 rounded-md border px-2 py-1.5 text-left transition-colors",
                                                    selected
                                                        ? "border-transparent bg-blue-300 text-slate-950"
                                                        : "bg-background hover:bg-accent/60",
                                                )}
                                                onClick={() => setSaveNameDraft(entry.name)}
                                            >
                                                <svg viewBox={preview.viewBox} className={cn("h-10 w-16 shrink-0 rounded bg-muted/20", selected && "bg-white/50")}>
                                                    <path d={entry.path} fill="none" stroke="currentColor" strokeWidth={preview.strokeWidth} />
                                                </svg>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium">
                                                        {entry.name}
                                                    </p>

                                                    <p className={cn("text-[10px]", selected ? "text-slate-700" : "text-muted-foreground")}>
                                                        Updated {new Date(entry.updatedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!pathValue.trim() || !trimmedSaveName}
                        onClick={handleSaveClick}
                    >
                        Save
                    </Button>
                </DialogFooter>
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
