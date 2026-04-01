import { type InputHTMLAttributes } from "react";
import { useAtom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { IconEyeHide, IconEyeShow, IconLockClosed, IconLockOpen } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { Switch } from "@/components/ui/shadcn/switch";
import { viewPortHeightAtom, viewPortWidthAtom, viewPortXAtom, viewPortYAtom } from "@/store/0-atoms/2-3-canvas-viewport";
import { pathViewBoxHeightAtom, pathViewBoxWidthAtom, pathViewBoxXAtom, pathViewBoxYAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { appSettings } from "@/store/0-ui-settings";
import { classNames } from "@/utils";
import { compactInputClasses, compactLabelClasses } from "../8-shared-classes/0-classes";

export function NumberRow({
    label,
    value,
    onValueChange,
    ...rest
}: {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
} & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="text-xs flex items-center justify-self-end whitespace-nowrap gap-1.5 select-none">
            <span>{label}</span>
            <input
                type="number"
                className="h-6 w-12 rounded border bg-background px-2 text-[11px]"
                value={value}
                onChange={(event) => onValueChange(Number(event.target.value))}
                {...rest}
            />
        </label>
    );
}

export function CheckboxRow({
    label,
    checked,
    onCheckedChange,
    className,
}: {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
}) {
    return (
        <label className={classNames("text-xs flex items-center gap-0.5 select-none", className)}>
            <Switch className="scale-75" checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
            <span>
                {label}
            </span>
        </label>
    );
}

function CompactField({
    valueAtom,
    label,
    className,
    ...rest
}: {
    valueAtom: PrimitiveAtom<number>;
    label: string;
} & InputHTMLAttributes<HTMLInputElement>) {
    const [value, setValue] = useAtom(valueAtom);
    return (
        <label className="relative text-xs select-none">
            <span className={compactLabelClasses}>
                {label}
            </span>
            <input
                className={classNames(compactInputClasses, className)}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                type="number"
                {...rest}
            />
        </label>
    );
}

export function ViewBoxControls() {
    const { showViewBoxFrame } = useSnapshot(appSettings.canvas);
    return (
        <div className="flex items-start gap-1.5">
            <div className="grid flex-1 grid-cols-4 gap-1">
                <CompactField label="x" valueAtom={pathViewBoxXAtom} title="viewBox x" />
                <CompactField label="y" valueAtom={pathViewBoxYAtom} title="viewBox y" />
                <CompactField label="width" valueAtom={pathViewBoxWidthAtom} title="viewBox width" min={1e-3} />
                <CompactField label="height" valueAtom={pathViewBoxHeightAtom} title="viewBox height" min={1e-3} />
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="shrink-0 mt-px size-8 hover:bg-slate-200 rounded"
                title={showViewBoxFrame ? "Hide viewBox frame" : "Show viewBox frame"}
                onClick={() => appSettings.canvas.showViewBoxFrame = !showViewBoxFrame}
            >
                {showViewBoxFrame ? <IconEyeShow className="size-3.5" /> : <IconEyeHide className="size-3" />}
            </Button>
            {/* <p className="text-[10px] text-muted-foreground">Lock icon toggles the viewBox frame on canvas.</p> */}
        </div>
    );
}

export function ViewportControls() {
    const { viewPortLocked } = useSnapshot(appSettings.pathEditor);
    return (
        <div className="flex items-start gap-1.5">
            <div className="grid flex-1 grid-cols-4 gap-1">
                <CompactField label="x" valueAtom={viewPortXAtom} title="viewport x" />
                <CompactField label="y" valueAtom={viewPortYAtom} title="viewport y" />
                <CompactField label="width" valueAtom={viewPortWidthAtom} title="viewport width" min={1e-3} />
                <CompactField label="height" valueAtom={viewPortHeightAtom} title="viewport height" min={1e-3} />
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="shrink-0 mt-px size-8 hover:bg-slate-200 rounded"
                title={viewPortLocked ? "Unlock viewport" : "Lock viewport"}
                onClick={() => appSettings.pathEditor.viewPortLocked = !viewPortLocked}
            >
                {viewPortLocked ? <IconLockClosed className="size-3.5" /> : <IconLockOpen className="size-3" />}
            </Button>
        </div>
    );
}
