import { useEffect, useLayoutEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Switch } from "@/components/ui/shadcn/switch";

import { ScalePivotSelect } from "./3-scale-selection";
import { ScalePreviewPane } from "./4-scale-preview-pane";
import { ScaleModeSelector } from "./1-scale-mode-selector";
import { ScaleMultiplierInputs } from "./2-scale-multiplier-inputs";
import * as scaleAtoms from "./5-scale-atoms";

import { doSetPathWithoutHistoryAtom } from "@/store/0-atoms/1-2-history";
import { rawPathAtom } from "@/store/0-atoms/1-0-raw-path";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { scaleDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { appSettings, dialogsSettings } from "@/store/0-ui-settings";

export function ScaleDialog() {
    const [open, setOpen] = useAtom(scaleDialogOpenAtom);

    const currentPath = useAtomValue(rawPathAtom);

    const { strokeWidth } = useSnapshot(appSettings.pathEditor);

    const didInitRef = useRef(false);

    const originalRawPath = useAtomValue(scaleAtoms.scaleDialogOriginalRawPathAtom);
    const selectionBounds = useAtomValue(scaleAtoms.scaleDialogSelectionBoundsAtom);
    const preview = useAtomValue(scaleAtoms.scaleDialogPreviewAtom);

    const mode = useAtomValue(scaleAtoms.scaleDialogModeAtom);
    const scaleX = useAtomValue(scaleAtoms.scaleDialogScaleXAtom);
    const scaleY = useAtomValue(scaleAtoms.scaleDialogScaleYAtom);
    const linked = useAtomValue(scaleAtoms.scaleDialogLinkedAtom);
    const pivot = useAtomValue(scaleAtoms.scaleDialogPivotAtom);
    const previewOnCanvas = useAtomValue(scaleAtoms.scaleDialogPreviewOnCanvasAtom);

    // set atoms

    const doSetSvgPathInput = useSetAtom(svgPathInputAtom);
    const doSetPathWithoutHistory = useSetAtom(doSetPathWithoutHistoryAtom);

    const doSetOriginalRawPath = useSetAtom(scaleAtoms.scaleDialogOriginalRawPathAtom);
    const doSetOriginalModel = useSetAtom(scaleAtoms.scaleDialogOriginalModelAtom);
    const doSetSelectionIndicesDraft = useSetAtom(scaleAtoms.scaleDialogSelectionIndicesDraftAtom);
    const doSetSelectionBounds = useSetAtom(scaleAtoms.scaleDialogSelectionBoundsAtom);

    const doSetMode = useSetAtom(scaleAtoms.scaleDialogModeAtom);
    const doSetScaleX = useSetAtom(scaleAtoms.scaleDialogScaleXAtom);
    const doSetScaleY = useSetAtom(scaleAtoms.scaleDialogScaleYAtom);
    const doSetLinked = useSetAtom(scaleAtoms.scaleDialogLinkedAtom);
    const doSetPivot = useSetAtom(scaleAtoms.scaleDialogPivotAtom);
    const doSetPreviewOnCanvas = useSetAtom(scaleAtoms.scaleDialogPreviewOnCanvasAtom);

    const doInitScaleDialogDraft = useSetAtom(scaleAtoms.doInitScaleDialogDraftAtom);

    // dialog open/close lifecycle. TODO: use promises instead of refs.

    const closingWithOkRef = useRef(false);

    useLayoutEffect(
        () => {
            if (!open) return;
            if (didInitRef.current) return;
            didInitRef.current = true;

            doInitScaleDialogDraft();
        },
        [open, doInitScaleDialogDraft]);

    useEffect(
        () => {
            if (open) return;
            closingWithOkRef.current = false;
            didInitRef.current = false;
            doSetOriginalRawPath(null);
            doSetOriginalModel(null);
            doSetSelectionIndicesDraft([]);
            doSetSelectionBounds(null);
        },
        [open]);

    // Keep X and Y in sync when "linked" is enabled in uniform mode.
    useEffect(
        () => {
            if (mode !== "uniform") return;
            if (!linked) return;
            if (Math.abs(scaleY - scaleX) < 1e-12) return;
            doSetScaleY(scaleX);
        },
        [mode, linked, scaleX]);

    // Main-canvas preview:
    useEffect(
        () => {
            if (!open) return;
            if (closingWithOkRef.current) return;
            if (!originalRawPath) return;

            const nextPath = previewOnCanvas ? preview?.path : originalRawPath;
            if (!nextPath) return;

            if (nextPath === currentPath) return;
            doSetPathWithoutHistory(nextPath);
        },
        [open, previewOnCanvas, preview?.path, originalRawPath, currentPath, doSetPathWithoutHistory]);

    function cancel() {
        // Prevent the live preview effect from re-applying the draft while we restore the original path.
        closingWithOkRef.current = true;
        const restorePath = originalRawPath ?? currentPath;
        if (restorePath) {
            doSetPathWithoutHistory(restorePath);
        }
        setOpen(false);
    }

    function handleOk() {
        if (!preview?.path) return;

        closingWithOkRef.current = true;

        // Persist dialog controls only on OK.
        dialogsSettings.scale.mode = mode;
        dialogsSettings.scale.scaleX = scaleX;
        dialogsSettings.scale.scaleY = scaleY;
        dialogsSettings.scale.linked = linked;
        dialogsSettings.scale.pivot = pivot;
        dialogsSettings.scale.previewOnCanvas = previewOnCanvas;

        doSetSvgPathInput(preview.path);
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={
                (nextOpen) => {
                    if (nextOpen) {
                        setOpen(true);
                        return;
                    }
                    if (closingWithOkRef.current) {
                        closingWithOkRef.current = false;
                        setOpen(false);
                        return;
                    }
                    cancel();
                }
            }
        >
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Scale
                    </DialogTitle>
                    <DialogDescription>Scale selected elements with a chosen pivot point.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 text-xs">
                    <ScaleModeSelector mode={mode} onChange={(next) => doSetMode(next)} />

                    <div className="rounded border p-3">
                        <div className="mb-2 text-[11px] text-muted-foreground">Scale inputs</div>

                        <ScaleMultiplierInputs
                            mode={mode}
                            scaleX={scaleX}
                            scaleY={scaleY}
                            linked={linked}
                            onSetScaleX={doSetScaleX}
                            onSetScaleY={doSetScaleY}
                            onSetLinked={(next) => doSetLinked(next)}
                        />
                    </div>

                    <ScalePivotSelect
                        pivot={pivot}
                        onChange={(next) => doSetPivot(next)}
                        disabled={!selectionBounds}
                    />

                    <div className="rounded border p-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">Preview on main canvas</span>
                        <Switch checked={previewOnCanvas} onCheckedChange={(checked) => doSetPreviewOnCanvas(Boolean(checked))} />
                    </div>

                    <div className="rounded border p-3">
                        <div className="mb-2 text-[11px] text-muted-foreground">Live preview</div>
                        <ScalePreviewPane preview={preview} fillPreview={appSettings.canvas.fillPreview} strokeWidth={strokeWidth} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={cancel}>Cancel</Button>
                    <Button onClick={handleOk} disabled={!preview?.path || !selectionBounds}>OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
