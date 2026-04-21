import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/utils";
import { Input } from "@/components/ui/shadcn/input";
import { viewBoxCustomValueStrDraftAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "./8-dialog-export-atoms";
import { ViewBoxPresetSelect, toCustomPresetId } from "./2-2-viewbox-preset";

export function ViewBoxEditor() {
    const viewBoxCustomValueStrDraft = useAtomValue(viewBoxCustomValueStrDraftAtom);
    const [viewBoxDraft, setViewBoxDraft] = useAtom(viewBoxDraftAtom);
    const setViewBoxStrDraft = useSetAtom(viewBoxStrDraftAtom);

    const customPresetId = toCustomPresetId(viewBoxCustomValueStrDraft);

    function updateViewBoxDraft(update: (previous: typeof viewBoxDraft) => typeof viewBoxDraft) {
        setViewBoxStrDraft(customPresetId);
        setViewBoxDraft((previous) => update(previous));
    }

    return (
        <div className="px-2 pt-1 pb-2.5 border rounded space-y-1 select-none">
            <div>
                Preset
            </div>
            <ViewBoxPresetSelect />

            <div className="mt-1.5">
                ViewBox
            </div>
            <div className="flex items-center gap-x-1">
                <span className="text-muted-foreground">x, y:</span>
                <NumberField value={viewBoxDraft[0]} onChange={(value) => updateViewBoxDraft((previous) => [value, previous[1], previous[2], previous[3]])} className="text-right" />
                <NumberField value={viewBoxDraft[1]} onChange={(value) => updateViewBoxDraft((previous) => [previous[0], value, previous[2], previous[3]])} className="pl-3.5" />

                <span className="ml-4 text-muted-foreground">width, height:</span>
                <NumberField min={0.000001} value={viewBoxDraft[2]} onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], value, previous[3]])} className="text-right" />
                <NumberField min={0.000001} value={viewBoxDraft[3]} onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], previous[2], value])} className="pl-3.5" />
            </div>
        </div>
    );
}

function NumberField({ className, value, onChange, min, max, step = "any" }: { className?: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number | "any"; }) {
    return (
        <Input
            className={cn("pl-0.5 pr-0 w-16 h-6", className)}
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(event) => onChange(Number(event.target.value))}
        />
    );
}
