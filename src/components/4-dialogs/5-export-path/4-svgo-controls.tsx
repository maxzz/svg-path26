import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { CircleHelp, SlidersHorizontal } from "lucide-react";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Input } from "@/components/ui/shadcn/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { Switch } from "@/components/ui/shadcn/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { appSettings } from "@/store/0-ui-settings";
import { SVGO_PRESET_DEFAULT, SVGO_PRESET_DEFAULT_PLUGINS, type SvgoPresetDefaultPlugin } from "@/store/2-svgo-presets";
import { doSetOptimizeSvgEnabledAtom, doSetSvgoFloatPrecisionAtom, doSetSvgoMultipassAtom, doSetSvgoPresetDefaultPluginAtom } from "./8-dialog-export-atoms";

export function SvgoControls() {
    const svgo = useSnapshot(appSettings.export.svgo);
    const setOptimizeSvgEnabled = useSetAtom(doSetOptimizeSvgEnabledAtom);

    return (
        <div className="px-2 py-1.5 border rounded flex items-center justify-between gap-2 select-none">
            <label className="flex items-center cursor-pointer">
                <Switch className="scale-60 cursor-pointer" checked={svgo.enabled} onCheckedChange={(checked) => setOptimizeSvgEnabled(checked === true)} />
                <span>
                    Optimize SVG
                </span>
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
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(
        () => {
            if (typeof document === "undefined") return;
            setPortalContainer(document.querySelector("[data-dialog='export-svg']") as HTMLElement | null);
        },
        []);

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

            <PopoverContent className="p-0 w-72 text-xs" align="end" portalProps={{ container: portalContainer ?? undefined }}>
                <TooltipProvider delayDuration={250}>
                    <h4 className="px-3 py-2 text-xs font-semibold border-b">
                        SVGO options
                    </h4>

                    <div className="p-3 pb-2 grid gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox className="size-3.5" checked={svgo.multipass} onCheckedChange={(checked) => setSvgoMultipass(checked === true)} />
                            <span>Multipass</span>
                        </label>

                        <label className="flex items-center justify-between gap-2">
                            <span>
                                Float precision
                            </span>
                            <Input
                                className="h-6 w-16 px-1 text-right"
                                type="number"
                                min={0}
                                max={8}
                                step={1}
                                value={svgo.floatPrecision}
                                onChange={(event) => updateFloatPrecision(Number(event.target.value))}
                            />
                        </label>
                    </div>

                    <div className="px-3 pb-2 text-[11px] text-muted-foreground border-t">
                        <div className="pt-2 flex items-center justify-between gap-2 font-medium">
                            <span>
                                {SVGO_PRESET_DEFAULT.label} preset plugins
                            </span>
                            <span className="font-mono text-[10px]">
                                {SVGO_PRESET_DEFAULT.id}
                            </span>
                        </div>
                        <p className="mt-1 leading-4">
                            {SVGO_PRESET_DEFAULT.description}
                        </p>
                    </div>

                    <ScrollArea className="h-56 px-3 pb-3" viewportClassName="pb-3" fixedWidth parentContentWidth>
                        <div className="grid gap-1.5">
                            {SVGO_PRESET_DEFAULT_PLUGINS.map(
                                (plugin) => (
                                    <SvgoPluginCheckbox
                                        key={plugin.id}
                                        plugin={plugin}
                                        checked={svgo.presetDefault[plugin.id]}
                                        onCheckedChange={(enabled) => setSvgoPresetDefaultPlugin({ pluginName: plugin.id, enabled })}
                                    />
                                )
                            )}
                        </div>
                    </ScrollArea>
                </TooltipProvider>
            </PopoverContent>
        </Popover>
    );
}

function SvgoPluginCheckbox({ plugin, checked, onCheckedChange }: { plugin: SvgoPresetDefaultPlugin; checked: boolean; onCheckedChange: (enabled: boolean) => void; }) {
    return (
        <div className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-sm px-1 py-1 hover:bg-accent/40">
            <label className="flex min-w-0 items-start gap-2 cursor-pointer">
                <Checkbox className="mt-0.5 size-3.5" checked={checked} onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)} />
                <span className="grid gap-0.5 min-w-0">
                    <span className="text-[11px] font-medium leading-4">
                        {plugin.label}
                    </span>
                </span>
            </label>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button className="mt-0.5 text-muted-foreground transition-colors hover:text-foreground" aria-label={`About ${plugin.label}`} type="button">
                        <CircleHelp className="size-3.5" />
                    </button>
                </TooltipTrigger>

                <TooltipContent className="max-w-52" side="bottom" sideOffset={6}>
                    <div className="py-1 text-[11px] leading-4 grid gap-1">
                        <div className="text-pretty">
                            {plugin.description}
                        </div>
                        <a
                            className="text-sky-500 hover:text-sky-200 dark:text-sky-600 dark:hover:text-sky-400 underline underline-offset-2"
                            href={`https://svgo.dev/docs/plugins/${plugin.id}`}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Documentation
                        </a>
                    </div>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
