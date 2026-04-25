import { type ReactNode } from "react";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTriggerNonButton } from "@/components/ui/shadcn/accordion";
import { appSettings } from "@/store/0-ui-settings";

interface SectionPanelProps {
    sectionKey: string;
    label: ReactNode;
    children: ReactNode;
    triggerClassName?: string;
    contentClassName?: string;
    overlay?: ReactNode;
}

export function SectionPanel({ sectionKey, label, children, triggerClassName, contentClassName, overlay }: SectionPanelProps) {
    const { sections } = useSnapshot(appSettings);
    const open = sections[sectionKey] ?? false;

    return (
        <Accordion
            type="single"
            collapsible
            value={open ? sectionKey : ""}
            onValueChange={(value) => {
                appSettings.sections[sectionKey] = value === sectionKey;
            }}
        >
            <AccordionItem value={sectionKey} className="border-none">
                    <AccordionTriggerNonButton className={classNames("mr-1 px-3 py-1.5 text-base font-ui bg-foreground/7 border-b hover:no-underline select-none", triggerClassName)}>
                        {label}

                        {overlay && (<>
                             {/* <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none z-10">
                                 <div className="pointer-events-auto flex items-center gap-1"> */}
                                 <div className="flex-1 flex items-center justify-end gap-1">
                                    {overlay}
                                 </div>
                                 {/* </div>
                             </div> */}
                            </>)}
                    </AccordionTriggerNonButton>

                <AccordionContent className={classNames("px-3 py-0", contentClassName)}>
                    {children}
                </AccordionContent>
            </AccordionItem>
        </Accordion>

    );
}
