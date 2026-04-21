import { useSnapshot } from "valtio";
import { Input } from "@/components/ui/shadcn/input";
import { Switch } from "@/components/ui/shadcn/switch";
import { appSettings } from "@/store/0-ui-settings";

export function FillStrokeControls() {
    const { exportFill, exportFillColor, exportStroke, exportStrokeColor, exportStrokeWidth } = useSnapshot(appSettings.export);
    return (
        <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-y-1">

            <div className="grid grid-cols-subgrid col-span-3 items-center gap-x-1.5">
                <label className="flex items-center justify-between">
                    <span className="w-10">
                        Stroke
                    </span>
                    <Switch
                        className="scale-75 cursor-pointer"
                        checked={exportStroke}
                        onCheckedChange={(checked) => appSettings.export.exportStroke = Boolean(checked)}
                    />
                </label>

                <Input
                    className="px-0.5 py-0 w-12 h-6 disabled:opacity-20"
                    type="color"
                    disabled={!exportStroke}
                    value={exportStrokeColor}
                    onChange={(event) => appSettings.export.exportStrokeColor = event.target.value}
                />

                <label className="flex items-center gap-x-2">
                    <span className="whitespace-nowrap">
                        width
                    </span>
                    <Input
                        className="pl-1.5 pr-1 py-0 w-16 h-6 disabled:opacity-20"
                        disabled={!exportStroke}
                        type="number"
                        min={0.1}
                        step={0.05}
                        value={exportStrokeWidth}
                        onChange={(event) => appSettings.export.exportStrokeWidth = Number(event.target.value)}
                    />
                </label>
            </div>

            <div className="grid grid-cols-subgrid col-span-3 items-center gap-x-1.5">
                <label className="flex items-center justify-between">
                    <span className="w-10">
                        Fill
                    </span>
                    <Switch
                        className="scale-75 cursor-pointer"
                        checked={exportFill}
                        onCheckedChange={(checked) => appSettings.export.exportFill = Boolean(checked)}
                    />
                </label>

                <Input
                    className="px-0.5 py-0 w-12 h-6 disabled:opacity-20"
                    type="color"
                    disabled={!exportFill}
                    value={exportFillColor}
                    onChange={(event) => appSettings.export.exportFillColor = event.target.value}
                />
            </div>

        </div>
    );
}
