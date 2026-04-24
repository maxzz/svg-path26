import { useId } from "react";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type ViewBox } from "@/svg-core/9-types-svg-model";

type PreviewFrame = {
    strokeWidth: number;
    dashArray: string;
};

export function SvgPreviewBackdrop({ viewBox, frame, }: { viewBox: ViewBox; frame: PreviewFrame; }) {
    const { grid: showGrid } = useSnapshot(appSettings.sectionPreview);
    const [x, y, width, height] = viewBox;

    const gridPatternId = useId();
    const gridId = `${gridPatternId}-preview-grid`;

    return (<>
        {showGrid && (<>
            <defs>
                <pattern id={gridId} width="1" height="1" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                </pattern>
            </defs>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`url(#${gridId})`}
            />
        </>)}

        <rect
            className="fill-none stroke-[#7f7f7fb8] dark:stroke-[#ffffffb8]"
            x={x}
            y={y}
            width={width}
            height={height}
            strokeWidth={frame.strokeWidth}
            strokeDasharray={frame.dashArray}
            pointerEvents="none"
        />
    </>);
}
