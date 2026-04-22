import { useId, type ReactNode } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { Switch } from "@/components/ui/shadcn/switch";
import { appSettings } from "@/store/0-ui-settings";
import { svgInputDocumentAtom, svgInputErrorAtom, svgInputSelectedNodeAtom } from "@/store/0-atoms/1-3-svg-input";
import { serializeSvgInputDocument } from "@/svg-core/3-svg-input";

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

export function SvgPreview() {
    const document = useAtomValue(svgInputDocumentAtom);
    const selectedNode = useAtomValue(svgInputSelectedNodeAtom);
    const parseError = useAtomValue(svgInputErrorAtom);
    const { viewBox } = useSnapshot(appSettings.pathEditor);
    const [svgPreviewGrid, setSvgPreviewGrid] = useAtom(svgPreviewGridAtom);
    const gridPatternId = useId();

    const fallbackViewBoxString = viewBox.join(" ");
    const inputRootViewBoxString = document?.root.tagName === "svg"
        ? document.root.attributes.find((attribute) => attribute.name.toLowerCase() === "viewbox")?.value?.trim() ?? null
        : null;

    const viewBoxString = inputRootViewBoxString ?? fallbackViewBoxString;
    const previewMarkup = selectedNode ? serializeSvgInputDocument({ root: selectedNode, sourceKind: "svg-fragment" }) : "";
    const gridId = `${gridPatternId}-preview-grid`;
    const viewBoxNumbers = parseViewBoxNumbers(viewBoxString);

    let content: ReactNode;
    if (parseError) {
        content = (
            <div className="rounded border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                {parseError}
            </div>
        );
    } else if (!selectedNode) {
        content = (
            <div className="px-3 py-3 text-[11px] leading-5 text-muted-foreground">
                Paste SVG markup, a &lt;path&gt; element, or path data here to preview.
            </div>
        );
    } else if (selectedNode.tagName === "svg") {
        content = (
            <div className="relative h-40 w-full overflow-hidden rounded bg-muted/20">
                <div
                    className="h-full w-full p-1 [&svg]:block [&svg]:h-full [&svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: previewMarkup }}
                />
                {svgPreviewGrid && (
                    <PreviewGridOverlay viewBoxString={viewBoxString} viewBox={viewBoxNumbers} gridId={gridId} className="inset-1" />
                )}
            </div>
        );
    } else {
        content = (
            <div className="relative h-40 w-full">
                <svg
                    className="h-40 w-full rounded bg-muted/20"
                    viewBox={viewBoxString}
                    xmlns="http://www.w3.org/2000/svg"
                    pointerEvents="none"
                    dangerouslySetInnerHTML={{ __html: previewMarkup }}
                />
                {svgPreviewGrid && (
                    <PreviewGridOverlay viewBoxString={viewBoxString} viewBox={viewBoxNumbers} gridId={gridId} className="inset-0 rounded" />
                )}
            </div>
        );
    }

    return (
        <div className="px-2 pt-1 pb-2.5 border rounded select-none">
            <div className="mb-2 text-xs flex items-center justify-between">
                <div className="min-w-0">
                    <p className="mb-0.5">
                        Live preview
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate" title={`ViewBox: ${viewBoxString}`}>
                        ViewBox: {viewBoxString}
                    </p>
                </div>

                <label className="-mr-1.5 flex items-center cursor-pointer">
                    <span className="mb-px -mr-0.75 text-muted-foreground">
                        Grid
                    </span>
                    <Switch
                        className="scale-50 cursor-pointer"
                        tabIndex={-1}
                        checked={svgPreviewGrid}
                        onCheckedChange={(checked) => setSvgPreviewGrid(Boolean(checked))}
                    />
                </label>
            </div>

            {content}
        </div>
    );
}

const svgPreviewGridAtom = atom(true);

function PreviewGridOverlay({ viewBoxString, viewBox, gridId, className }: { viewBoxString: string; viewBox: [number, number, number, number]; gridId: string; className: string; }) {
    const previewWidth = Math.max(1e-6, viewBox[2]);
    const previewHeight = Math.max(1e-6, viewBox[3]);

    return (
        <svg
            className={`pointer-events-none absolute ${className}`}
            viewBox={viewBoxString}
            aria-hidden="true"
        >
            <defs>
                <pattern id={gridId} width="1" height="1" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="oklch(0.7 0 0 / 0.25)" strokeWidth="0.3" />
                </pattern>
            </defs>
            <rect x={viewBox[0]} y={viewBox[1]} width={previewWidth} height={previewHeight} fill={`url(#${gridId})`} />
        </svg>
    );
}

function parseViewBoxNumbers(viewBoxString: string): [number, number, number, number] {
    const parts = viewBoxString.trim().split(/[\s,]+/).map((value) => Number(value));
    if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
        return [0, 0, 1, 1];
    }
    return [parts[0], parts[1], parts[2], parts[3]];
}
