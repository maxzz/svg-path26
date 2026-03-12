import { type InputHTMLAttributes } from "react";
import { useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Settings as IconSettings } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { Switch } from "@/components/ui/shadcn/switch";
import {
    strokeWidthAtom,
} from "@/store/0-atoms/2-2-editor-actions";
import {
    doFitViewBoxAtom,
    doZoomViewBoxAtom,
    viewPortHeightAtom,
    viewPortWidthAtom,
    viewPortXAtom,
    viewPortYAtom,
} from "@/store/0-atoms/2-1-canvas-viewbox";
import { isImageEditModeAtom } from "@/store/0-atoms/2-4-images";
import { appSettings } from "@/store/0-ui-settings";

export function SettingsPopover() {
    const settings = useSnapshot(appSettings);
    const fitViewBox = useSetAtom(doFitViewBoxAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);

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

                    <div className="grid grid-cols-4 gap-2 rounded-md border p-2">
                        <SettingsNumberField label="x" valueAtom={viewPortXAtom} />
                        <SettingsNumberField label="y" valueAtom={viewPortYAtom} />
                        <SettingsNumberField label="w" valueAtom={viewPortWidthAtom} min={1e-3} />
                        <SettingsNumberField label="h" valueAtom={viewPortHeightAtom} min={1e-3} />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span>Lock viewBox</span>
                        <Switch
                            checked={settings.pathEditor.viewPortLocked}
                            onCheckedChange={(checked) => {
                                appSettings.pathEditor.viewPortLocked = Boolean(checked);
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                        <Button variant="outline" className="h-7 px-2" onClick={() => zoomViewBox({ scale: 9 / 10 })}>
                            Zoom In
                        </Button>
                        <Button variant="outline" className="h-7 px-2" onClick={() => fitViewBox()}>
                            Fit
                        </Button>
                        <Button variant="outline" className="h-7 px-2" onClick={() => zoomViewBox({ scale: 10 / 9 })}>
                            Zoom Out
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                        <ToggleValueRow
                            label="Snap to grid"
                            value={settings.pathEditor.snapToGrid}
                            onChange={(nextValue) => {
                                appSettings.pathEditor.snapToGrid = nextValue;
                            }}
                        />
                        <ToggleValueRow
                            label="Show ticks"
                            value={settings.pathEditor.showTicks}
                            onChange={(nextValue) => {
                                appSettings.pathEditor.showTicks = nextValue;
                            }}
                        />
                        <ToggleValueRow
                            label="Fill path"
                            value={settings.pathEditor.fillPreview}
                            onChange={(nextValue) => {
                                appSettings.pathEditor.fillPreview = nextValue;
                            }}
                        />
                        <ToggleValueRow
                            label="Preview mode"
                            value={settings.pathEditor.canvasPreview}
                            onChange={(nextValue) => {
                                appSettings.pathEditor.canvasPreview = nextValue;
                            }}
                        />
                        <ToggleRow label="Image edit mode" atom={isImageEditModeAtom} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <SettingsValueNumberField
                            label="Tick interval"
                            value={settings.pathEditor.tickInterval}
                            min={1}
                            step={1}
                            onValueChange={(nextValue) => {
                                appSettings.pathEditor.tickInterval = nextValue;
                            }}
                        />
                        <SettingsValueNumberField
                            label="Point precision"
                            value={settings.pathEditor.pointPrecision}
                            min={0}
                            max={8}
                            step={1}
                            onValueChange={(nextValue) => {
                                appSettings.pathEditor.pointPrecision = nextValue;
                            }}
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
    const settings = useSnapshot(appSettings);
    const zoom = settings.pathEditor.zoom;
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);

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
                    zoomViewBox({ scale: zoom / nextZoom });
                }}
            />
            <span className="w-12 text-right tabular-nums">{zoom.toFixed(1)}x</span>
        </label>
    );
}

function SettingsNumberField({ valueAtom, label, ...rest }: { valueAtom: PrimitiveAtom<number>; label: string; } & InputHTMLAttributes<HTMLInputElement>) {
    const [value, setValue] = useAtom(valueAtom);
    return (
        <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <input
                type="number"
                className="h-7 w-full rounded border bg-background px-2 text-xs"
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                {...rest}
            />
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

function SettingsValueNumberField({ label, value, onValueChange, ...rest }: { label: string; value: number; onValueChange: (value: number) => void; } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <input
                type="number"
                className="h-7 w-full rounded border bg-background px-2 text-xs"
                value={value}
                onChange={(event) => onValueChange(Number(event.target.value))}
                {...rest}
            />
        </label>
    );
}

function formatCompactNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
