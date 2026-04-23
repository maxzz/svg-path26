import { atom, useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";

export const showGridAtom = atom(true);

export function SvgPreviewLabel() {
    const viewBoxStr = useSnapshot(appSettings.pathEditor).viewBox.join(", ");

    return (
        <div className="flex items-center gap-1">
            <span>SVG preview</span>
            <span className="pt-0.5 text-[11px] text-muted-foreground">({viewBoxStr})</span>
        </div>
    );
}

export function SvgPreviewOverlay() {
    const [showGrid, setShowGrid] = useAtom(showGridAtom);

    return (
        <div className="mr-1 text-xs flex items-center justify-between gap-1 select-none">
            <label className="flex items-center cursor-pointer gap-0.5">
                <span className="mb-px -mr-0.75 text-muted-foreground">
                    grid:
                </span>
                <Button
                    className={overlayButtonClasses}
                    onClick={() => setShowGrid((current) => !current)}
                    variant="ghost"
                    size="icon"
                    type="button"
                >
                    {showGrid ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
                </Button>
            </label>
        </div>
    );
}

const overlayButtonClasses = "size-5 rounded-sm text-muted-foreground hover:text-foreground";
