import { useAtomValue, useSetAtom } from "jotai";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { Button } from "@/components/ui/shadcn/button";
import { IconHomeToCloud } from "@/components/ui/icons/app-specific";
import { CopyClipboardOverlayButton } from "../../../ui/local-ui/5-section-overlay-buttons/4-1-copy-clipboard";
import { OverlayButton_MinifyPath } from "../../../ui/local-ui/5-section-overlay-buttons/4-2-minify-path";
import { overlayButtonClasses } from "../8-shared-classes/0-classes";
import { svgInputDocumentAtom } from "@/store/0-atoms/1-3-svg-input";
import { doSyncSvgInputBoundPathAtom } from "@/store/0-atoms/1-3-svg-input-state";

export function PathInput_Overlay({ pathValue }: { pathValue: string; }) {
    const trimmedPathValue = pathValue.trim();
    return (
        <div className="mr-1 pl-2 flex items-center gap-0.5">

            <BtnHomeToCloud trimmedPathValue={trimmedPathValue} />

            <OverlayButton_MinifyPath />

            <CopyClipboardOverlayButton
                copyText={pathValue}
                canCopy={!!trimmedPathValue.length}
                idleLabel="Copy path"
                successLabel="Path copied"
            />
        </div>
    );
}

function BtnHomeToCloud({ trimmedPathValue }: { trimmedPathValue: string; }) {
    const doSyncSvgInputBoundPath = useSetAtom(doSyncSvgInputBoundPathAtom);
    const svgInputDocument = useAtomValue(svgInputDocumentAtom);
    const canSendToSvgInput = !!trimmedPathValue.length && !svgInputDocument; // Has path and no SVG input set

    const label =
        !trimmedPathValue.length
            ? "Nothing to send"
            : svgInputDocument
                ? "SVG input already set"
                : "Send path to SVG input";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={overlayButtonClasses}
                    variant="ghost"
                    size="icon"
                    disabled={!canSendToSvgInput}
                    onClick={() => {
                        if (!canSendToSvgInput) return;
                        doSyncSvgInputBoundPath(trimmedPathValue);
                    }}
                    aria-label={label}
                    title={label}
                    type="button"
                >
                    <IconHomeToCloud className="size-4" />
                </Button>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
