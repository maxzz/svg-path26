import { useSetAtom } from "jotai";
import { SlidersHorizontal } from "lucide-react";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Input } from "@/components/ui/shadcn/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { appSettings } from "@/store/0-ui-settings";
import { type SvgoPresetDefaultPluginName, SVGO_PRESET_DEFAULT_PLUGIN_NAMES } from "@/store/9-ui-settings-types-and-defaults";
import { doSetOptimizeSvgEnabledAtom, doSetSvgoFloatPrecisionAtom, doSetSvgoMultipassAtom, doSetSvgoPresetDefaultPluginAtom } from "./8-dialog-export-atoms";

export function SvgoControls() {
    const svgo = useSnapshot(appSettings.export.svgo);
    const setOptimizeSvgEnabled = useSetAtom(doSetOptimizeSvgEnabledAtom);

    return (
        <div className="px-2 py-1.5 border rounded flex items-center justify-between gap-2 select-none">
            <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                    className="size-3.5"
                    checked={svgo.enabled}
                    onCheckedChange={(checked) => setOptimizeSvgEnabled(checked === true)}
                />
                <span>Optimize SVG</span>
            </label>

            <SvgoOptionsPopover />
        </div>
    );
}

function SvgoOptionsPopover() {
    const svgo = useSnapshot(appSettings.export.svgo);
    const setSvgoMultipass = useSetAtom(doSetSvgoMultipassAtom);
    const setSvgoFloatPrecision = useSetAtom(doSetSvgoFloatPrecisionAtom);
    const setSvgoPresetDefaultPlugin = useSetAtom(doSetSvgoPresetDefaultPluginAtom);

    function updateFloatPrecision(value: number) {
        if (Number.isFinite(value)) {
            setSvgoFloatPrecision(Math.max(0, Math.min(8, value)));
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="xs" type="button" className="h-6 px-2 gap-1">
                    <SlidersHorizontal className="size-3" />
                    SVGO
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-72 text-xs" align="end">
                <h4 className="px-3 py-2 text-xs font-semibold border-b">
                    SVGO options
                </h4>

                <div className="p-3 pb-2 grid gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            className="size-3.5"
                            checked={svgo.multipass}
                            onCheckedChange={(checked) => setSvgoMultipass(checked === true)}
                        />
                        <span>Multipass</span>
                    </label>

                    <label className="flex items-center justify-between gap-2">
                        <span>Float precision</span>
                        <Input
                            className="h-6 w-16 px-1.5 text-right"
                            type="number"
                            min={0}
                            max={8}
                            step={1}
                            value={svgo.floatPrecision}
                            onChange={(event) => updateFloatPrecision(Number(event.target.value))}
                        />
                    </label>
                </div>

                <div className="px-3 pb-1 text-[11px] font-medium text-muted-foreground">
                    preset-default plugins
                </div>

                <ScrollArea className="h-56 px-3 pb-3" viewportClassName="pb-3" fixedWidth parentContentWidth>
                    <div className="grid gap-1.5">
                        {SVGO_PRESET_DEFAULT_PLUGIN_NAMES.map((pluginName) => (
                            <SvgoPluginCheckbox
                                key={pluginName}
                                pluginName={pluginName}
                                checked={svgo.presetDefault[pluginName]}
                                onCheckedChange={(enabled) => setSvgoPresetDefaultPlugin({ pluginName, enabled })}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

function SvgoPluginCheckbox({ pluginName, checked, onCheckedChange }: { pluginName: SvgoPresetDefaultPluginName; checked: boolean; onCheckedChange: (enabled: boolean) => void; }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
                className="size-3.5"
                checked={checked}
                onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
            />
            <span className="font-mono text-[11px] leading-4">{pluginName}</span>
        </label>
    );
}
