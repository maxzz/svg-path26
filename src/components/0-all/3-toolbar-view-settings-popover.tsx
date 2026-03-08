import { useAtom } from "jotai";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { strokeWidthAtom, zoomAtom } from "@/store/0-atoms/2-svg-path-state";

export function ToolbarViewSettingsPopover() {
    const [strokeWidth, setStrokeWidth] = useAtom(strokeWidthAtom);
    const [zoom, setZoom] = useAtom(zoomAtom);

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
                        min={1}
                        max={12}
                        step={1}
                        value={strokeWidth}
                        valueClassName="w-8"
                        displayValue={strokeWidth}
                        onChange={setStrokeWidth}
                    />
                    <SettingsRangeField
                        label="Zoom"
                        min={0.5}
                        max={4}
                        step={0.1}
                        value={zoom}
                        valueClassName="w-12"
                        displayValue={`${zoom.toFixed(1)}x`}
                        onChange={setZoom}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

function SettingsRangeField({
    label,
    min,
    max,
    step,
    value,
    displayValue,
    valueClassName,
    onChange,
}: {
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    displayValue: string | number;
    valueClassName: string;
    onChange: (value: number) => void;
}) {
    return (
        <label className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0">{label}</span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
            <span className={`${valueClassName} text-right tabular-nums`}>{displayValue}</span>
        </label>
    );
}
