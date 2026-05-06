import { useEffect, useMemo, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { appSettings } from "@/store/0-ui-settings";
import { doDeleteNamedPathAtom, doOpenNamedPathAtom } from "@/store/0-atoms/2-6-stored-paths-actions";
import { openPathDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { PathPreview } from "@/components/ui/local-ui/8-path-preview";
import { IconTrash } from "@/components/ui/icons/normal";
import { classNames } from "@/utils";

export function OpenPathDialog() {
    const { storedPaths } = useSnapshot(appSettings.pathEditor);
    const [open, setOpen] = useAtom(openPathDialogOpenAtom);

    const doOpenNamedPath = useSetAtom(doOpenNamedPathAtom);
    const doDeleteNamedPath = useSetAtom(doDeleteNamedPathAtom);

    const [selectedName, setSelectedName] = useState<string | null>(null);

    const sortedStored = useMemo(
        () => [...storedPaths].sort((a, b) => b.updatedAt - a.updatedAt),
        [storedPaths]);

    const selectedEntry = useMemo(
        () => sortedStored.find((entry) => entry.name === selectedName) ?? null,
        [selectedName, sortedStored]);

    useEffect(
        () => {
            if (open) setSelectedName(null);
        },
        [open]);

    useEffect(
        () => {
            if (!selectedName) return;
            if (!storedPaths.some((entry) => entry.name === selectedName)) {
                setSelectedName(null);
            }
        },
        [selectedName, storedPaths]);

    function handleOpenClick() {
        if (!selectedEntry) return;
        doOpenNamedPath(selectedEntry.name);
        setOpen(false);
    }

    function handleOpenEntry(name: string) {
        setSelectedName(name);
        doOpenNamedPath(name);
        setOpen(false);
    }

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
                                <Row
                                    key={entry.name}
                                    entry={entry}
                                    selected={entry.name === selectedName}
                                    onSelect={() => setSelectedName(entry.name)}
                                    onOpen={() => handleOpenEntry(entry.name)}
                                    onDelete={() => doDeleteNamedPath(entry.name)}
                                />
                            )
                        )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button disabled={!selectedEntry} onClick={handleOpenClick}>
                        Open
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type StoredPathEntry = {
    name: string;
    path: string;
    updatedAt: number;
};

function Row({
    entry,
    selected,
    onSelect,
    onOpen,
    onDelete,
}: {
    entry: StoredPathEntry;
    selected: boolean;
    onSelect: () => void;
    onOpen: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className={classNames(
                "px-2 py-1.5 w-full rounded border flex items-center gap-3 transition-colors duration-100 cursor-pointer",
                selected
                    ? "text-slate-950 bg-blue-300 border-transparent"
                    : "bg-background hover:bg-accent/60",
            )}
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onDoubleClick={onOpen}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect();
                }
            }}
            aria-pressed={selected}
        >
            <PathPreview path={entry.path} className={classNames("h-10 w-16 rounded bg-muted/20", selected && "bg-white/50")} />

            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{entry.name}</p>
                <p className="text-[10px] text-muted-foreground">
                    Updated {new Date(entry.updatedAt).toLocaleString()}
                </p>
            </div>

            <div className="flex items-center gap-0.5">
                <Button
                    className="size-6"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete();
                    }}
                    onDoubleClick={(event) => {
                        event.stopPropagation();
                    }}
                    aria-label="Delete"
                    title="Delete"
                >
                    <IconTrash className="size-3.5" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
