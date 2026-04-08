import { SvgPathModel } from "@/svg-core/2-svg-model";
import type { Point } from "@/svg-core/9-types-svg-model";
import type { ScaleDialogPivotPoint } from "@/store/10-dialogs-ui-settings-types-and-defaults";

export type SelectionBounds = { xmin: number; ymin: number; xmax: number; ymax: number; };

export const pivotOptions: Array<{ value: ScaleDialogPivotPoint; label: string; }> = [
    { value: "topLeft", label: "Top-left" },
    { value: "topRight", label: "Top-right" },
    { value: "bottomLeft", label: "Bottom-left" },
    { value: "bottomRight", label: "Bottom-right" },
    { value: "center", label: "Center" },
];

export function computeSelectionBounds(
    selectionIndices: number[],
    hitAreas: Record<number, SVGPathElement | null>,
    model: SvgPathModel
): SelectionBounds | null {
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

export function pivotFromBounds(bounds: SelectionBounds, pivot: ScaleDialogPivotPoint): Point {
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

export function ScalePivotSelect({
    pivot,
    onChange,
    disabled,
}: {
    pivot: ScaleDialogPivotPoint;
    onChange: (next: ScaleDialogPivotPoint) => void;
    disabled: boolean;
}) {
    return (
        <div className="rounded border p-3">
            <div className="mb-2 text-[11px] text-muted-foreground">Pivot point</div>
            <label className="space-y-1">
                <span className="text-muted-foreground">Pivot Point (selection bounds)</span>
                <select
                    className="h-8 w-full rounded border bg-background px-2 text-xs disabled:opacity-50"
                    value={pivot}
                    onChange={(event) => onChange(event.target.value as ScaleDialogPivotPoint)}
                    disabled={disabled}
                >
                    {pivotOptions.map((it) => (
                        <option key={it.value} value={it.value}>
                            {it.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}

