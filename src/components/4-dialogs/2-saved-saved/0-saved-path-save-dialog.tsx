import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { classNames } from "@/utils";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doSaveNamedPathAtom } from "@/store/0-atoms/2-6-stored-paths-actions";
import { savePathDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { doAsyncExecuteConfirmDialogAtom } from "@/components/4-dialogs/8-1-confirmation/9-types-confirmation";
import { getConfirmOverwriteSavedPathMessages } from "@/components/4-dialogs/8-1-confirmation/8-confirmation-ui-messages";
import { PathPreview } from "@/components/ui/loacal-ui/8-path-preview";

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
            <DialogContent className="w-100! max-w-md!">
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
                            <p className="h-4 text-[10px] text-orange-700 transition-colors duration-300">
                                Saving with this name will overwrite the existing saved path after confirmation.
                            </p>
                        ) : <p className="h-4" />}
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
                            <div className="p-1 space-y-0.5">
                                {sortedStoredPaths.length === 0
                                    ? (
                                        <p className="px-1 py-2 text-xs text-muted-foreground">
                                            No saved paths yet.
                                        </p>
                                    ) : sortedStoredPaths.map(
                                        (entry) => (
                                            <Row key={entry.name} entry={entry} selected={entry.name === trimmedSaveName} setSaveNameDraft={setSaveNameDraft} />
                                        )
                                    )
                                }
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button disabled={!pathValue.trim() || !trimmedSaveName} onClick={handleSaveClick}>
                        Save
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

function Row({ entry, selected, setSaveNameDraft }: { entry: StoredPathEntry; selected: boolean; setSaveNameDraft: Dispatch<SetStateAction<string>>; }) {
    return (
        <button
            className={classNames(
                "px-2 py-1.5 w-full text-left border rounded-md transition-colors duration-100 flex items-center gap-3",
                selected
                    ? "text-slate-950 bg-blue-300 border-transparent"
                    : "bg-background hover:bg-accent/60",
            )}
            onClick={() => setSaveNameDraft(entry.name)}
            type="button"
        >
            <PathPreview className={classNames("shrink-0 size-10 rounded bg-muted/20", selected && "bg-white/50")} path={entry.path} />

            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                    {entry.name}
                </p>

                <p className={classNames("text-[10px]", selected ? "text-slate-700" : "text-muted-foreground")}>
                    Updated {new Date(entry.updatedAt).toLocaleString()}
                </p>
            </div>
        </button>
    );
}
