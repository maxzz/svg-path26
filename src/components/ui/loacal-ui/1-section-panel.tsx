import { type ReactNode } from "react";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/shadcn/accordion";
import { appSettings } from "@/store/0-ui-settings";

interface SectionPanelProps {
    sectionKey: string;
    label: string;
    children: ReactNode;
    triggerClassName?: string;
    contentClassName?: string;
}

export function SectionPanel({ sectionKey, label, children, triggerClassName, contentClassName }: SectionPanelProps) {
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
                <AccordionTrigger className={classNames("px-3 py-1.5 text-sm font-semibold font-ui bg-muted border-b hover:no-underline", triggerClassName)}>
                    {label}
                </AccordionTrigger>
                <AccordionContent className={classNames("px-3 py-0", contentClassName)}>
                    {children}
                </AccordionContent>
            </AccordionItem>
        </Accordion>

    );
}
