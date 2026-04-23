import { useId } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { svgInputErrorAtom, svgInputSelectedNodeAtom } from "@/store/0-atoms/1-3-svg-input";
import { type SvgInputNode, serializeSvgInputDocument } from "@/svg-core/3-svg-input";
import { parseViewBoxString } from "@/store/8-utils/1-viewbox-utils";
import { showGridAtom, SvgPreviewLabel, SvgPreviewOverlay } from "./1-svg-preview-controls.tsx";

export function Section_SvgPreview() {
    const { showSvgPreviewSection } = useSnapshot(appSettings);
    if (!showSvgPreviewSection) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel
                sectionKey="svg-preview"
                label={<SvgPreviewLabel />}
                contentClassName="px-1 py-1"
                overlay={<SvgPreviewOverlay />}
            >
                <SvgPreview />
            </SectionPanel>
        </TooltipProvider>
    );
}

function SvgPreview() {
    return (
        <div className="px-2 pt-1 pb-2.5 border rounded select-none flex flex-col gap-2">
            <SvgPreviewContent />
        </div>
    );
}

function SvgPreviewContent() {
    const selectedNode = useAtomValue(svgInputSelectedNodeAtom);
    const parseError = useAtomValue(svgInputErrorAtom);
    const previewGrid = useAtomValue(showGridAtom);
    const gridPatternId = useId();
    const viewBoxStr = useSnapshot(appSettings.pathEditor).viewBox.join(" ");

    const previewNode = selectedNode ? toPreviewNode(selectedNode) : null;
    const previewMarkup = previewNode ? serializeSvgInputDocument({ root: previewNode, sourceKind: "svg-fragment" }) : "";
    const gridId = `${gridPatternId}-preview-grid`;
    const viewBoxNumbers = parseViewBoxString(viewBoxStr);
    const previewWidth = Math.max(1e-6, viewBoxNumbers[2]);
    const previewHeight = Math.max(1e-6, viewBoxNumbers[3]);

    if (parseError) {
        return (
            <div className="rounded border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                {parseError}
            </div>
        );
    }

    if (!selectedNode) {
        return (
            <div className="px-3 py-3 text-[11px] leading-5 text-muted-foreground">
                Paste SVG markup, a &lt;path&gt; element, or path data here to preview.
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-40 flex-1 overflow-hidden rounded bg-muted/20">
            <svg className="absolute inset-0 h-full w-full" viewBox={viewBoxStr} xmlns="http://www.w3.org/2000/svg" pointerEvents="none" aria-hidden="true">
                {previewGrid && (
                    <>
                        <defs>
                            <pattern id={gridId} width="1" height="1" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                            </pattern>
                        </defs>
                        <rect
                            x={viewBoxNumbers[0]}
                            y={viewBoxNumbers[1]}
                            width={previewWidth}
                            height={previewHeight}
                            fill={`url(#${gridId})`}
                        />
                    </>
                )}
                <g dangerouslySetInnerHTML={{ __html: previewMarkup }} />
                <rect
                    x={viewBoxNumbers[0]}
                    y={viewBoxNumbers[1]}
                    width={previewWidth}
                    height={previewHeight}
                    className="fill-none stroke-muted-foreground/75"
                    strokeWidth={0.3}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
}

function toPreviewNode(node: SvgInputNode): SvgInputNode {
    if (node.tagName !== "svg") {
        return node;
    }

    return {
        ...node,
        tagName: "g",
        attributes: node.attributes.filter(
            (attribute) => !SVG_ROOT_ATTRS_TO_STRIP.has(attribute.name.toLowerCase())
        ),
    };
}

const SVG_ROOT_ATTRS_TO_STRIP = new Set([
    "viewbox",
    "width",
    "height",
    "x",
    "y",
    "xmlns",
    "xmlns:xlink",
]);
