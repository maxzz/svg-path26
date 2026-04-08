import { RadioGroup, RadioGroupItem } from "@/components/ui/shadcn/radio-group";
import type { ScaleDialogAxisMode } from "@/store/10-dialogs-ui-settings-types-and-defaults";

export function ScaleModeSelector({
    mode,
    onChange,
}: {
    mode: ScaleDialogAxisMode;
    onChange: (next: ScaleDialogAxisMode) => void;
}) {
    return (
        <div className="rounded border p-3">
            <div className="mb-2 text-[11px] text-muted-foreground">Mode</div>
            <RadioGroup
                value={mode}
                onValueChange={(value) => onChange(value as ScaleDialogAxisMode)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
                <label className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 select-none">
                    <span>Scale Uniform</span>
                    <RadioGroupItem value="uniform" />
                </label>
                <label className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 select-none">
                    <span>Scale by X only</span>
                    <RadioGroupItem value="x" />
                </label>
                <label className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 select-none">
                    <span>Scale by Y only</span>
                    <RadioGroupItem value="y" />
                </label>
            </RadioGroup>
        </div>
    );
}

