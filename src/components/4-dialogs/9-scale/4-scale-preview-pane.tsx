import type { SelectionBounds } from "./3-scale-selection";

export function ScalePreviewPane({ preview, fillPreview, strokeWidth }: { preview: { path: string; bounds: SelectionBounds; } | null; fillPreview: boolean; strokeWidth: number; }) {
    if (!preview) {
        return (
            <div className="h-56 flex items-center justify-center text-muted-foreground">
                Preview unavailable
            </div>
        );
    }

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
                fill={fillPreview ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={strokeWidth}
            />
        </svg>
    );
}

