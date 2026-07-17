import * as React from "react"; // 03.15.26; 05.09.26;
import { cn } from "@/utils";
import { ChevronDown } from "lucide-react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...rest }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
    return (
        <AccordionPrimitive.Item className={cn("border-b", className)} {...rest} />
    );
}

export function AccordionTrigger({ className, children, showIcon = true, ...rest }: React.ComponentProps<typeof AccordionPrimitive.Trigger> & { showIcon?: boolean; }) {
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                className={cn("flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180 cursor-pointer", className)}
                {...rest}
            >
                {children}
                {showIcon && (
                    <ChevronDown className="mr-1 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200" />
                )}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

export function AccordionContent({ className, children, ...rest }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content
            className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
            {...rest}
        >
            <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </AccordionPrimitive.Content>
    );
}
