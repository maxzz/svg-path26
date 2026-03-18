import { type InputHTMLAttributes } from "react";
import { useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { IconLockClosed, IconLockOpen, IconZoomIn, IconZoomNormal, IconZoomOut } from "@/components/ui/icons/normal";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { Switch } from "@/components/ui/shadcn/switch";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { doNormalizePathAtom } from "@/store/0-atoms/2-2-editor-actions";
import { doFitViewBoxAtom, doZoomViewBoxAtom, viewPortHeightAtom, viewPortWidthAtom, viewPortXAtom, viewPortYAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { pathViewBoxHeightAtom, pathViewBoxWidthAtom, pathViewBoxXAtom, pathViewBoxYAtom } from "@/store/0-atoms/2-6-path-viewbox";
import { appSettings } from "@/store/0-ui-settings";
import { classNames } from "@/utils";
import { compactInputClasses, compactLabelClasses } from "../8-shared-classes/0-classes";

export function OptionsPanel() {
    const uiSettings = useSnapshot(appSettings);
    const {
        minifyOutput,
        pointPrecision,
        showTicks,
        snapToGrid,
        tickInterval,
        fillPreview,
        viewPortLocked,
        showViewBoxFrame,
    } = useSnapshot(appSettings.pathEditor);

    const fitViewBox = useSetAtom(doFitViewBoxAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);

    return (
        <SectionPanel sectionKey="options" label="Options" contentClassName="px-0 pt-1 pb-4">
            <div className="pl-2.5 pr-2 max-w-[320px] text-[11px] space-y-2.5">
                <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground select-none">viewBox</span>
                    <ViewBoxControls showFrame={showViewBoxFrame} />

                    <span className="text-[11px] text-muted-foreground select-none">viewport</span>
                    <ViewportControls locked={viewPortLocked} />
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                    <CheckboxRow
                        label="Snap to grid"
                        checked={snapToGrid}
                        onCheckedChange={(checked) => {
                            appSettings.pathEditor.snapToGrid = checked;
                        }}
                    />
                    <LabeledNumberField
                        label="Precision"
                        value={pointPrecision}
                        min={0}
                        max={8}
                        step={1}
                        onValueChange={(value) => {
                            appSettings.pathEditor.pointPrecision = value;
                        }}
                    />

                    <CheckboxRow
                        label="Show grid"
                        checked={uiSettings.showGrid}
                        onCheckedChange={(checked) => {
                            appSettings.showGrid = checked;
                        }}
                    />
                    <div className="flex items-center gap-2 justify-self-end">
                        <CheckboxRow
                            label="Ticks"
                            checked={showTicks}
                            onCheckedChange={(checked) => {
                                appSettings.pathEditor.showTicks = checked;
                            }}
                        />
                        {showTicks ? (
                            <input
                                type="number"
                                className="h-6 w-12 rounded border bg-background px-2 text-[11px]"
                                value={tickInterval}
                                min={1}
                                step={1}
                                onChange={(event) => {
                                    appSettings.pathEditor.tickInterval = Math.max(1, Number(event.target.value) || 1);
                                }}
                            />
                        ) : null}
                    </div>

                    <CheckboxRow
                        label="Show point controls"
                        checked={uiSettings.showHelpers}
                        onCheckedChange={(checked) => {
                            appSettings.showHelpers = checked;
                        }}
                    />
                    <CheckboxRow
                        label="Fill path"
                        checked={fillPreview}
                        onCheckedChange={(checked) => {
                            appSettings.pathEditor.fillPreview = checked;
                        }}
                    />

                    <CheckboxRow
                        label="Minify output"
                        checked={minifyOutput}
                        className="col-span-2"
                        onCheckedChange={(checked) => {
                            appSettings.pathEditor.minifyOutput = checked;
                            doNormalize();
                        }}
                    />

                    <ViewportZoomControls onZoom={zoomViewBox} onFit={() => fitViewBox()} />
                </div>
            </div>
        </SectionPanel>
    );
}

function ViewportZoomControls({ onZoom, onFit }: { onZoom: (payload: { scale: number; }) => void; onFit: () => void; }) {
    return (
        <div className="grid grid-cols-3 gap-1.5">
            <Button variant="outline" className="h-7 px-2 text-[11px]" onClick={() => onZoom({ scale: 10 / 9 })}>
                <IconZoomOut className="size-3.5" />
            </Button>
            <Button variant="outline" className="h-7 px-2 text-[11px]" onClick={() => onFit()}>
                <IconZoomNormal className="size-3.5" />
            </Button>
            <Button variant="outline" className="h-7 px-2 text-[11px]" onClick={() => onZoom({ scale: 9 / 10 })}>
                <IconZoomIn className="size-3.5" />
            </Button>
        </div>
    );
}

function ViewportControls({ locked }: { locked: boolean; }) {
    return (
        <div className="flex items-start gap-1.5">
            <div className="grid flex-1 grid-cols-4 gap-1">
                <CompactViewBoxField label="x" valueAtom={viewPortXAtom} title="viewport x" />
                <CompactViewBoxField label="y" valueAtom={viewPortYAtom} title="viewport y" />
                <CompactViewBoxField label="width" valueAtom={viewPortWidthAtom} title="viewport width" min={1e-3} />
                <CompactViewBoxField label="height" valueAtom={viewPortHeightAtom} title="viewport height" min={1e-3} />
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="shrink-0 mt-px size-8 hover:bg-slate-200 rounded"
                title={locked ? "Unlock viewport" : "Lock viewport"}
                onClick={() => {
                    appSettings.pathEditor.viewPortLocked = !locked;
                }}
            >
                {locked ? <IconLockClosed className="size-3.5" /> : <IconLockOpen className="size-3" />}
            </Button>
        </div>
    );
}

function ViewBoxControls({ showFrame }: { showFrame: boolean; }) {
    return (
        <div className="flex items-start gap-1.5">
            <div className="grid flex-1 grid-cols-4 gap-1">
                <CompactViewBoxField label="x" valueAtom={pathViewBoxXAtom} title="viewBox x" />
                <CompactViewBoxField label="y" valueAtom={pathViewBoxYAtom} title="viewBox y" />
                <CompactViewBoxField label="width" valueAtom={pathViewBoxWidthAtom} title="viewBox width" min={1e-3} />
                <CompactViewBoxField label="height" valueAtom={pathViewBoxHeightAtom} title="viewBox height" min={1e-3} />
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="shrink-0 mt-px size-8 hover:bg-slate-200 rounded"
                title={showFrame ? "Hide viewBox frame" : "Show viewBox frame"}
                onClick={() => {
                    appSettings.pathEditor.showViewBoxFrame = !showFrame;
                }}
            >
                {showFrame ? <IconLockClosed className="size-3.5" /> : <IconLockOpen className="size-3" />}
            </Button>
            {/* <p className="text-[10px] text-muted-foreground">Lock icon toggles the viewBox frame on canvas.</p> */}
        </div>
    );
}

function CompactViewBoxField({ valueAtom, label, className, ...rest }: { valueAtom: PrimitiveAtom<number>; label: string; } & InputHTMLAttributes<HTMLInputElement>) {
    const [value, setValue] = useAtom(valueAtom);
    return (
        <label className="relative text-xs select-none">
            <span className={compactLabelClasses}>{label}</span>
            <input
                type="number"
                className={classNames(compactInputClasses, className)}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                {...rest}
            />
        </label>
    );
}

function LabeledNumberField({ label, value, onValueChange, ...rest }: { label: string; value: number; onValueChange: (value: number) => void; } & InputHTMLAttributes<HTMLInputElement>) {
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
            <span>{label}</span>
        </label>
    );
}