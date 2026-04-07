import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Link2, Unlink2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/shadcn/radio-group";
import { Switch } from "@/components/ui/shadcn/switch";

import { SvgPathModel } from "@/svg-core/2-svg-model";
import type { Point } from "@/svg-core/9-types-svg-model";

import { canvasSegmentHitAreaElementsAtom, selectedCommandIndicesAtom } from "@/store/0-atoms/2-4-editor-actions";
import { doSetPathWithoutHistoryAtom } from "@/store/0-atoms/1-2-history";
import { rawPathAtom } from "@/store/0-atoms/1-0-raw-path";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { scaleDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { appSettings, dialogsSettings } from "@/store/0-ui-settings";
import type { ScaleDialogAxisMode, ScaleDialogPivotPoint } from "@/store/10-dialogs-ui-settings-types-and-defaults";

type SelectionBounds = { xmin: number; ymin: number; xmax: number; ymax: number; };

const pivotOptions: Array<{ value: ScaleDialogPivotPoint; label: string; }> = [
    { value: "topLeft", label: "Top-left" },
    { value: "topRight", label: "Top-right" },
    { value: "bottomLeft", label: "Bottom-left" },
    { value: "bottomRight", label: "Bottom-right" },
    { value: "center", label: "Center" },
];

function computeSelectionBounds(selectionIndices: number[], hitAreas: Record<number, SVGPathElement | null>, model: SvgPathModel): SelectionBounds | null {
    let xmin = Infinity;
    let ymin = Infinity;
    let xmax = -Infinity;
    let ymax = -Infinity;

    for (const segmentIndex of selectionIndices) {
        const element = hitAreas[segmentIndex];
        if (element) {
            try {
                const box = element.getBBox();
                const bxmin = box.x;
                const bymin = box.y;
                const bxmax = box.x + box.width;
                const bymax = box.y + box.height;
                if (
                    Number.isFinite(bxmin)
                    && Number.isFinite(bymin)
                    && Number.isFinite(bxmax)
                    && Number.isFinite(bymax)
                ) {
                    xmin = Math.min(xmin, bxmin);
                    ymin = Math.min(ymin, bymin);
                    xmax = Math.max(xmax, bxmax);
                    ymax = Math.max(ymax, bymax);
                    continue;
                }
            } catch {
                // fall back to model bounds
            }
        }

        const standalonePath = model.getStandaloneSegmentPath(segmentIndex);
        if (!standalonePath) continue;

        try {
            const standaloneModel = new SvgPathModel(standalonePath);
            const bounds = standaloneModel.getBounds();
            if (
                Number.isFinite(bounds.xmin)
                && Number.isFinite(bounds.ymin)
                && Number.isFinite(bounds.xmax)
                && Number.isFinite(bounds.ymax)
            ) {
                xmin = Math.min(xmin, bounds.xmin);
                ymin = Math.min(ymin, bounds.ymin);
                xmax = Math.max(xmax, bounds.xmax);
                ymax = Math.max(ymax, bounds.ymax);
            }
        } catch {
            // no-op for a single problematic segment
        }
    }

    if (!Number.isFinite(xmin) || !Number.isFinite(ymin) || !Number.isFinite(xmax) || !Number.isFinite(ymax)) return null;

    return { xmin, ymin, xmax, ymax };
}

function pivotFromBounds(bounds: SelectionBounds, pivot: ScaleDialogPivotPoint): Point {
    const { xmin, ymin, xmax, ymax } = bounds;
    const centerX = (xmin + xmax) / 2;
    const centerY = (ymin + ymax) / 2;

    switch (pivot) {
        case "topLeft":
            return { x: xmin, y: ymin };
        case "topRight":
            return { x: xmax, y: ymin };
        case "bottomLeft":
            return { x: xmin, y: ymax };
        case "bottomRight":
            return { x: xmax, y: ymax };
        case "center":
            return { x: centerX, y: centerY };
    }
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
                    <div className="rounded border p-3">
                        <div className="mb-2 text-[11px] text-muted-foreground">Mode</div>
                        <RadioGroup
                            value={mode}
                            onValueChange={(value) => setMode(value as ScaleDialogAxisMode)}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                        >
                            <label className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 select-none">
                                <span>Scale Uniform</span>
                                <RadioGroupItem value="uniform" />
                            </label>
                            <label className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 select-none">
                                <span>Scale by X only</span>
                                <RadioGroupItem value="x" />
                            </label>
                            <label className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 select-none">
                                <span>Scale by Y only</span>
                                <RadioGroupItem value="y" />
                            </label>
                        </RadioGroup>
                    </div>

                    <div className="rounded border p-3">
                        <div className="mb-2 text-[11px] text-muted-foreground">Scale inputs</div>

                        {mode === "uniform" ? (
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                                <label className="space-y-1">
                                    <span className="text-muted-foreground">X multiplier</span>
                                    <Input
                                        type="number"
                                        step={0.1}
                                        value={scaleX}
                                        onChange={(event) => {
                                            const next = Number(event.target.value);
                                            setScaleX(next);
                                            if (linked) setScaleY(next);
                                        }}
                                    />
                                </label>

                                <button
                                    type="button"
                                    className="h-8 w-8 inline-flex items-center justify-center rounded border bg-background hover:bg-muted/50"
                                    title={linked ? "Unlink X and Y" : "Link X and Y"}
                                    onClick={() => {
                                        setLinked((previous) => {
                                            const next = !previous;
                                            if (next) {
                                                setScaleY(scaleX);
                                            }
                                            return next;
                                        });
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
                                            setScaleY(next);
                                            if (linked) setScaleX(next);
                                        }}
                                    />
                                </label>
                            </div>
                        ) : mode === "x" ? (
                            <div className="grid grid-cols-1 gap-3">
                                <label className="space-y-1">
                                    <span className="text-muted-foreground">X multiplier</span>
                                    <Input
                                        type="number"
                                        step={0.1}
                                        value={scaleX}
                                        onChange={(event) => setScaleX(Number(event.target.value))}
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                <label className="space-y-1">
                                    <span className="text-muted-foreground">Y multiplier</span>
                                    <Input
                                        type="number"
                                        step={0.1}
                                        value={scaleY}
                                        onChange={(event) => setScaleY(Number(event.target.value))}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="rounded border p-3">
                        <div className="mb-2 text-[11px] text-muted-foreground">Pivot point</div>

                        <label className="space-y-1">
                            <span className="text-muted-foreground">Pivot Point (selection bounds)</span>
                            <select
                                className="h-8 w-full rounded border bg-background px-2 text-xs disabled:opacity-50"
                                value={pivot}
                                onChange={(event) => setPivot(event.target.value as ScaleDialogPivotPoint)}
                                disabled={!selectionBounds}
                            >
                                {pivotOptions.map((it) => (
                                    <option key={it.value} value={it.value}>
                                        {it.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="rounded border p-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">Preview on main canvas</span>
                        <Switch checked={previewOnCanvas} onCheckedChange={(checked) => setPreviewOnCanvas(Boolean(checked))} />
                    </div>

                    <div className="rounded border p-3">
                        <div className="mb-2 text-[11px] text-muted-foreground">Live preview</div>
                        {preview ? (
                            (() => {
                                const width = Math.max(1e-6, preview.bounds.xmax - preview.bounds.xmin);
                                const height = Math.max(1e-6, preview.bounds.ymax - preview.bounds.ymin);
                                const viewBox = `${preview.bounds.xmin} ${preview.bounds.ymin} ${width} ${height}`;
                                return (
                                    <svg
                                        className="h-56 w-full rounded bg-muted/20"
                                        viewBox={viewBox}
                                    >
                                        <defs>
                                            <pattern id="scale-preview-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                                            </pattern>
                                        </defs>
                                        <rect
                                            x={preview.bounds.xmin}
                                            y={preview.bounds.ymin}
                                            width={width}
                                            height={height}
                                            fill="url(#scale-preview-grid)"
                                        />
                                        <path
                                            d={preview.path || "M 0 0"}
                                            fill={appSettings.canvas.fillPreview ? "currentColor" : "none"}
                                            stroke="currentColor"
                                            strokeWidth={strokeWidth}
                                        />
                                    </svg>
                                );
                            })()
                        ) : (
                            <div className="h-56 flex items-center justify-center text-muted-foreground">
                                Preview unavailable
                            </div>
                        )}
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

