import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/utils";
import { Input } from "@/components/ui/shadcn/input";
import { doSetExportViewBoxDraftAtom, viewBoxCustomValueStrDraftAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "./8-dialog-export-atoms";
import { ViewBoxPresetSelect, toCustomPresetId } from "./2-2-viewbox-preset";

export function ViewBoxEditor() {
    const viewBoxCustomValueStrDraft = useAtomValue(viewBoxCustomValueStrDraftAtom);
    const viewBoxDraft = useAtomValue(viewBoxDraftAtom);
    const setViewBoxDraft = useSetAtom(doSetExportViewBoxDraftAtom);
    const setViewBoxStrDraft = useSetAtom(viewBoxStrDraftAtom);

    const customPresetId = toCustomPresetId(viewBoxCustomValueStrDraft);

    function updateViewBoxDraft(update: (previous: typeof viewBoxDraft) => typeof viewBoxDraft) {
        setViewBoxStrDraft(customPresetId);
        setViewBoxDraft((previous) => update(previous));
    }

    return (
        <div className="px-2 pt-1 pb-2.5 border rounded grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 select-none">
            <div className="">
                ViewBox
            </div>

            <div className="">
                Preset
            </div>

            <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-1 gap-y-0.5">
                <span className="px-1 1text-right text-muted-foreground" title="x, y">x, y:</span>
                <NumberField value={viewBoxDraft[0]} onChange={(value) => updateViewBoxDraft((previous) => [value, previous[1], previous[2], previous[3]])} className="text-right" />
                <NumberField value={viewBoxDraft[1]} onChange={(value) => updateViewBoxDraft((previous) => [previous[0], value, previous[2], previous[3]])} className="pl-2.5" />

                <span className="px-1 1text-right text-muted-foreground" title="width, height">w, h:</span>
                <NumberField min={0.000001} value={viewBoxDraft[2]} onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], value, previous[3]])} className="text-right" />
                <NumberField min={0.000001} value={viewBoxDraft[3]} onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], previous[2], value])} className="pl-2.5" />
            </div>

            <ViewBoxPresetSelect className="w-full" />
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
