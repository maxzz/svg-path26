import { type InputHTMLAttributes } from "react";
import { useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { IconLockClosed, IconLockOpen } from "@/components/ui/icons/normal";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Switch } from "@/components/ui/shadcn/switch";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { doNormalizePathAtom } from "@/store/0-atoms/2-2-editor-actions";
import { viewPortHeightAtom, viewPortWidthAtom, viewPortXAtom, viewPortYAtom } from "@/store/0-atoms/2-1-canvas-viewport";
import { pathViewBoxHeightAtom, pathViewBoxWidthAtom, pathViewBoxXAtom, pathViewBoxYAtom } from "@/store/0-atoms/2-6-path-viewbox";
import { appSettings } from "@/store/0-ui-settings";
import { classNames } from "@/utils";
import { compactInputClasses, compactLabelClasses } from "../8-shared-classes/0-classes";

export function OptionsPanel() {
    const { showTicks, snapToGrid, fillPreview, showGrid, showHelpers } = useSnapshot(appSettings.canvas);
    const { minifyOutput, pointPrecision, tickInterval } = useSnapshot(appSettings.pathEditor);

    const doNormalizePath = useSetAtom(doNormalizePathAtom);

    return (
        <SectionPanel sectionKey="options" label="Options" contentClassName="px-0 pt-1 pb-4">
            <div className="pl-2.5 pr-2 max-w-[320px] text-[11px] space-y-2.5">
                <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground select-none">
                        viewBox
                    </span>
                    <ViewBoxControls />

                    <span className="text-[11px] text-muted-foreground select-none">
                        viewPort
                    </span>
                    <ViewportControls />
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                    <CheckboxRow label="Snap to grid" className="col-start-1" checked={snapToGrid} onCheckedChange={(checked) => appSettings.canvas.snapToGrid = checked} />

                    <NumberRow label="Precision" className="col-start-2" value={pointPrecision} min={0} max={8} step={1} onValueChange={(value) => appSettings.pathEditor.pointPrecision = value} />

                    <CheckboxRow label="Show grid" className="col-start-2" checked={showGrid} onCheckedChange={(checked) => appSettings.canvas.showGrid = checked} />

                    <div className="col-start-1 flex items-center gap-2">
                        <CheckboxRow label="Ticks" checked={showTicks} onCheckedChange={(checked) => appSettings.canvas.showTicks = checked} />
                        <input
                            className="h-6 w-12 rounded border bg-background px-2 text-[11px] disabled:opacity-20"
                            disabled={!showTicks}
                            type="number"
                            value={tickInterval}
                            min={1}
                            step={1}
                            onChange={(event) => appSettings.pathEditor.tickInterval = Math.max(1, Number(event.target.value) || 1)}
                        />
                    </div>

                    <CheckboxRow label="Show point controls" className="col-start-2" checked={showHelpers} onCheckedChange={(checked) => appSettings.canvas.showHelpers = checked} />
                    <CheckboxRow label="Fill path" className="col-start-2" checked={fillPreview} onCheckedChange={(checked) => appSettings.canvas.fillPreview = checked} />
                    <CheckboxRow label="Minify output" checked={minifyOutput} className="col-start-2" onCheckedChange={(checked) => { appSettings.pathEditor.minifyOutput = checked; doNormalizePath(); }} />
                </div>
            </div>
        </SectionPanel>
    );
}

function NumberRow({ label, value, onValueChange, ...rest }: { label: string; value: number; onValueChange: (value: number) => void; } & InputHTMLAttributes<HTMLInputElement>) {
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

function CheckboxRow({ label, checked, onCheckedChange, className }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; className?: string; }) {
    return (
        <label className={classNames("text-xs flex items-center gap-0.5 select-none", className)}>
            <Switch className="scale-75" checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
            <span>
                {label}
            </span>
        </label>
    );
}

function CompactField({ valueAtom, label, className, ...rest }: { valueAtom: PrimitiveAtom<number>; label: string; } & InputHTMLAttributes<HTMLInputElement>) {
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

function ViewBoxControls() {
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
                {showViewBoxFrame ? <IconLockClosed className="size-3.5" /> : <IconLockOpen className="size-3" />}
            </Button>
            {/* <p className="text-[10px] text-muted-foreground">Lock icon toggles the viewBox frame on canvas.</p> */}
        </div>
    );
}

function ViewportControls() {
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

//TODO: change viewBox icon. It's not lock and should be show/hide