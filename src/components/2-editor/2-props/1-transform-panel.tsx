import { type ComponentProps, type InputHTMLAttributes, type ReactNode } from "react";
import { atom, useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Link2, Unlink2 } from "lucide-react";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { SectionPanel } from "../../ui/loacal-ui/1-section-panel";
import { doApplyScaleAtom, doApplyTranslateAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom, scaleXAtom, scaleYAtom, translateXAtom, translateYAtom } from "@/store/0-atoms/2-2-editor-actions";

const uniformScaleAtom = atom(true);

export function TransformPanel() {
    const { decimals } = useSnapshot(appSettings.pathEditor);
    const [uniformScale, setUniformScale] = useAtom(uniformScaleAtom);
    const [scaleX, setScaleX] = useAtom(scaleXAtom);
    const [scaleY, setScaleY] = useAtom(scaleYAtom);

    const applyScale = useSetAtom(doApplyScaleAtom);
    const applyTranslate = useSetAtom(doApplyTranslateAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);

    return (
        <SectionPanel sectionKey="transform" label="Path Operations" contentClassName="px-0 pt-1 pb-4">
            <div className="space-y-2 pl-3 pr-2 text-xs">
                <div className="flex gap-2">
                    <OperationNumberField
                        label={uniformScale ? "Uniform scale" : "Scale X"}
                        value={scaleX}
                        wrapperClassName={uniformScale ? "basis-[38%]" : "basis-[24%]"}
                        step={0.1}
                        onValueChange={(nextValue) => {
                            setScaleX(nextValue);
                            if (uniformScale) {
                                setScaleY(nextValue);
                            }
                        }}
                        overlay={
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800"
                                title="Lock/Unlock x and y scales"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    const next = !uniformScale;
                                    setUniformScale(next);
                                    if (next) {
                                        setScaleY(scaleX);
                                    }
                                }}
                            >
                                {uniformScale ? <Link2 className="size-4" /> : <Unlink2 className="size-4" />}
                            </button>
                        }
                        onEnter={() => applyScale()}
                    />
                    {!uniformScale && (
                        <OperationNumberField
                            label="Scale Y"
                            value={scaleY}
                            wrapperClassName="basis-[24%]"
                            step={0.1}
                            onValueChange={(nextValue) => {
                                setScaleY(nextValue);
                            }}
                            onEnter={() => applyScale()}
                        />
                    )}
                    <ActionButton
                        className={uniformScale ? "flex-1" : "basis-[30%]"}
                        title="Scale all commands"
                        onClick={() => applyScale()}
                    >
                        Scale
                    </ActionButton>
                </div>

                <div className="flex gap-2">
                    <OperationAtomField label="Translate X" valueAtom={translateXAtom} wrapperClassName="basis-[33%]" step={1} onEnter={() => applyTranslate()} />
                    <OperationAtomField label="Translate Y" valueAtom={translateYAtom} wrapperClassName="basis-[33%]" step={1} onEnter={() => applyTranslate()} />
                    <ActionButton className="flex-1" title="Translate all commands" onClick={() => applyTranslate()}>
                        Translate
                    </ActionButton>
                </div>

                <div className="flex gap-2">
                    <OperationNumberField
                        label="Number of decimals"
                        value={decimals}
                        wrapperClassName="basis-[28%]"
                        min={0}
                        max={8}
                        step={1}
                        onValueChange={(nextValue) => {
                            appSettings.pathEditor.decimals = nextValue;
                        }}
                    />
                    <ActionButton className="basis-[18%]" title="Round all path numbers" onClick={() => doNormalize()}>
                        Round
                    </ActionButton>
                    <ActionButton className="basis-[18%]" title="Convert all commands to relative" onClick={() => doSetRelative()}>
                        To rel
                    </ActionButton>
                    <ActionButton className="basis-[18%]" title="Convert all commands to absolute" onClick={() => doSetAbsolute()}>
                        To abs
                    </ActionButton>
                </div>
            </div>
        </SectionPanel>
    );
}

function OperationAtomField({ valueAtom, label, wrapperClassName, onEnter, ...rest }: { valueAtom: PrimitiveAtom<number>; wrapperClassName?: string; label: string; onEnter?: () => void; } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    const [value, setValue] = useAtom(valueAtom);

    return (
        <OperationNumberField
            label={label}
            value={value}
            wrapperClassName={wrapperClassName}
            onValueChange={(nextValue) => setValue(nextValue)}
            onEnter={onEnter}
            {...rest}
        />
    );
}

function OperationNumberField({
    value,
    onValueChange,
    label,
    wrapperClassName,
    className,
    overlay,
    onEnter,
    ...rest
}: {
    value: number;
    onValueChange: (value: number) => void;
    wrapperClassName?: string;
    label: string;
    overlay?: ReactNode;
    onEnter?: () => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    return (
        <label className={classNames("relative overflow-hidden rounded-md", wrapperClassName)}>
            <span className="pointer-events-none absolute left-2 top-1 text-[11px] text-slate-600">{label}</span>
            {overlay}
            <input
                className={classNames("h-14 w-full rounded-md border border-slate-400/70 bg-slate-100/90 px-2 pt-5 text-[15px] text-slate-800 shadow-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none", className)}
                type="number"
                {...rest}
                value={value}
                onChange={(event) => onValueChange(Number(event.target.value))}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        onEnter?.();
                    }
                }}
            />
        </label>
    );
}

function ActionButton({ className, ...rest }: ComponentProps<typeof Button>) {
    return (
        <Button
            variant="outline"
            className={classNames("h-14 rounded-md border-slate-500/60 bg-slate-300/55 text-base text-slate-900 shadow-sm hover:bg-slate-300/70", className)}
            {...rest}
        />
    );
}
