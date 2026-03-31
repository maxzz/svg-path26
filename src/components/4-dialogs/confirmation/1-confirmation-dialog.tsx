import { AlertTriangle } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { confirmationDialogAtom, doCloseConfirmationDialogAtom } from "@/store/0-atoms/2-7-confirmation-dialog";
import { classNames } from "@/utils";

const DESCRIPTION_ID = "confirmation-dialog-message";

export function ConfirmationDialog() {
    const dialog = useAtomValue(confirmationDialogAtom);
    const closeDialog = useSetAtom(doCloseConfirmationDialogAtom);

    return (
        <Dialog open={Boolean(dialog)} onOpenChange={(open) => { if (!open) closeDialog({ confirmed: false }); }}>
            <DialogContent className="max-w-sm gap-0 p-0" modal showCloseButton={false} aria-describedby={DESCRIPTION_ID}>
                {dialog ? (
                    <>
                        <DialogHeader className="gap-0 border-b px-4 py-3 text-left">
                            <DialogTitle className="text-sm">
                                {dialog.title}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Confirmation required before continuing.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-4 py-3">
                            <div id={DESCRIPTION_ID} className="flex items-start gap-2 text-xs leading-5 text-foreground/90">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                <div className="min-w-0">
                                    {dialog.message}
                                </div>
                            </div>

                            <DialogFooter className={classNames("pt-4", dialog.cancelLabel ? "justify-end" : "justify-center")}>
                                {dialog.cancelLabel ? (
                                    <Button
                                        variant={dialog.confirmVariant === "default" ? "outline" : "default"}
                                        onClick={() => closeDialog({ confirmed: false })}
                                    >
                                        {dialog.cancelLabel}
                                    </Button>
                                ) : null}

                                <Button
                                    variant={dialog.confirmVariant}
                                    onClick={() => closeDialog({ confirmed: true })}
                                >
                                    {dialog.confirmLabel}
                                </Button>
                            </DialogFooter>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}