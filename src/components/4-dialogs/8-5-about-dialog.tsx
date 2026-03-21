import { useAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { aboutDialogOpenAtom } from "@/store/0-atoms/2-5-canvas-actions-menu";

export function AboutDialog() {
    const [open, setOpen] = useAtom(aboutDialogOpenAtom);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>About</DialogTitle>
                    <DialogDescription>
                        SVG Path Editor is a React + TypeScript tool for editing, transforming, previewing, and exporting SVG path data.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs">
                    <div className="rounded border bg-muted/20 p-3">
                        <p className="font-medium">svg-path26</p>
                        <p className="mt-1 text-muted-foreground">Version 0.0.0</p>
                    </div>

                    <div className="space-y-1 text-muted-foreground">
                        <p>Built with Vite, React, Jotai, and Valtio.</p>
                        <p>Supports path editing, saved paths, image overlays, and SVG export.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}