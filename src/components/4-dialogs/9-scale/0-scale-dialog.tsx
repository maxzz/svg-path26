import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Link2, Unlink2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Switch } from "@/components/ui/shadcn/switch";

import { SvgPathModel } from "@/svg-core/2-svg-model";
import { computeSelectionBounds, pivotFromBounds, ScalePivotSelect, type SelectionBounds } from "./1-scale-selection";
import { ScalePreviewPane } from "./2-scale-preview-pane";
import { ScaleModeSelector } from "./3-scale-mode-selector";

import { canvasSegmentHitAreaElementsAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-editor-actions";
import { doSetPathWithoutHistoryAtom } from "@/store/0-atoms/1-2-history";
import { rawPathAtom } from "@/store/0-atoms/1-0-raw-path";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { scaleDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { appSettings, dialogsSettings } from "@/store/0-ui-settings";
import type { ScaleDialogAxisMode, ScaleDialogPivotPoint } from "@/store/10-dialogs-ui-settings-types-and-defaults";

function ScaleMultiplierInputs({
    mode,
    scaleX,
    scaleY,
    linked,
    onSetScaleX,
    onSetScaleY,
    onSetLinked,
}: {
    mode: ScaleDialogAxisMode;
    scaleX: number;
    scaleY: number;
    linked: boolean;
    onSetScaleX: (next: number) => void;
    onSetScaleY: (next: number) => void;
    onSetLinked: (next: boolean) => void;
}) {
    if (mode === "uniform") {
        return (
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                <label className="space-y-1">
                    <span className="text-muted-foreground">X multiplier</span>
                    <Input
                        type="number"
                        step={0.1}
                        value={scaleX}
                        onChange={(event) => {
                            const next = Number(event.target.value);
                            onSetScaleX(next);
                            if (linked) onSetScaleY(next);
                        }}
                    />
                </label>

                <button
                    type="button"
                    className="h-8 w-8 inline-flex items-center justify-center rounded border bg-background hover:bg-muted/50"
                    title={linked ? "Unlink X and Y" : "Link X and Y"}
                    onClick={() => {
                        const nextLinked = !linked;
                        if (nextLinked) onSetScaleY(scaleX);
                        onSetLinked(nextLinked);
                    }}
                >
                    {linked ? <Link2 className="size-4" /> : <Unlink2 className="size-4" />}
                </button>

                <label className="space-y-1">
                    <span className="text-muted-foreground">Y multiplier</span>
                    <Input
                        type="number"
                        step={0.1}
                        value={scaleY}
                        onChange={(event) => {
                            const next = Number(event.target.value);
                            onSetScaleY(next);
                            if (linked) onSetScaleX(next);
                        }}
                    />
                </label>
            </div>
        );
    }

    if (mode === "x") {
        return (
            <div className="grid grid-cols-1 gap-3">
                <label className="space-y-1">
                    <span className="text-muted-foreground">X multiplier</span>
                    <Input
                        type="number"
                        step={0.1}
                        value={scaleX}
                        onChange={(event) => onSetScaleX(Number(event.target.value))}
                    />
                </label>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            <label className="space-y-1">
                <span className="text-muted-foreground">Y multiplier</span>
                <Input
                    type="number"
                    step={0.1}
                    value={scaleY}
                    onChange={(event) => onSetScaleY(Number(event.target.value))}
                />
            </label>
        </div>
    );
}

export function ScaleDialog() {
    const [open, setOpen] = useAtom(scaleDialogOpenAtom);

    const selectionIndices = useAtomValue(selectedCommandIndicesAtom);
    const hitAreas = useAtomValue(canvasSegmentHitAreaElementsAtom);
    const currentPath = useAtomValue(rawPathAtom);

    const setSvgPathInput = useSetAtom(svgPathInputAtom);
    const setPathWithoutHistory = useSetAtom(doSetPathWithoutHistoryAtom);

    const { decimals, minifyOutput, strokeWidth } = useSnapshot(appSettings.pathEditor);
    const scaleUiSettingsSnapshot = useSnapshot(dialogsSettings.scale);

    const originalRawPathRef = useRef<string | null>(null);
    const didInitRef = useRef(false);

    const [originalRawPath, setOriginalRawPath] = useState<string | null>(null);
    const [originalModel, setOriginalModel] = useState<SvgPathModel | null>(null);
    const [selectionIndicesDraft, setSelectionIndicesDraft] = useState<number[]>([]);
    const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(null);

    // Draft controls:
    const [mode, setMode] = useState<ScaleDialogAxisMode>("uniform");
    const [scaleX, setScaleX] = useState<number>(1);
    const [scaleY, setScaleY] = useState<number>(1);
    const [linked, setLinked] = useState<boolean>(true);
    const [pivot, setPivot] = useState<ScaleDialogPivotPoint>("center");
    const [previewOnCanvas, setPreviewOnCanvas] = useState<boolean>(false);

    const closingWithOkRef = useRef(false);

    useLayoutEffect(() => {
        if (!open) return;
        if (didInitRef.current) return;
        didInitRef.current = true;

        const nextOriginalRawPath = currentPath;
        originalRawPathRef.current = nextOriginalRawPath;
        setOriginalRawPath(nextOriginalRawPath);

        let parsedModel: SvgPathModel | null = null;
        try {
            parsedModel = new SvgPathModel(nextOriginalRawPath.trim());
        } catch {
            parsedModel = null;
        }
        setOriginalModel(parsedModel);

        setSelectionIndicesDraft(selectionIndices);
        if (parsedModel) {
            setSelectionBounds(computeSelectionBounds(selectionIndices, hitAreas, parsedModel));
        } else {
            setSelectionBounds(null);
        }

        setMode(scaleUiSettingsSnapshot.mode);
        setScaleX(scaleUiSettingsSnapshot.scaleX);
        setScaleY(scaleUiSettingsSnapshot.mode === "uniform" && scaleUiSettingsSnapshot.linked
            ? scaleUiSettingsSnapshot.scaleX
            : scaleUiSettingsSnapshot.scaleY);
        setLinked(scaleUiSettingsSnapshot.linked);
        setPivot(scaleUiSettingsSnapshot.pivot);
        setPreviewOnCanvas(scaleUiSettingsSnapshot.previewOnCanvas);
    }, [open]);

    useEffect(() => {
        if (open) return;
        closingWithOkRef.current = false;
        didInitRef.current = false;
        originalRawPathRef.current = null;
        setOriginalRawPath(null);
        setOriginalModel(null);
        setSelectionIndicesDraft([]);
        setSelectionBounds(null);
    }, [open]);

    // Keep X and Y in sync when "linked" is enabled in uniform mode.
    useEffect(() => {
        if (mode !== "uniform") return;
        if (!linked) return;
        if (Math.abs(scaleY - scaleX) < 1e-12) return;
        setScaleY(scaleX);
    }, [mode, linked, scaleX]);

    const pivotPoint = useMemo(() => {
        if (!selectionBounds) return null;
        return pivotFromBounds(selectionBounds, pivot);
    }, [selectionBounds, pivot]);

    const preview = useMemo(() => {
        if (!originalModel) return null;
        if (!selectionIndicesDraft.length) return null;
        if (!pivotPoint) return null;

        const effectiveScaleX = mode === "uniform" || mode === "x" ? scaleX : 1;
        const effectiveScaleY = mode === "uniform"
            ? (linked ? scaleX : scaleY)
            : mode === "y"
                ? scaleY
                : 1;

        const model = originalModel.clone();
        model.scaleSegments(selectionIndicesDraft, effectiveScaleX, effectiveScaleY, pivotPoint);

        const path = model.toString(decimals, minifyOutput);
        const bounds = model.getBounds();

        return {
            path,
            bounds,
        };
    }, [
        originalModel,
        selectionIndicesDraft,
        pivotPoint,
        mode,
        scaleX,
        scaleY,
        linked,
        decimals,
        minifyOutput,
    ]);

    // Main-canvas preview:
    useEffect(() => {
        if (!open) return;
        if (closingWithOkRef.current) return;
        if (!originalRawPath) return;

        const nextPath = previewOnCanvas ? preview?.path : originalRawPath;
        if (!nextPath) return;

        if (nextPath === currentPath) return;
        setPathWithoutHistory(nextPath);
    }, [open, previewOnCanvas, preview?.path, originalRawPath, currentPath, setPathWithoutHistory]);

    function cancel() {
        // Prevent the live preview effect from re-applying the draft while we restore the original path.
        closingWithOkRef.current = true;
        const restorePath = originalRawPathRef.current ?? currentPath;
        if (restorePath) {
            setPathWithoutHistory(restorePath);
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

        setSvgPathInput(preview.path);
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
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
            }}
        >
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Scale</DialogTitle>
                    <DialogDescription>Scale selected elements with a chosen pivot point.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 text-xs">
                    <ScaleModeSelector mode={mode} onChange={(next) => setMode(next)} />

                    <div className="rounded border p-3">
                        <div className="mb-2 text-[11px] text-muted-foreground">Scale inputs</div>

                        <ScaleMultiplierInputs
                            mode={mode}
                            scaleX={scaleX}
                            scaleY={scaleY}
                            linked={linked}
                            onSetScaleX={setScaleX}
                            onSetScaleY={setScaleY}
                            onSetLinked={(next) => setLinked(next)}
                        />
                    </div>

                    <ScalePivotSelect
                        pivot={pivot}
                        onChange={(next) => setPivot(next)}
                        disabled={!selectionBounds}
                    />

                    <div className="rounded border p-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">Preview on main canvas</span>
                        <Switch checked={previewOnCanvas} onCheckedChange={(checked) => setPreviewOnCanvas(Boolean(checked))} />
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
