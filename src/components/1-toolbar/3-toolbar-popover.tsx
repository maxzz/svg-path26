import { type InputHTMLAttributes } from "react";
import { useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Settings as IconSettings } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { Switch } from "@/components/ui/shadcn/switch";
import { strokeWidthAtom } from "@/store/0-atoms/2-2-editor-actions";
import { doZoomViewPortAtom } from "@/store/0-atoms/2-1-canvas-viewport";
import { appSettings } from "@/store/0-ui-settings";

export function SettingsPopover() {
    const { canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="size-7" title="View options">
                    <IconSettings className="size-4 stroke-1" />
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
                        min={0.1}
                        max={12}
                        step={0.1}
                        valueClassName="w-10"
                        formatValue={formatCompactNumber}
                    />

                    <ZoomSettingsField />

                    <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                        <ToggleValueRow
                            label="Show viewBox frame"
                            value={showViewBoxFrame}
                            onChange={(nextValue) => { appSettings.canvas.showViewBoxFrame = nextValue; }}
                        />
                        <ToggleValueRow
                            label="Preview mode"
                            value={canvasPreview}
                            onChange={(nextValue) => { appSettings.canvas.canvasPreview = nextValue; }}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function SettingsRangeField({ valueAtom, label, valueClassName, formatValue, ...inputProps }: { valueAtom: PrimitiveAtom<number>; label: string; valueClassName: string; formatValue?: (value: number) => string | number; } & InputHTMLAttributes<HTMLInputElement>) {
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

function ZoomSettingsField() {
    const { zoom } = useSnapshot(appSettings.pathEditor);
    const zoomViewPort = useSetAtom(doZoomViewPortAtom);

    return (
        <label className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0">Zoom</span>
            <input
                type="range"
                min={0.25}
                max={16}
                step={0.1}
                value={zoom}
                onChange={(event) => {
                    const nextZoom = Number(event.target.value);
                    if (!Number.isFinite(nextZoom) || nextZoom <= 0 || nextZoom === zoom) return;
                    zoomViewPort({ scale: zoom / nextZoom });
                }}
            />
            <span className="w-12 text-right tabular-nums">{zoom.toFixed(1)}x</span>
        </label>
    );
}

function ToggleRow({ label, atom }: { label: string; atom: PrimitiveAtom<boolean>; }) {
    const [value, setValue] = useAtom(atom);
    return (
        <label className="flex items-center justify-between gap-2 text-xs">
            <span>{label}</span>
            <Switch checked={value} onCheckedChange={(checked) => setValue(Boolean(checked))} />
        </label>
    );
}

function ToggleValueRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void; }) {
    return (
        <label className="flex items-center justify-between gap-2 text-xs">
            <span>{label}</span>
            <Switch checked={value} onCheckedChange={(checked) => onChange(Boolean(checked))} />
        </label>
    );
}

function formatCompactNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
