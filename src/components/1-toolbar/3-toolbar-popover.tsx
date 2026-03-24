import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Settings as IconSettings } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { Slider } from "@/components/ui/shadcn/slider";
import { Switch } from "@/components/ui/shadcn/switch";
import { strokeWidthAtom } from "@/store/0-atoms/2-2-editor-actions";
import { doZoomViewPortAtom } from "@/store/0-atoms/2-1-canvas-viewport";
import { appSettings } from "@/store/0-ui-settings";

export function SettingsPopover() {
    const { canvasPreview, showViewBoxFrame } = useSnapshot(appSettings.canvas);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className="size-7" variant="outline" size="icon" title="View options">
                    <IconSettings className="size-4 stroke-1" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-3 pt-0 max-w-80  overflow-hidden" align="end">
                <div className="-mx-3 mb-3 pt-3 pb-2 border-b bg-foreground/10">
                    <h4 className="px-3 text-xs font-semibold leading-none">
                        View options
                    </h4>
                </div>

                <div className="grid gap-3">
                    <StrokeInput />
                    <ZoomInput />

                    <div className="p-2 border rounded-md grid gap-2">
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

function StrokeInput() {
    const [value, setValue] = useAtom(strokeWidthAtom);
    const displayValue = formatCompactNumber(value);

    return (
        <label className="text-xs flex items-center gap-2">
            <span className="shrink-0 w-12">
                Stroke
            </span>
            <Slider
                className="flex-1"
                value={[value]}
                min={0.1}
                max={12}
                step={0.1}
                onValueChange={([nextValue]) => {
                    if (!Number.isFinite(nextValue)) return;
                    setValue(nextValue);
                }}
            />
            <span className="w-10 text-right tabular-nums">{displayValue}</span>
        </label>
    );
}

function ZoomInput() {
    const { zoom } = useSnapshot(appSettings.pathEditor);
    const zoomViewPort = useSetAtom(doZoomViewPortAtom);

    return (
        <label className="text-xs flex items-center gap-2">
            <span className="shrink-0 w-12">
                Zoom
            </span>

            <Slider
                className="flex-1"
                value={[zoom]}
                min={0.25}
                max={16}
                step={0.1}
                onValueChange={([nextZoom]) => {
                    if (!Number.isFinite(nextZoom) || nextZoom <= 0 || nextZoom === zoom) return;
                    zoomViewPort({ scale: zoom / nextZoom });
                }}
            />

            <span className="w-12 text-right tabular-nums">{zoom.toFixed(1)}x</span>
        </label>
    );
}

function ToggleValueRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void; }) {
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
