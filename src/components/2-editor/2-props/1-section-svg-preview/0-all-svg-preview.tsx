import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { svgInputErrorAtom, svgInputSelectedNodeAtom } from "@/store/0-atoms/1-3-svg-input";
import { serializeSvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { usePreviewUnitsPerPixel } from "./4-preview-units.tsx";
import { applyPreviewOverrides } from "./5-preview-attrs.tsx";
import { SvgPreviewBackdrop } from "./6-svg-preview-backdrop.tsx";
import { SvgPreview_Label, SvgPreview_Overlay } from "./7-svg-preview-overlay";

export function Section_SvgPreview() {
    const { showSvgPreviewSection } = useSnapshot(appSettings);
    if (!showSvgPreviewSection) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="svg-preview" label={<SvgPreview_Label />} contentClassName="px-1 py-1" overlay={<SvgPreview_Overlay />}>
                <div className="px-2 pt-1 pb-2.5 border rounded select-none flex flex-col gap-2">
                    <SvgPreview />
                </div>
            </SectionPanel>
        </TooltipProvider>
    );
}

function SvgPreview() {
    const { fill: showFill, stroke: showStroke } = useSnapshot(appSettings.sectionPreview);

    const selectedNode = useAtomValue(svgInputSelectedNodeAtom);
    const parseError = useAtomValue(svgInputErrorAtom);
    const viewBox = useSnapshot(appSettings.pathEditor).viewBox;
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;

    const previewWidth = Math.max(1e-6, viewBoxWidth);
    const previewHeight = Math.max(1e-6, viewBoxHeight);
    const previewViewBox: ViewBox = [viewBoxX, viewBoxY, previewWidth, previewHeight];

    const { svgRef, unitsPerPixel } = usePreviewUnitsPerPixel(previewWidth, previewHeight);
    const frameUnits = {
        strokeWidth: Math.max(unitsPerPixel * 1.5, unitsPerPixel),
        dashArray: `${unitsPerPixel * 3} ${unitsPerPixel * 1.5}`,
    };

    const rootNode = selectedNode ? toPreviewNode(selectedNode) : null;
    const previewNode = rootNode
        ? applyPreviewOverrides(rootNode, {
            showFill,
            showStroke,
            defaultStrokeColor: "currentColor",
            defaultStrokeWidth: frameUnits.strokeWidth,
        })
        : null;
    const previewMarkup = previewNode ? serializeSvgInputDocument({ root: previewNode, sourceKind: "svg-fragment" }) : "";

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
            <svg ref={svgRef} className="absolute inset-0 h-full w-full text-foreground" viewBox={viewBox.join(" ")} xmlns="http://www.w3.org/2000/svg" pointerEvents="none" aria-hidden="true">
                <SvgPreviewBackdrop viewBox={previewViewBox} frameUnits={frameUnits} />
                <g className="svg-preview-content" dangerouslySetInnerHTML={{ __html: previewMarkup }} />
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

const SVG_ROOT_ATTRS_TO_STRIP = new Set(["viewbox", "width", "height", "x", "y", "xmlns", "xmlns:xlink",]);
