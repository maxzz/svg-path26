import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { CopyClipboardOverlayButton } from "../../../ui/loacal-ui/4-copy-clipboard-overlay-button";
import { doApplySvgInputTextAtom, doSelectSvgInputNodeAtom, svgInputDocumentAtom, svgInputErrorAtom, svgInputSelectedNodeIdAtom } from "@/store/0-atoms/1-3-svg-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { SvgTreeView } from "@/components/ui/loacal-ui/2-svg-tree-view";
import { appSettings } from "@/store/0-ui-settings";
import { serializeSvgInputDocument, type SvgInputDocument } from "@/svg-core/3-svg-input";

export function Section_SvgInput() {
    const document = useAtomValue(svgInputDocumentAtom);
    const selectedNodeId = useAtomValue(svgInputSelectedNodeIdAtom);
    const parseError = useAtomValue(svgInputErrorAtom);
    const applySvgInputText = useSetAtom(doApplySvgInputTextAtom);
    const selectSvgNode = useSetAtom(doSelectSvgInputNodeAtom);
    const { showSvgTreeConnectorLines } = useSnapshot(appSettings.pathEditor);

    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="svg-input" label="SVG Input" contentClassName="px-1 py-1" overlay={<CopySvgOverlay document={document} />}>
                <SvgTreeView
                    root={document?.root ?? null}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={selectSvgNode}
                    onPasteText={applySvgInputText}
                    showConnectorLines={showSvgTreeConnectorLines}
                    parseError={parseError}
                    className="max-h-72 min-h-24"
                />
            </SectionPanel>
        </TooltipProvider>
    );
}

export function CopySvgOverlay({ document }: { document: SvgInputDocument | null; }) {
    return (
        <CopyClipboardOverlayButton
            copyText={document ? serializeSvgInputDocument(document) : ""}
            canCopy={Boolean(document)}
            idleLabel="Copy SVG"
            successLabel="SVG copied"
        />
    );
}
