import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { PathOperationsPanel } from "../5-section-operations/0-all-operations";
import { CommandsListPanel } from "../4-section-path-commands/0-all-path-commands";
import { ImagesPanel } from "../7-section-images/0-all-images";
import { OptionsPanel } from "../6-section-options/0-all-options";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { doHandleEditorKeyDownAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { doApplySvgInputTextAtom, doSelectSvgInputNodeAtom, svgInputDocumentAtom, svgInputErrorAtom, svgInputSelectedNodeIdAtom } from "@/store/0-atoms/1-3-svg-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { SvgTreeView } from "@/components/ui/loacal-ui/2-svg-tree-view";
import { Section_SvgPreview } from "../1-section-svg-preview/0-all-svg-preview";
import { Section_PathInput } from "../3-section-input-path/0-all-input-path";
import { CopySvgOverlay } from "../2-section-input-svg/0-all-input-svg";

export function EditorPanels() {
    const handleEditorKeyDown = useSetAtom(doHandleEditorKeyDownAtom);
    const { showSvgPreviewSection } = useSnapshot(appSettings);

    useEffect(
        () => {
            const onKeyDown = (event: KeyboardEvent) => handleEditorKeyDown(event);

            const controller = new AbortController();
            window.addEventListener("keydown", onKeyDown, { signal: controller.signal });
            return () => controller.abort();
        },
        [handleEditorKeyDown]);

    return (
        <aside className="h-full border-r flex flex-col justify-between">
            <div className="grow flex-1 overflow-auto [scrollbar-gutter:stable]">
                {showSvgPreviewSection && <Section_SvgPreview />}
                <SvgInputSection />
                <Section_PathInput />
                <CommandsListPanel />
                <ImagesPanel />
                <PathOperationsPanel />
            </div>

            <OptionsPanel />
        </aside>
    );
}

function SvgInputSection() {
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
