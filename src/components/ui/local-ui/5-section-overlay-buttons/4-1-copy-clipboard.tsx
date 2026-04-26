import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/utils";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";

export function CopyClipboardOverlayButton(props: { copyText: string; canCopy: boolean; idleLabel: string; successLabel: string; className?: string; btnClasses?: string; }) {
    const { copyText, canCopy, idleLabel, successLabel, className, btnClasses } = props;

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
                    className={cn(
                        "size-5 rounded",
                        copied
                            ? " bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-300"
                            : " text-muted-foreground hover:text-foreground",
                        className)
                    }
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
                                <Check className={cn("size-4", btnClasses)} />
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
                                <Copy className={cn("size-4 stroke-[1.5px]", btnClasses)} />
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
