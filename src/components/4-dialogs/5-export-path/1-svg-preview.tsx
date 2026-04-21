import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { viewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";

export function SvgPreview() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = useSnapshot(appSettings.export);

    const pathValue = useAtomValue(svgPathInputAtom);
    const viewBoxDraft = useAtomValue(viewBoxDraftAtom);

    const previewWidth = Math.max(1e-6, viewBoxDraft[2]);
    const previewHeight = Math.max(1e-6, viewBoxDraft[3]);

    return (
        <div className="rounded border p-2">
            <p className="mb-2 text-[11px] text-muted-foreground">
                Live preview
            </p>

            <svg className="h-40 w-full rounded bg-muted/20" viewBox={`${viewBoxDraft[0]} ${viewBoxDraft[1]} ${previewWidth} ${previewHeight}`}>
                <defs>
                    <pattern id="export-preview-grid" width="1" height="1" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                    </pattern>
                </defs>

                <rect
                    x={viewBoxDraft[0]}
                    y={viewBoxDraft[1]}
                    width={previewWidth}
                    height={previewHeight}
                    fill="url(#export-preview-grid)"
                />

                <path
                    d={pathValue || "M 0 0"}
                    fill={exportFill ? exportFillColor : "none"}
                    stroke={exportStroke ? exportStrokeColor : "none"}
                    strokeWidth={exportStroke ? exportStrokeWidth : 0}
                />

                <rect
                    x={viewBoxDraft[0]}
                    y={viewBoxDraft[1]}
                    width={previewWidth}
                    height={previewHeight}
                    fill="none"
                    stroke="oklch(0.6 0 0 / 0.75)"
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
}
