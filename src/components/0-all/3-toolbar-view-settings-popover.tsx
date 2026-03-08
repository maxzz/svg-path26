import { type InputHTMLAttributes } from "react";
import { useAtom, type PrimitiveAtom } from "jotai";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { strokeWidthAtom, zoomAtom } from "@/store/0-atoms/2-svg-path-state";

export function ToolbarViewSettingsPopover() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="size-7" title="View options">
                    <Settings className="size-4" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80 p-3">
                <div className="-mx-3 mb-3 border-b pb-2">
                    <h4 className="px-3 text-xs font-semibold leading-none">
                        View options
                    </h4>
                </div>

                <div className="grid gap-3">
                    <SettingsRangeField
                        label="Stroke"
                        valueAtom={strokeWidthAtom}
                        min={1}
                        max={12}
                        step={1}
                        valueClassName="w-8"
                    />
                    <SettingsRangeField
                        label="Zoom"
                        valueAtom={zoomAtom}
                        min={0.5}
                        max={4}
                        step={0.1}
                        valueClassName="w-12"
                        formatValue={(value) => `${value.toFixed(1)}x`}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

function SettingsRangeField({
    valueAtom,
    label,
    valueClassName,
    formatValue,
    ...inputProps
}: {
    valueAtom: PrimitiveAtom<number>;
    label: string;
    valueClassName: string;
    formatValue?: (value: number) => string | number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange">) {
    const [value, setValue] = useAtom(valueAtom);
    const displayValue = formatValue ? formatValue(value) : value;

    return (
        <label className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0">{label}</span>
            <input
                type="range"
                {...inputProps}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
            />
            <span className={`${valueClassName} text-right tabular-nums`}>{displayValue}</span>
        </label>
    );
}
