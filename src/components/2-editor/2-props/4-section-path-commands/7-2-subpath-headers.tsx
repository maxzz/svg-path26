import { type ReactNode } from "react";
import { useAtom } from "jotai";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/shadcn/accordion";
import { Switch } from "@/components/ui/shadcn/switch";
import { allSubPathsEnabledAtom, subPathEnabledAtom } from "@/store/0-atoms/2-0-svg-model";
import { ChevronDown } from "lucide-react";

export function CompoundPathToggleRow() {
    const [allEnabled, setAllEnabled] = useAtom(allSubPathsEnabledAtom);
    return (
        <div className="px-1.5 py-1 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Toggle all</span>
            <Switch
                className="scale-50"
                checked={allEnabled}
                onCheckedChange={(checked) => setAllEnabled(Boolean(checked))}
                aria-label={allEnabled ? "Mute all subpaths" : "Enable all subpaths"}
            />
        </div>
    );
}

/** Subpath header row (label, rule, mute switch) plus optional accordion body for command rows. */
export function SubPathToggleRow({ subPathIndex, children }: { subPathIndex: number; children: ReactNode; }) {
    const [enabled, setEnabled] = useAtom(subPathEnabledAtom(subPathIndex));
    const value = `subpath-${subPathIndex}`;

    return (
        <AccordionItem value={value} className="border-none">
            <div className="px-1.5 py-1 text-[10px] text-muted-foreground flex items-center justify-between [&>h3]:w-full">

                <AccordionTrigger className={triggerClasses} showIcon={false}>
                    <div className="flex min-w-0 flex-1 items-center gap-x-2">
                        <span className="shrink-0">
                            Subpath {subPathIndex + 1}
                        </span>

                        <div className="flex-1 h-px bg-linear-to-r from-slate-500/10 via-slate-500/50 to-slate-500/10" />

                        <ChevronDown className="mr-1 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </div>
                </AccordionTrigger>

                <span className="shrink min-w-5 flex items-center justify-center" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                    <Switch
                        className="scale-50"
                        checked={enabled}
                        onCheckedChange={(checked) => setEnabled(Boolean(checked))}
                        aria-label={enabled ? `Mute subpath ${subPathIndex + 1}` : `Enable subpath ${subPathIndex + 1}`}
                    />
                </span>
            </div>

            <AccordionContent className="py-0">
                {children}
            </AccordionContent>
        </AccordionItem>
    );
}

const triggerClasses = "flex-1 min-w-0 py-0 px-0 h-auto text-[10px] text-muted-foreground hover:no-underline cursor-pointer [&[data-state=open]>svg]:rotate-180";
