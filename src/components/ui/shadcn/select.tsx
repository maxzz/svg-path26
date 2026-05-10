import { type ComponentProps } from "react"; // 05.09.26
import { cn } from "@/utils/classnames";
import { Select as SelectPrimitive } from "radix-ui";
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react";

export function Select({ ...rest }: ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root data-slot="select" {...rest} />;
}

export function SelectGroup({ className, ...rest }: ComponentProps<typeof SelectPrimitive.Group>) {
    return (
        <SelectPrimitive.Group
            data-slot="select-group"
            className={cn("scroll-my-1 p-1", className)}
            {...rest}
        />
    );
}

export function SelectValue({ ...rest }: ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value data-slot="select-value" {...rest} />;
}

const selectTriggerClasses = "\
pl-2.5 pr-2 py-2 w-fit \
text-xs \
whitespace-nowrap \
\
bg-transparent \
transition-colors \
\
dark:bg-input/30 \
dark:hover:bg-input/50 \
dark:aria-invalid:border-destructive/50 \
dark:aria-invalid:ring-destructive/40 \
\
focus-visible:border-ring \
focus-visible:ring-3 \
focus-visible:ring-ring/50 \
\
disabled:cursor-not-allowed \
disabled:opacity-50 \
\
aria-invalid:border-destructive \
aria-invalid:ring-3 \
aria-invalid:ring-destructive/20 \
\
data-placeholder:text-muted-foreground \
\
data-[size=default]:h-8 \
data-[size=sm]:h-7 \
data-[size=sm]:rounded-[min(var(--radius-md),10px)] \
\
*:data-[slot=select-value]:line-clamp-1 \
*:data-[slot=select-value]:flex \
*:data-[slot=select-value]:items-center \
*:data-[slot=select-value]:gap-1.5 \
\
[&_svg]:pointer-events-none \
[&_svg]:shrink-0 \
[&_svg:not([class*='size-'])]:size-4 \
\
border \
border-input \
outline-none select-none \
rounded-lg \
flex items-center justify-between gap-1.5";

export function SelectTrigger({ className, size = "default", children, ...rest }: ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default"; }) {
    return (
        <SelectPrimitive.Trigger data-slot="select-trigger" data-size={size} className={cn(selectTriggerClasses, className)} {...rest}>
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

type SelectContentProps = ComponentProps<typeof SelectPrimitive.Content> & {
    buttonClasses?: string; // up/down button classes
};

const selectContentClasses = "\
relative \
min-w-36 \
max-h-(--radix-select-content-available-height) \
origin-(--radix-select-content-transform-origin) \
\
text-popover-foreground \
bg-popover \
ring-1 \
ring-foreground/10 \
duration-100 \
\
data-[align-trigger=true]:animate-none \
data-[side=bottom]:slide-in-from-top-2 \
data-[side=left]:slide-in-from-right-2 \
data-[side=right]:slide-in-from-left-2 \
data-[side=top]:slide-in-from-bottom-2 \
\
data-open:animate-in \
data-open:fade-in-0 \
data-open:zoom-in-95 \
\
data-closed:animate-out \
data-closed:fade-out-0 \
data-closed:zoom-out-95 \
\
rounded-lg \
shadow-md \
\
overflow-x-hidden \
overflow-y-auto \
\
z-50 \
";

export function SelectContent({ className, children, position = "item-aligned", align = "center", buttonClasses, ...rest }: SelectContentProps) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                data-align-trigger={position === "item-aligned"}
                className={cn(selectContentClasses, position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className)}
                position={position}
                align={align}
                {...rest}
            >
                <SelectScrollUpButton className={buttonClasses} />

                <SelectPrimitive.Viewport
                    data-position={position}
                    className={cn("data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)", position === "popper" && "")}
                >
                    {children}
                </SelectPrimitive.Viewport>

                <SelectScrollDownButton className={buttonClasses} />

            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

export function SelectLabel({ className, ...rest }: ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label data-slot="select-label" className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)} {...rest} />
    );
}

const selectItemClasses = "\
relative pr-8 pl-1.5 py-1 w-full text-xs \
\
focus:bg-accent \
focus:text-accent-foreground \
\
not-data-[variant=destructive]:focus:**:text-accent-foreground \
\
data-disabled:pointer-events-none \
data-disabled:opacity-50 \
\
[&_svg]:pointer-events-none \
[&_svg]:shrink-0 \
[&_svg:not([class*='size-'])]:size-4 \
\
*:[span]:last:flex \
*:[span]:last:items-center \
*:[span]:last:gap-2 \
\
rounded-md \
outline-hidden select-none \
cursor-default \
flex items-center gap-1.5";

const selectItemLeftClasses = "pl-8 pr-2";
const selectItemRightClasses = "pl-2 pr-8";

const selectIndiLeftClasses = "left-2";
const selectIndiRightClasses = "right-2";

type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item> & {
    indicatorFirst?: boolean;
};

export function SelectItem({ className, children, indicatorFirst, ...rest }: SelectItemProps) {
    const itemClasses = indicatorFirst ? selectItemLeftClasses : selectItemRightClasses;
    const indiClasses = indicatorFirst ? selectIndiLeftClasses : selectIndiRightClasses;
    return (
        <SelectPrimitive.Item data-slot="select-item" className={cn(selectItemClasses, itemClasses, className)} {...rest}>

            <span className={cn("pointer-events-none absolute right-2 flex size-4 items-center justify-center", indiClasses)}>
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="pointer-events-none" />
                </SelectPrimitive.ItemIndicator>
            </span>

            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

export function SelectSeparator({ className, ...rest }: ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
            {...rest}
        />
    );
}

export function SelectScrollUpButton({ className, ...rest }: ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton
            data-slot="select-scroll-up-button"
            className={cn("z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className)}
            {...rest}
        >
            <ChevronUpIcon />
        </SelectPrimitive.ScrollUpButton>
    );
}

export function SelectScrollDownButton({ className, ...rest }: ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton
            data-slot="select-scroll-down-button"
            className={cn("z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className)}
            {...rest}
        >
            <ChevronDownIcon />
        </SelectPrimitive.ScrollDownButton>
    );
}
