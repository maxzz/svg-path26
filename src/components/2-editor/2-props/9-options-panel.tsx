import { type InputHTMLAttributes } from "react";
import { useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { Lock, LockOpen } from "lucide-react";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/shadcn/button";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel";
import { doNormalizePathAtom } from "@/store/0-atoms/2-2-editor-actions";
import { doFitViewBoxAtom, doZoomViewBoxAtom, viewPortHeightAtom, viewPortWidthAtom, viewPortXAtom, viewPortYAtom } from "@/store/0-atoms/2-1-canvas-viewbox";
import { appSettings } from "@/store/0-ui-settings";

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
    } = useSnapshot(appSettings.pathEditor);

    const fitViewBox = useSetAtom(doFitViewBoxAtom);
    const zoomViewBox = useSetAtom(doZoomViewBoxAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);

    return (
        <SectionPanel sectionKey="options" label="Options" contentClassName="px-0 pt-1 pb-4">
            <div className="space-y-3 pl-3 text-xs">
                <div className="space-y-2">
                    <span className="text-muted-foreground">viewBox</span>

                    <div className="flex items-end gap-2">
                        <div className="grid flex-1 grid-cols-4 gap-2">
                            <ViewBoxNumberField label="x" valueAtom={viewPortXAtom} />
                            <ViewBoxNumberField label="y" valueAtom={viewPortYAtom} />
                            <ViewBoxNumberField label="width" valueAtom={viewPortWidthAtom} min={1e-3} />
                            <ViewBoxNumberField label="height" valueAtom={viewPortHeightAtom} min={1e-3} />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 shrink-0"
                            title={viewPortLocked ? "Unlock viewBox" : "Lock viewBox"}
                            onClick={() => {
                                appSettings.pathEditor.viewPortLocked = !viewPortLocked;
                            }}
                        >
                            {viewPortLocked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" className="h-8 px-2" onClick={() => zoomViewBox({ scale: 10 / 9 })}>
                            -
                        </Button>
                        <Button variant="outline" className="h-8 px-2" onClick={() => fitViewBox()}>
                            Zoom to Fit
                        </Button>
                        <Button variant="outline" className="h-8 px-2" onClick={() => zoomViewBox({ scale: 9 / 10 })}>
                            +
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 items-center">
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
                                className="h-7 w-14 rounded border bg-background px-2 text-xs"
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
                </div>
            </div>
        </SectionPanel>
    );
}

function ViewBoxNumberField({ valueAtom, label, ...rest }: { valueAtom: PrimitiveAtom<number>; label: string; } & InputHTMLAttributes<HTMLInputElement>) {
    const [value, setValue] = useAtom(valueAtom);

    return (
        <label className="space-y-1">
            <span className="text-muted-foreground">{label}</span>
            <input
                type="number"
                className="h-8 w-full rounded border bg-background px-2 text-xs"
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                {...rest}
            />
        </label>
    );
}

function LabeledNumberField({ label, value, onValueChange, ...rest }: { label: string; value: number; onValueChange: (value: number) => void; } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="flex items-center gap-2 justify-self-end whitespace-nowrap">
            <span>{label}</span>
            <input
                type="number"
                className="h-7 w-14 rounded border bg-background px-2 text-xs"
                value={value}
                onChange={(event) => onValueChange(Number(event.target.value))}
                {...rest}
            />
        </label>
    );
}

function CheckboxRow({ label, checked, onCheckedChange, className }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; className?: string; }) {
    return (
        <label className={`flex items-center gap-2 ${className ?? ""}`}>
            <input
                type="checkbox"
                className="size-3.5 rounded border"
                checked={checked}
                onChange={(event) => onCheckedChange(event.target.checked)}
            />
            <span>{label}</span>
        </label>
    );
}