import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { exportViewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";

export function SvgPreview() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = useSnapshot(appSettings.export);

    const exportViewBoxDraft = useAtomValue(exportViewBoxDraftAtom);
    const pathValue = useAtomValue(svgPathInputAtom);
    const previewWidth = Math.max(1e-6, exportViewBoxDraft[2]);
    const previewHeight = Math.max(1e-6, exportViewBoxDraft[3]);
    return (
        <div className="rounded border p-2">
            <p className="mb-2 text-[11px] text-muted-foreground">Live preview</p>
            <svg
                className="h-40 w-full rounded bg-muted/20"
                viewBox={`${exportViewBoxDraft[0]} ${exportViewBoxDraft[1]} ${previewWidth} ${previewHeight}`}
            >
                <defs>
                    <pattern id="export-preview-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                    </pattern>
                </defs>
                <rect
                    x={exportViewBoxDraft[0]}
                    y={exportViewBoxDraft[1]}
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
                    x={exportViewBoxDraft[0]}
                    y={exportViewBoxDraft[1]}
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
