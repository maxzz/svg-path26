import { useEffect, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { doSaveNamedPathAtom } from "@/store/0-atoms/2-3-stored-paths-actions";
import { savePathDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";

export function SavePathDialog() {
    const pathValue = useAtomValue(svgPathInputAtom);
    const { pathName } = useSnapshot(appSettings.pathEditor);
    const [open, setOpen] = useAtom(savePathDialogOpenAtom);
    const doSaveNamedPath = useSetAtom(doSaveNamedPathAtom);

    const [saveNameDraft, setSaveNameDraft] = useState(pathName || "My path");

    useEffect(
        () => {
            setSaveNameDraft(pathName || "My path");
        },
        [pathName]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Save path</DialogTitle>
                    <DialogDescription>Save current path in browser storage.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <label className="text-xs">Name</label>
                    <Input
                        value={saveNameDraft}
                        onChange={(event) => setSaveNameDraft(event.target.value)}
                        placeholder="My path"
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!pathValue.trim() || !saveNameDraft.trim()}
                        onClick={() => {
                            doSaveNamedPath(saveNameDraft);
                            setOpen(false);
                        }}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
