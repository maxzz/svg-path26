import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Input } from "@/components/ui/shadcn/input";
import { viewBoxCustomValueStrDraftAtom, viewBoxDraftAtom, viewBoxStrDraftAtom } from "./8-dialog-export-atoms";
import { ViewBoxPresetSelect, toCustomPresetId } from "./3-viewbox-preset";

export function ViewBoxEditor() {
    const [viewBoxDraft, setViewBoxDraft] = useAtom(viewBoxDraftAtom);
    const setViewBoxStrDraft = useSetAtom(viewBoxStrDraftAtom);
    const viewBoxCustomValueStrDraft = useAtomValue(viewBoxCustomValueStrDraftAtom);
    
    const customPresetId = toCustomPresetId(viewBoxCustomValueStrDraft);

    function updateViewBoxDraft(update: (previous: typeof viewBoxDraft) => typeof viewBoxDraft) {
        setViewBoxStrDraft(customPresetId);
        setViewBoxDraft((previous) => update(previous));
    }

    return (
        <div className="space-y-2">
            <div className="px-2 py-2 border rounded flex items-center gap-2">
                <NumberField
                    label="X"
                    value={viewBoxDraft[0]}
                    onChange={(value) => updateViewBoxDraft((previous) => [value, previous[1], previous[2], previous[3]])}
                />
                <NumberField
                    label="Y"
                    value={viewBoxDraft[1]}
                    onChange={(value) => updateViewBoxDraft((previous) => [previous[0], value, previous[2], previous[3]])}
                />
                <NumberField
                    label="Width"
                    min={0.000001}
                    value={viewBoxDraft[2]}
                    onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], value, previous[3]])}
                />
                <NumberField
                    label="Height"
                    min={0.000001}
                    value={viewBoxDraft[3]}
                    onChange={(value) => updateViewBoxDraft((previous) => [previous[0], previous[1], previous[2], value])}
                />

                <ViewBoxPresetSelect />
            </div>
        </div>
    );
}

function NumberField({ label, value, onChange, min, max, step = "any" }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number | "any"; }) {
    return (
        <label className="space-y-1">
            <span className="text-muted-foreground">
                {label}
            </span>
            <Input
                className="w-16 h-6"
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </label>
    );
}
