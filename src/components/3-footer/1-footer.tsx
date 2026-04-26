import { useAtomValue } from "jotai";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";
import { FooterButtonsRow } from "@/components/3-footer/2-buttons-toolbar";

export function Footer() {
    return (
        <footer className="px-4 pt-1 pb-1.5 pr-2 text-xs text-muted-foreground border-t flex items-center justify-between">
            <PathStateInfo />
            <FooterButtonsRow />
        </footer>
    );
}

function PathStateInfo() {
    const commandCount = useAtomValue(commandCountAtom);
    const error = useAtomValue(parseErrorAtom);
    return (
        <div className="min-w-0 text-[10px] flex items-center gap-2 whitespace-nowrap">
            <span className="shrink-0">
                Commands parsed: {commandCount}
            </span>

            {error
                ? (
                    <span className="px-2 py-1 max-w-55 text-xs text-destructive bg-destructive/10 truncate rounded">
                        {error}
                    </span>
                ) : (
                    <span className="px-2 py-1 max-w-55 text-emerald-700 dark:text-emerald-300 truncate rounded">
                        Path parsed successfully.
                    </span>
                )
            }
        </div>
    );
}
