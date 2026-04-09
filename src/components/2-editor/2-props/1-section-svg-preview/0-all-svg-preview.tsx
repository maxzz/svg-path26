import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { appSettings } from "@/store/0-ui-settings";
import { svgInputDocumentAtom, svgInputErrorAtom, svgInputSelectedNodeAtom } from "@/store/0-atoms/1-3-svg-input";
import { serializeSvgInputDocument } from "@/svg-core/3-svg-input";

export function Section_SvgPreview() {
    const document = useAtomValue(svgInputDocumentAtom);
    const selectedNode = useAtomValue(svgInputSelectedNodeAtom);
    const parseError = useAtomValue(svgInputErrorAtom);
    const { viewBox } = useSnapshot(appSettings.pathEditor);

    const fallbackViewBoxString = viewBox.join(" ");
    const inputRootViewBoxString = document?.root.tagName === "svg"
        ? document.root.attributes.find((attribute) => attribute.name.toLowerCase() === "viewbox")?.value?.trim() ?? null
        : null;

    const viewBoxString = inputRootViewBoxString ?? fallbackViewBoxString;
    const previewMarkup = selectedNode ? serializeSvgInputDocument({ root: selectedNode, sourceKind: "svg-fragment" }) : "";

    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="svg-preview" label="SVG preview" contentClassName="px-1 py-1">
                {parseError ? (
                    <div className="border-t border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                        {parseError}
                    </div>
                ) : selectedNode ? (
                    selectedNode.tagName === "svg" ? (
                        <div className="h-40 w-full overflow-hidden rounded bg-muted/20 p-1 [&svg]:block [&svg]:h-full [&svg]:w-full"
                            dangerouslySetInnerHTML={{ __html: previewMarkup }}
                        />
                    ) : (
                        <svg
                            className="h-40 w-full rounded bg-muted/20"
                            viewBox={viewBoxString}
                            xmlns="http://www.w3.org/2000/svg"
                            pointerEvents="none"
                            dangerouslySetInnerHTML={{ __html: previewMarkup }}
                        />
                    )
                ) : (
                    <div className="px-3 py-3 text-[11px] leading-5 text-muted-foreground">
                        Paste SVG markup, a &lt;path&gt; element, or path data here to preview.
                    </div>
                )}
            </SectionPanel>
        </TooltipProvider>
    );
}
