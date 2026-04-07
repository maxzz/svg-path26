import { Link2, Unlink2 } from "lucide-react";

import { Input } from "@/components/ui/shadcn/input";
import type { ScaleDialogAxisMode } from "@/store/10-dialogs-ui-settings-types-and-defaults";

export function ScaleMultiplierInputs({
    mode,
    scaleX,
    scaleY,
    linked,
    onSetScaleX,
    onSetScaleY,
    onSetLinked,
}: {
    mode: ScaleDialogAxisMode;
    scaleX: number;
    scaleY: number;
    linked: boolean;
    onSetScaleX: (next: number) => void;
    onSetScaleY: (next: number) => void;
    onSetLinked: (next: boolean) => void;
}) {
    if (mode === "uniform") {
        return (
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                <label className="space-y-1">
                    <span className="text-muted-foreground">X multiplier</span>
                    <Input
                        type="number"
                        step={0.1}
                        value={scaleX}
                        onChange={(event) => {
                            const next = Number(event.target.value);
                            onSetScaleX(next);
                            if (linked) onSetScaleY(next);
                        }}
                    />
                </label>

                <button
                    type="button"
                    className="h-8 w-8 inline-flex items-center justify-center rounded border bg-background hover:bg-muted/50"
                    title={linked ? "Unlink X and Y" : "Link X and Y"}
                    onClick={() => {
                        const nextLinked = !linked;
                        if (nextLinked) onSetScaleY(scaleX);
                        onSetLinked(nextLinked);
                    }}
                >
                    {linked ? <Link2 className="size-4" /> : <Unlink2 className="size-4" />}
                </button>

                <label className="space-y-1">
                    <span className="text-muted-foreground">Y multiplier</span>
                    <Input
                        type="number"
                        step={0.1}
                        value={scaleY}
                        onChange={(event) => {
                            const next = Number(event.target.value);
                            onSetScaleY(next);
                            if (linked) onSetScaleX(next);
                        }}
                    />
                </label>
            </div>
        );
    }

    if (mode === "x") {
        return (
            <div className="grid grid-cols-1 gap-3">
                <label className="space-y-1">
                    <span className="text-muted-foreground">X multiplier</span>
                    <Input
                        type="number"
                        step={0.1}
                        value={scaleX}
                        onChange={(event) => onSetScaleX(Number(event.target.value))}
                    />
                </label>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            <label className="space-y-1">
                <span className="text-muted-foreground">Y multiplier</span>
                <Input
                    type="number"
                    step={0.1}
                    value={scaleY}
                    onChange={(event) => onSetScaleY(Number(event.target.value))}
                />
            </label>
        </div>
    );
}

