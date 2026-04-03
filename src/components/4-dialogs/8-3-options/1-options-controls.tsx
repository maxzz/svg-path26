import { type InputHTMLAttributes } from "react";
import { useAtom, type PrimitiveAtom } from "jotai";
import { IconEyeHide, IconEyeShow } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { Switch } from "@/components/ui/shadcn/switch";
import { pathViewBoxHeightAtom, pathViewBoxWidthAtom, pathViewBoxXAtom, pathViewBoxYAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { appSettings } from "@/store/0-ui-settings";
import { classNames } from "@/utils";
import { compactInputClasses, compactLabelClasses } from "../../2-editor/2-props/8-shared-classes/0-classes";
import { ViewBoxControls } from "./2-viewbox-controls";

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

function CompactField({ valueAtom, label, className, ...rest }: { valueAtom: PrimitiveAtom<number>; label: string; } & InputHTMLAttributes<HTMLInputElement>) {
    const [value, setValue] = useAtom(valueAtom);
    return (
        <label className="relative text-xs select-none">
            <span className={compactLabelClasses}>
                {label}
            </span>
            <input
                className={classNames(compactInputClasses, className)}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                type="number"
                {...rest}
            />
        </label>
    );
}
