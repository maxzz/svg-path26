import { type InputHTMLAttributes } from "react";
import { classNames } from "@/utils";
import { Switch } from "@/components/ui/shadcn/switch";

export function NumberRow({ label, value, onValueChange, ...rest }: { label: string; value: number; onValueChange: (value: number) => void; } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="text-xs flex items-center justify-self-end whitespace-nowrap gap-1.5 select-none">
            <span>{label}</span>
            <input
                type="number"
                className="h-6 w-12 rounded border bg-background px-2 text-[11px]"
                value={value}
                onChange={(event) => onValueChange(Number(event.target.value))}
                {...rest}
            />
        </label>
    );
}

export function CheckboxRow({ label, checked, onCheckedChange, className, }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; className?: string; }) {
    return (
        <label className={classNames("text-xs flex items-center gap-0.5 select-none", className)}>
            <Switch className="scale-75" checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
            <span>
                {label}
            </span>
        </label>
    );
}
