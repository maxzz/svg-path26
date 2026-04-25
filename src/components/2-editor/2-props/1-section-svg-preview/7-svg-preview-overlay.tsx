import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";

export function SvgPreviewLabel() {
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

export function SvgPreviewOverlay() {
    const { fill, stroke, grid } = useSnapshot(appSettings.sectionPreview);
    return (
        <div className="mr-1 text-xs flex items-center justify-between gap-1.5 select-none">
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
            <span className="@max-[300px]/section-panel:inline hidden mb-px -mr-1 text-muted-foreground">
                {label.charAt(0).toLocaleUpperCase()}:
            </span>

            <Button
                className={overlayButtonClasses}
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

const overlayButtonClasses = "size-5 rounded-sm text-muted-foreground hover:text-foreground";
