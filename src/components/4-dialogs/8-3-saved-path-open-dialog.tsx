import { useMemo } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { appSettings } from "@/store/0-ui-settings";
import { doDeleteNamedPathAtom, doOpenNamedPathAtom } from "@/store/0-atoms/2-6-stored-paths-actions";
import { openPathDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { PathPreview } from "@/components/ui/loacal-ui/8-path-preview";
import { IconTrash } from "@/components/ui/icons/normal";

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
            <DialogContent className="w-auto! max-w-xl!">
                <DialogHeader>
                    <DialogTitle>
                        Open saved path
                    </DialogTitle>
                    <DialogDescription>
                        Choose a path from browser storage.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-96 space-y-2 overflow-auto">
                    {!sortedStored.length
                        ? (
                            <p className="text-xs text-muted-foreground">
                                No saved paths yet.
                            </p>
                        ) : sortedStored.map(
                            (entry) => (
                                <Row key={entry.name} entry={entry} onOpen={() => { doOpenNamedPath(entry.name); setOpen(false); }} onDelete={() => doDeleteNamedPath(entry.name)} />
                            )
                        )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

type StoredPathEntry = {
    name: string;
    path: string;
    updatedAt: number;
};

function Row({ entry, onOpen, onDelete }: { entry: StoredPathEntry; onOpen: () => void; onDelete: () => void; }) {
    return (
        <div className="px-2 flex items-center gap-3 rounded border">
            <PathPreview path={entry.path} className="h-10 w-16 rounded bg-muted/20" />

            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{entry.name}</p>
                <p className="text-[10px] text-muted-foreground">
                    Updated {new Date(entry.updatedAt).toLocaleString()}
                </p>
            </div>

            <Button className="h-7 px-2" variant="outline" onClick={onOpen}>
                Open
            </Button>

            <Button className="h-7 px-2 text-destructive" variant="outline" onClick={onDelete} aria-label="Delete" title="Delete">
                <IconTrash className="size-4" aria-hidden="true" />
            </Button>
        </div>
    );
}
