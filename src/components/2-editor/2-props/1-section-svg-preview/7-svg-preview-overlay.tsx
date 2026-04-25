import { useSnapshot } from "valtio";
import { cn } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { overlayButtonClasses, overlayButtonActiveClasses } from "../8-shared-classes/0-classes";

export function SvgPreview_Label() {
    const viewBoxStr = useSnapshot(appSettings.pathEditor).viewBox.join(", ");
    return (
        <div className="flex items-center gap-1">
            <span>
                SVG Preview
            </span>
            
            <span className="@max-[300px]/section-panel:hidden pt-0.5 text-[11px] text-muted-foreground">
                ({viewBoxStr})
            </span>
        </div>
    );
}

export function SvgPreview_Overlay() {
    const { fill, stroke, grid } = useSnapshot(appSettings.sectionPreview);
    return (
        <div className="mr-1 pl-2 text-xs bg-section-panel-background flex items-center justify-between gap-1.5 select-none">
            <PreviewToggle label="fill" pressed={fill} onToggle={() => appSettings.sectionPreview.fill = !fill} />
            <PreviewToggle label="stroke" pressed={stroke} onToggle={() => appSettings.sectionPreview.stroke = !stroke} />
            <PreviewToggle label="grid" pressed={grid} onToggle={() => appSettings.sectionPreview.grid = !grid} />
        </div>
    );
}

function PreviewToggle({ label, pressed, onToggle }: { label: string; pressed: boolean; onToggle: () => void; }) {
    return (
        <label className="flex items-center cursor-pointer gap-0.5">

            <span className="@max-[300px]/section-panel:hidden inline mb-px -mr-0.75 text-muted-foreground">
                {label}:
            </span>
            <span className="@max-[300px]/section-panel:inline hidden mb-px text-[9px] text-muted-foreground">
                {label.charAt(0).toLocaleUpperCase()}:
            </span>

            <Button
                className={cn(overlayButtonClasses, pressed && overlayButtonActiveClasses)}
                onClick={onToggle}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={`${label} ${pressed ? "on" : "off"}`}
                aria-pressed={pressed}
            >
                {pressed ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
            </Button>
        </label>
    );
}
