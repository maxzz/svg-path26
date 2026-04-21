import { useSnapshot } from "valtio";
import { Input } from "@/components/ui/shadcn/input";
import { Switch } from "@/components/ui/shadcn/switch";
import { appSettings } from "@/store/0-ui-settings";

export function FillStrokeControls() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = useSnapshot(appSettings.export);
    return (
        <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-y-2">
            <div className="grid grid-cols-subgrid col-span-3 items-center gap-x-2">
                <label className="flex items-center justify-between px-2 py-1.5">
                    <span className="w-10">
                        Fill
                    </span>
                    <Switch
                        checked={exportFill}
                        onCheckedChange={(checked) => appSettings.export.exportFill = Boolean(checked)}
                    />
                </label>

                <Input
                    className="w-16 px-1 py-0.5 disabled:opacity-20"
                    type="color"
                    disabled={!exportFill}
                    value={exportFillColor}
                    onChange={(event) => appSettings.export.exportFillColor = event.target.value}
                />
            </div>

            <div className="grid grid-cols-subgrid col-span-3 items-center gap-x-2">
                <label className="flex items-center justify-between px-2 py-1.5">
                    <span className="w-10">
                        Stroke
                    </span>
                    <Switch
                        checked={exportStroke}
                        onCheckedChange={(checked) => appSettings.export.exportStroke = Boolean(checked)}
                    />
                </label>

                <Input
                    className="w-16 px-1 py-0.5 disabled:opacity-20"
                    type="color"
                    disabled={!exportStroke}
                    value={exportStrokeColor}
                    onChange={(event) => appSettings.export.exportStrokeColor = event.target.value}
                />

                <label className="flex items-center gap-x-2">
                    <span className="whitespace-nowrap">
                        Stroke width
                    </span>
                    <Input
                        className="w-16 disabled:opacity-20"
                        disabled={!exportStroke}
                        type="number"
                        min={0.1}
                        step={0.05}
                        value={exportStrokeWidth}
                        onChange={(event) => appSettings.export.exportStrokeWidth = Number(event.target.value)}
                    />
                </label>
            </div>
        </div>
    );
}
