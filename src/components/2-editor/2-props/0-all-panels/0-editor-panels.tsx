import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Check, Copy } from "lucide-react";
import { PathOperationsPanel } from "../3-panel-operations/1-transform-panel";
import { CommandsListPanel } from "../2-panel-commands/2-0-commands-list";
import { ImagesPanel } from "../5-panel-images/3-images-panel";
import { OptionsPanel } from "../4-panel-options/0-all-options-panel";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { doHandleEditorKeyDownAtom } from "@/store/0-atoms/2-4-editor-actions";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { doApplySvgInputTextAtom, doSelectSvgInputNodeAtom, svgInputDocumentAtom, svgInputErrorAtom, svgInputSelectedNodeIdAtom } from "@/store/0-atoms/1-3-svg-input";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { SvgTreeView } from "@/components/ui/loacal-ui/2-svg-tree-view";
import { appSettings } from "@/store/0-ui-settings";
import { serializeSvgInputDocument, type SvgInputDocument } from "@/svg-core/3-svg-input";

export function EditorPanels() {
    const handleEditorKeyDown = useSetAtom(doHandleEditorKeyDownAtom);

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
                <SvgInputSection />
                <PathInputSection />
                <CommandsListPanel />
                <ImagesPanel />
                <PathOperationsPanel />
                <OptionsPanel />
            </div>

            <PathInputSectionStatus />
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

function CopySvgOverlay({ document }: { document: SvgInputDocument | null; }) {
    return (
        <CopyClipboardOverlayButton
            copyText={document ? serializeSvgInputDocument(document) : ""}
            canCopy={Boolean(document)}
            idleLabel="Copy SVG"
            successLabel="SVG copied"
        />
    );
}

function CopyClipboardOverlayButton(props: { copyText: string; canCopy: boolean; idleLabel: string; successLabel: string; }) {
    const { copyText, canCopy, idleLabel, successLabel } = props;
    const [copied, setCopied] = useState(false);
    const resetCopiedTimerRef = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (resetCopiedTimerRef.current !== null) {
                window.clearTimeout(resetCopiedTimerRef.current);
            }
        },
        []);

    async function copyValue() {
        if (!canCopy) return;
        await navigator.clipboard.writeText(copyText);

        if (resetCopiedTimerRef.current !== null) {
            window.clearTimeout(resetCopiedTimerRef.current);
        }

        setCopied(true);
        resetCopiedTimerRef.current = window.setTimeout(
            () => {
                setCopied(false);
                resetCopiedTimerRef.current = null;
            },
            500);
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={copied ? "mr-1 size-6 rounded-sm bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-300" : "mr-1 size-6 rounded-sm text-muted-foreground hover:text-foreground"}
                    disabled={!canCopy}
                    onClick={() => void copyValue()}
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label={copied ? successLabel : idleLabel}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {copied ? (
                            <motion.span
                                key="copied"
                                initial={{ opacity: 0, scale: 0.6, rotate: -18 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.6, rotate: 18 }}
                                transition={{ duration: 0.16 }}
                                className="flex items-center justify-center"
                            >
                                <Check className="size-3.5" />
                            </motion.span>
                        ) : (
                            <motion.span
                                key="copy"
                                initial={{ opacity: 0.7, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.14 }}
                                className="flex items-center justify-center"
                            >
                                <Copy className="size-3.5" />
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {copied ? successLabel : (canCopy ? idleLabel : "Nothing to copy")}
            </TooltipContent>
        </Tooltip>
    );
}

function PathInputSectionStatus() {
    const error = useAtomValue(parseErrorAtom);
    const commandCount = useAtomValue(commandCountAtom);

    return (
        <section className="rounded-lg border p-3">
            <h2 className="mb-2 text-xs font-semibold">
                Path Status
            </h2>
            {error
                ? (
                    <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        {error}
                    </p>
                ) : (
                    <p className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                        Path parsed successfully.
                    </p>
                )
            }
            <p className="mt-2 text-xs text-muted-foreground">
                Commands parsed: {commandCount}
            </p>
        </section>
    );
}
