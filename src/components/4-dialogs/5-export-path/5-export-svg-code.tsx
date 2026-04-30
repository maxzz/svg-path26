import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Check, Copy } from "lucide-react";
import { useSnapshot } from "valtio";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/shadcn/accordion";
import { Button } from "@/components/ui/shadcn/button";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { appSettings } from "@/store/0-ui-settings";
import { doCopyDisplayedExportSvgCodeAtom, exportSvgCodeAccordionValueAtom, exportSvgCodeCopiedAtom, optimizedExportSvgCodeAtom, optimizedExportSvgErrorAtom, rawExportSvgCodeAtom } from "./8-dialog-export-atoms";

export function ExportSvgCodeAccordion() {
    const { enabled } = useSnapshot(appSettings.export.svgo);
    const [accordionValue, setAccordionValue] = useAtom(exportSvgCodeAccordionValueAtom);
    const rawSvgCode = useAtomValue(rawExportSvgCodeAtom);
    const optimizedSvgCode = useAtomValue(optimizedExportSvgCodeAtom);
    const optimizedError = useAtomValue(optimizedExportSvgErrorAtom);
    const copied = useAtomValue(exportSvgCodeCopiedAtom);
    const copySvgCode = useSetAtom(doCopyDisplayedExportSvgCodeAtom);

    const displayedSvgCode = enabled ? optimizedSvgCode : rawSvgCode;
    const codeLabel = enabled ? "Optimized SVG code" : "Raw SVG code";
    const canCopy = displayedSvgCode.trim().length > 0;

    return (
        <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue}>
            <AccordionItem value="svg-code" className="border rounded px-2">
                <AccordionTrigger className="py-1.5 text-xs hover:no-underline">
                    <span className="flex items-center gap-2">
                        <span>SVG code</span>
                        <span className="text-[10px] text-muted-foreground">
                            {displayedSvgCode.length} chars
                        </span>
                    </span>
                </AccordionTrigger>

                <AccordionContent className="pb-2 text-xs">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{codeLabel}</span>
                        <Button
                            variant="outline"
                            size="xs"
                            type="button"
                            className="h-6 px-2 gap-1"
                            disabled={!canCopy}
                            onClick={() => void copySvgCode()}
                        >
                            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>

                    {enabled && optimizedError && (
                        <p className="mb-1.5 text-[11px] text-destructive">
                            SVGO failed: {optimizedError}
                        </p>
                    )}

                    <Textarea
                        className="h-32 min-h-0 resize-none font-mono text-[11px] leading-4"
                        readOnly
                        spellCheck={false}
                        value={displayedSvgCode}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
