import { useId } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { svgInputErrorAtom, svgInputSelectedNodeAtom } from "@/store/0-atoms/1-3-svg-input";
import { serializeSvgInputDocument, type SvgInputAttribute, type SvgInputNode } from "@/svg-core/3-svg-input";
import { usePreviewUnitsPerPixel } from "./5-preview-units";
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

    const gridId = `${gridPatternId}-preview-grid`;
    const previewWidth = Math.max(1e-6, viewBoxWidth);
    const previewHeight = Math.max(1e-6, viewBoxHeight);

    const { svgRef, unitsPerPixel } = usePreviewUnitsPerPixel(previewWidth, previewHeight);
    const frameStrokeWidth = Math.max(unitsPerPixel * 1.5, unitsPerPixel);
    const frameDashArray = `${unitsPerPixel * 3} ${unitsPerPixel * 1.5}`;
    const previewNode = selectedNode ? applyPreviewOverrides(
        toPreviewNode(selectedNode),
        {
            showFill,
            showStroke,
            defaultStrokeColor: "currentColor",
            defaultStrokeWidth: frameStrokeWidth,
        }
    ) : null;
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
            <svg ref={svgRef} className="absolute inset-0 h-full w-full text-foreground" viewBox={viewBoxStr} xmlns="http://www.w3.org/2000/svg" pointerEvents="none" aria-hidden="true">
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

type PreviewOverrides = {
    showFill: boolean;
    showStroke: boolean;
    defaultStrokeColor: string;
    defaultStrokeWidth: number;
};

function applyPreviewOverrides(node: SvgInputNode, options: PreviewOverrides): SvgInputNode {
    const attributes = updatePreviewAttributes(node.tagName, node.attributes, options);
    const children = node.children.map((child) => applyPreviewOverrides(child, options));
    return {
        ...node,
        attributes,
        children,
    };
}

function updatePreviewAttributes(tagName: string, attributes: SvgInputAttribute[], options: PreviewOverrides): SvgInputAttribute[] {
    const next = attributes.map((attribute) => ({ ...attribute }));
    const styleOverrides: string[] = [];
    const isStrokeTarget = PREVIEW_STROKE_TARGETS.has(tagName);
    const strokeValue = getStyleValue(next, "stroke") ?? getAttributeValue(next, "stroke");
    const strokeWidthValue = getStyleValue(next, "stroke-width") ?? getAttributeValue(next, "stroke-width");
    const strokeOpacityValue = getStyleValue(next, "stroke-opacity") ?? getAttributeValue(next, "stroke-opacity");

    if (!options.showFill) {
        upsertAttribute(next, "fill", "none");
        upsertAttribute(next, "fill-opacity", "0");
        styleOverrides.push("fill: none !important", "fill-opacity: 0 !important");
    }

    if (!options.showStroke) {
        upsertAttribute(next, "stroke", "none");
        upsertAttribute(next, "stroke-width", "0");
        upsertAttribute(next, "stroke-opacity", "0");
        styleOverrides.push("stroke: none !important", "stroke-width: 0 !important", "stroke-opacity: 0 !important");
    } else if (isStrokeTarget && shouldAddDefaultStroke(strokeValue)) {
        const needsStrokeWidth = !hasUsableStrokeWidth(strokeWidthValue);
        const needsStrokeOpacity = !hasUsableStrokeOpacity(strokeOpacityValue);
        upsertAttribute(next, "stroke", options.defaultStrokeColor);
        if (needsStrokeWidth) {
            upsertAttribute(next, "stroke-width", options.defaultStrokeWidth.toString());
        }
        if (needsStrokeOpacity) {
            upsertAttribute(next, "stroke-opacity", "1");
        }
        styleOverrides.push(
            `stroke: ${options.defaultStrokeColor} !important`,
            ...(needsStrokeWidth ? [`stroke-width: ${options.defaultStrokeWidth} !important`] : []),
            ...(needsStrokeOpacity ? ["stroke-opacity: 1 !important"] : [])
        );
    }

    if (styleOverrides.length > 0) {
        const existingStyle = getAttributeValue(next, "style") ?? "";
        upsertAttribute(next, "style", mergeStyleOverrides(existingStyle, styleOverrides));
    }

    return next;
}

function getAttributeValue(attributes: SvgInputAttribute[], name: string): string | undefined {
    const match = attributes.find((attribute) => attribute.name.toLowerCase() === name);
    return match?.value;
}

function upsertAttribute(attributes: SvgInputAttribute[], name: string, value: string) {
    const index = attributes.findIndex((attribute) => attribute.name.toLowerCase() === name);
    if (index >= 0) {
        attributes[index] = { ...attributes[index], value };
        return;
    }
    attributes.push({ name, value });
}

function mergeStyleOverrides(existingStyle: string, overrides: string[]): string {
    const trimmed = existingStyle.trim();
    const suffix = overrides.join("; ");
    if (!trimmed) {
        return `${suffix};`;
    }
    const normalized = trimmed.endsWith(";") ? trimmed : `${trimmed};`;
    return `${normalized} ${suffix};`;
}

function getStyleValue(attributes: SvgInputAttribute[], name: string): string | undefined {
    const style = getAttributeValue(attributes, "style");
    if (!style) return undefined;
    const entries = style
        .split(";")
        .map((entry) => entry.trim())
        .filter(Boolean);
    for (const entry of entries) {
        const [property, ...rest] = entry.split(":");
        if (!property) continue;
        if (property.trim().toLowerCase() === name) {
            return rest.join(":").trim();
        }
    }
    return undefined;
}

function shouldAddDefaultStroke(strokeValue: string | undefined): boolean {
    if (!strokeValue) return true;
    const normalized = strokeValue.trim().toLowerCase();
    return normalized === "none" || normalized === "transparent";
}

function hasUsableStrokeWidth(value: string | undefined): boolean {
    if (!value) return false;
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return true;
    return numeric > 0;
}

function hasUsableStrokeOpacity(value: string | undefined): boolean {
    if (!value) return false;
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return true;
    return numeric > 0;
}

const PREVIEW_STROKE_TARGETS = new Set([
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
]);
