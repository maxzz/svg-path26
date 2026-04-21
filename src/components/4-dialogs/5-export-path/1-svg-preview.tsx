import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { viewBoxDraftAtom } from "@/components/4-dialogs/5-export-path/8-dialog-export-atoms";
import { Switch } from "@/components/ui/shadcn/switch";

export function SvgPreview() {
    const { exportPreviewGrid } = useSnapshot(appSettings.export);

    return (
        <div className="px-2 pt-1 pb-2.5 border rounded select-none">
            <div className="mb-2 text-xs flex items-center justify-between">
                <p className="mb-0.5">
                    Live preview
                </p>

                <label className="-mr-1.5 flex items-center cursor-pointer">
                    <span className="mb-px -mr-0.75 text-muted-foreground">
                        Grid
                    </span>
                    <Switch
                        className="scale-50 cursor-pointer"
                        tabIndex={-1}
                        checked={exportPreviewGrid}
                        onCheckedChange={(checked) => { appSettings.export.exportPreviewGrid = Boolean(checked); }}
                    />
                </label>
            </div>

            <ExportPreviewSvg />
        </div>
    );
}

function ExportPreviewSvg() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth, exportPreviewGrid } = useSnapshot(appSettings.export);

    const pathValue = useAtomValue(svgPathInputAtom);
    const viewBoxDraft = useAtomValue(viewBoxDraftAtom);

    const previewWidth = Math.max(1e-6, viewBoxDraft[2]);
    const previewHeight = Math.max(1e-6, viewBoxDraft[3]);

    return (
        <svg className="w-full h-40" viewBox={`${viewBoxDraft[0]} ${viewBoxDraft[1]} ${previewWidth} ${previewHeight}`}>
            {exportPreviewGrid && (<>
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
            </>)}

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
                className="fill-none stroke-muted-foreground/75"
                strokeWidth={0.3}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
