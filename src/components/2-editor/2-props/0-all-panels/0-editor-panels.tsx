import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { PathOperationsPanel } from "../3-panel-operations/1-transform-panel";
import { CommandsListPanel } from "../2-panel-commands/2-0-commands-list";
import { ImagesPanel } from "../5-panel-images/3-images-panel";
import { OptionsPanel } from "../4-panel-options/0-all-options-panel";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { CopyClipboardOverlayButton } from "../../../ui/loacal-ui/4-copy-clipboard-overlay-button";
import { doHandleEditorKeyDownAtom } from "@/store/0-atoms/2-4-0-editor-actions";
import { doApplySvgInputTextAtom, doSelectSvgInputNodeAtom, svgInputDocumentAtom, svgInputErrorAtom, svgInputSelectedNodeIdAtom } from "@/store/0-atoms/1-3-svg-input";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { SvgTreeView } from "@/components/ui/loacal-ui/2-svg-tree-view";
import { appSettings } from "@/store/0-ui-settings";
import { CopySvgOverlay, SvgPreviewSection } from "./1-editor-panels-sections";

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
                {showSvgPreviewSection && <SvgPreviewSection />}
                <SvgInputSection />
                <PathInputSection />
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

function PathInputSection() {
    const [pathValue, setPathValue] = useAtom(svgPathInputAtom);
    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel sectionKey="path-input" label="Path Input" contentClassName="px-px py-0.5" overlay={<CopyPathOverlay pathValue={pathValue} />}>
                <textarea
                    id="svg-path-input"
                    className="pl-4 py-1 w-full min-h-8 field-sizing-content font-mono tracking-tight text-xs bg-background outline-ring/50 focus:-outline shadow-inner resize-y"
                    value={pathValue}
                    onChange={(event) => setPathValue(event.target.value)}
                    placeholder="M 10 10 L 100 100"
                />
            </SectionPanel>
        </TooltipProvider>
    );
}

function CopyPathOverlay({ pathValue }: { pathValue: string; }) {
    const hasPath = pathValue.trim().length > 0;

    return (
        <CopyClipboardOverlayButton
            copyText={pathValue}
            canCopy={hasPath}
            idleLabel="Copy path"
            successLabel="Path copied"
        />
    );
}
