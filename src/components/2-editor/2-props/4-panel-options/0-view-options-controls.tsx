import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Slider } from "@/components/ui/shadcn/slider";
import { Switch } from "@/components/ui/shadcn/switch";
import { strokeWidthAtom } from "@/store/0-atoms/2-4-editor-actions";
import { doZoomViewPortAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { appSettings } from "@/store/0-ui-settings";

export function StrokeInput() {
    const [value, setValue] = useAtom(strokeWidthAtom);
    return (
        <LabeledSliderRow
            label="Stroke"
            value={value}
            displayValue={formatCompactNumber(value)}
            min={0.1}
            max={12}
            step={0.1}
            onValueChange={setValue}
        />
    );
}

export function ZoomInput() {
    const { zoom } = useSnapshot(appSettings.pathEditor);
    const zoomViewPort = useSetAtom(doZoomViewPortAtom);
    return (
        <LabeledSliderRow
            label="Zoom"
            value={zoom}
            displayValue={`${zoom.toFixed(1)}x`}
            min={0.25}
            max={16}
            step={0.1}
            onValueChange={(nextZoom) => {
                if (nextZoom <= 0 || nextZoom === zoom) return;
                zoomViewPort({ scale: zoom / nextZoom });
            }}
        />
    );
}

function LabeledSliderRow({
    label,
    value,
    displayValue,
    min,
    max,
    step,
    onValueChange,
}: {
    label: string;
    value: number;
    displayValue: string;
    min: number;
    max: number;
    step: number;
    onValueChange: (nextValue: number) => void;
}) {
    return (
        <label className="text-xs flex items-center gap-1">
            <span className="shrink-0 w-12">
                {label}
            </span>
            <Slider
                className="flex-1"
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={([nextValue]) => {
                    if (!Number.isFinite(nextValue)) return;
                    onValueChange(nextValue);
                }}
            />
            <span className="w-8 text-right tabular-nums">
                {displayValue}
            </span>
        </label>
    );
}

export function ToggleValueRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void; }) {
    return (
        <label className="text-xs flex items-center gap-2">
            <Switch checked={value} onCheckedChange={(checked) => onChange(Boolean(checked))} />
            <span>{label}</span>
        </label>
    );
}

function formatCompactNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
