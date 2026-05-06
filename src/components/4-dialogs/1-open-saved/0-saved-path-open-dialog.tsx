import { useEffect, useMemo } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { appSettings } from "@/store/0-ui-settings";
import { doDeleteNamedPathAtom, doOpenNamedPathAtom } from "@/store/0-atoms/2-6-stored-paths-actions";
import { openPathDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { PathPreview } from "@/components/ui/local-ui/8-path-preview";
import { IconTrash } from "@/components/ui/icons/normal";
import { classNames } from "@/utils";
import type { StoredPathEntry } from "@/store/9-ui-settings-types-and-defaults";

export function OpenPathDialog() {
    const [open, setOpen] = useAtom(openPathDialogOpenAtom);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-auto! min-w-80! max-w-xl!">
                <DialogHeader>
                    <DialogTitle>
                        Open saved path
                    </DialogTitle>
                    <DialogDescription>
                        Choose a path from browser storage.
                    </DialogDescription>
                </DialogHeader>

                <ListView />

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <ButtonOk />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const openPathSelectedNameAtom = atom<string | null>(null);

function ButtonOk() {
    const selectedName = useAtomValue(openPathSelectedNameAtom);
    const setOpen = useSetAtom(openPathDialogOpenAtom);
    const doOpenNamedPath = useSetAtom(doOpenNamedPathAtom);
    return (
        <Button
            disabled={!selectedName}
            onClick={() => {
                if (!selectedName) return;
                doOpenNamedPath(selectedName);
                setOpen(false);
            }}
        >
            Open
        </Button>
    );
}

function ListView() {
    const [open, setOpen] = useAtom(openPathDialogOpenAtom);
    const [selectedName, setSelectedName] = useAtom(openPathSelectedNameAtom);

    const { storedPaths } = useSnapshot(appSettings.pathEditor);
    const doOpenNamedPath = useSetAtom(doOpenNamedPathAtom);
    const doDeleteNamedPath = useSetAtom(doDeleteNamedPathAtom);

    const sortedStored = useMemo<StoredPathEntry[]>(
        () => [...storedPaths].sort((a, b) => b.updatedAt - a.updatedAt),
        [storedPaths]);

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

    function handleOpenEntry(name: string) {
        setSelectedName(name);
        doOpenNamedPath(name);
        setOpen(false);
    }

    return (
        <div className="max-h-96 space-y-px overflow-auto">
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
    );
}

function Row({ entry, selected, onSelect, onOpen, onDelete }: { entry: StoredPathEntry; selected: boolean; onSelect: () => void; onOpen: () => void; onDelete: () => void; }) {
    return (
        <div
            className={classNames(
                "px-2 w-full rounded border bg-list-item-background transition-colors duration-100 cursor-pointer select-none flex items-center gap-3",
                selected
                    ? "text-list-item-selected-foreground bg-list-item-selected border-transparent"
                    : "hover:bg-list-item-hover",
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
            <PathPreview path={entry.path} className={classNames("size-10 rounded bg-list-item-background", selected && "bg-list-item-selected")} />

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
                    tabIndex={-1}
                >
                    <IconTrash className="size-3.5" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
