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
                <Button variant="outline" size="icon" title="View options">
                    <Settings className="size-4" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80 p-3">
                <div className="mb-3 border-b pb-2">
                    <h4 className="text-sm leading-none">
                        View options
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Configure stroke width and canvas zoom.
                    </p>
                </div>

                <div className="grid gap-3">
                    <label className="flex items-center gap-2 text-sm">
                        <span className="w-12 shrink-0">Stroke</span>
                        <input
                            type="range"
                            min={1}
                            max={12}
                            step={1}
                            value={strokeWidth}
                            onChange={(event) => setStrokeWidth(Number(event.target.value))}
                        />
                        <span className="w-8 text-right tabular-nums">{strokeWidth}</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                        <span className="w-12 shrink-0">Zoom</span>
                        <input
                            type="range"
                            min={0.5}
                            max={4}
                            step={0.1}
                            value={zoom}
                            onChange={(event) => setZoom(Number(event.target.value))}
                        />
                        <span className="w-12 text-right tabular-nums">{zoom.toFixed(1)}x</span>
                    </label>
                </div>
            </PopoverContent>
        </Popover>
    );
}
