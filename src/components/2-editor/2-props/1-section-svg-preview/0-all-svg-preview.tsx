import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { svgInputErrorAtom, svgInputSelectedNodeAtom } from "@/store/0-atoms/1-3-svg-input";
import { serializeSvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { type SizeWH } from "@/svg-core/9-types-svg-model";
import { SvgPreviewLabel, SvgPreviewOverlay } from "./7-svg-preview-overlay.tsx";

export function Section_SvgPreview() {
    const { showSvgPreviewSection } = useSnapshot(appSettings);
    if (!showSvgPreviewSection) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="svg-preview" label={<SvgPreviewLabel />} contentClassName="px-1 py-1" overlay={<SvgPreviewOverlay />}>
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
    const gridPatternId = useId();
    const selectedNode = useAtomValue(svgInputSelectedNodeAtom);
    const parseError = useAtomValue(svgInputErrorAtom);
    const viewBox = useSnapshot(appSettings.pathEditor).viewBox;
    const { grid: showGrid, fill: showFill, stroke: showStroke } = useSnapshot(appSettings.sectionPreview);
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
    const viewBoxStr = viewBox.join(" ");

    const previewNode = selectedNode ? toPreviewNode(selectedNode) : null;
    const previewMarkup = previewNode ? serializeSvgInputDocument({ root: previewNode, sourceKind: "svg-fragment" }) : "";
    const gridId = `${gridPatternId}-preview-grid`;
    const previewWidth = Math.max(1e-6, viewBoxWidth);
    const previewHeight = Math.max(1e-6, viewBoxHeight);

    const { svgRef, unitsPerPixel } = usePreviewUnitsPerPixel(previewWidth, previewHeight);
    const frameStrokeWidth = Math.max(unitsPerPixel * 1.5, unitsPerPixel);
    const frameDashArray = `${unitsPerPixel * 3} ${unitsPerPixel * 1.5}`;
    const previewStyle = getPreviewStyle(showFill, showStroke);

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
            <svg ref={svgRef} className="absolute inset-0 h-full w-full" viewBox={viewBoxStr} xmlns="http://www.w3.org/2000/svg" pointerEvents="none" aria-hidden="true">
                {showGrid && (<>
                    <defs>
                        <pattern id={gridId} width="1" height="1" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                        </pattern>
                    </defs>
                    <rect
                        x={viewBoxX}
                        y={viewBoxY}
                        width={previewWidth}
                        height={previewHeight}
                        fill={`url(#${gridId})`}
                    />
                </>)}

                {previewStyle && <style>{previewStyle}</style>}

                <g className="svg-preview-content" dangerouslySetInnerHTML={{ __html: previewMarkup }} />

                <rect
                    className="fill-none stroke-[#7f7f7fb8] dark:stroke-[#ffffffb8]"
                    x={viewBoxX}
                    y={viewBoxY}
                    width={previewWidth}
                    height={previewHeight}
                    strokeWidth={frameStrokeWidth}
                    strokeDasharray={frameDashArray}
                    pointerEvents="none"
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

const SVG_ROOT_ATTRS_TO_STRIP = new Set(["viewbox", "width", "height", "x", "y", "xmlns", "xmlns:xlink",]);

function usePreviewUnitsPerPixel(viewBoxWidth: number, viewBoxHeight: number) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [viewportSize, setViewportSize] = useState<SizeWH | null>(null);

    useEffect(
        () => {
            const svg = svgRef.current;
            if (!svg) {
                setViewportSize(null);
                return;
            }

            const updateSize = () => {
                const rect = svg.getBoundingClientRect();
                setViewportSize({ width: rect.width, height: rect.height });
            };

            updateSize();
            const observer = new ResizeObserver(() => updateSize());
            observer.observe(svg);
            return () => observer.disconnect();
        },
        []);

    const unitsPerPixel = useMemo(
        () => getSvgUnitsPerPixel(viewBoxWidth, viewBoxHeight, viewportSize),
        [viewBoxWidth, viewBoxHeight, viewportSize]
    );

    return { svgRef, unitsPerPixel };
}

function getSvgUnitsPerPixel(width: number, height: number, viewPortSize: SizeWH | null): number {
    if (!viewPortSize || viewPortSize.width <= 0 || viewPortSize.height <= 0) {
        return Math.max(width, height) / FALLBACK_VIEWPORT_PIXELS;
    }

    return Math.max(width / viewPortSize.width, height / viewPortSize.height);
}

const FALLBACK_VIEWPORT_PIXELS = 160;

function getPreviewStyle(showFill: boolean, showStroke: boolean): string {
    const rules: string[] = [];
    if (!showFill) {
        rules.push(".svg-preview-content * { fill: none !important; }");
    }
    if (!showStroke) {
        rules.push(".svg-preview-content * { stroke: none !important; }");
    }
    return rules.join("\n");
}
