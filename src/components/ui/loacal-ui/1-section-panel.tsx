import { type ReactNode } from "react";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/shadcn/accordion";

interface SectionPanelProps {
    sectionKey: string;
    label: string;
    children: ReactNode;
}

export function SectionPanel({ sectionKey, label, children }: SectionPanelProps) {
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
                <AccordionTrigger className="px-2 py-1.5 text-sm font-semibold font-ui bg-muted border-b hover:no-underline">
                    {label}
                </AccordionTrigger>
                <AccordionContent className="py-0">
                    {children}
                </AccordionContent>
            </AccordionItem>
        </Accordion>

    );
}
