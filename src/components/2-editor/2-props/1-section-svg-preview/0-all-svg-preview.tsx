import { useId } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { Switch } from "@/components/ui/shadcn/switch";
import { appSettings } from "@/store/0-ui-settings";
import { svgInputErrorAtom, svgInputSelectedNodeAtom } from "@/store/0-atoms/1-3-svg-input";
import { serializeSvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { parseViewBoxString } from "@/store/8-utils/1-viewbox-utils";

export function Section_SvgPreview() {
    const { showSvgPreviewSection } = useSnapshot(appSettings);
    if (!showSvgPreviewSection) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="svg-preview" label="SVG preview" contentClassName="px-1 py-1">
                <SvgPreview />
            </SectionPanel>
        </TooltipProvider>
    );
}

function SvgPreview() {
    const [previewGrid, setPreviewGrid] = useAtom(previewGridAtom);
    const viewBoxStr = usePreviewViewBoxString();

    return (
        <div className="px-2 pt-1 pb-2.5 border rounded select-none flex flex-col gap-2">
            <div className="text-xs flex items-center justify-between">
                <div className="min-w-0">
                    <p className="mb-0.5">
                        Live preview (viewBox: {viewBoxStr})
                    </p>
                </div>

                <label className="-mr-1.5 flex items-center cursor-pointer">
                    <span className="mb-px -mr-0.75 text-muted-foreground">
                        Grid
                    </span>
                    <Switch
                        className="scale-50 cursor-pointer"
                        tabIndex={-1}
                        checked={previewGrid}
                        onCheckedChange={(checked) => setPreviewGrid(Boolean(checked))}
                    />
                </label>
            </div>

            <SvgPreviewContent />
        </div>
    );
}

const previewGridAtom = atom(true);

function SvgPreviewContent() {
    const selectedNode = useAtomValue(svgInputSelectedNodeAtom);
    const parseError = useAtomValue(svgInputErrorAtom);
    const [previewGrid] = useAtom(previewGridAtom);
    const gridPatternId = useId();
    const viewBoxStr = usePreviewViewBoxString();

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

function usePreviewViewBoxString() {
    const { viewBox } = useSnapshot(appSettings.pathEditor);
    return viewBox.join(" ");
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
