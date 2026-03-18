import { type ComponentProps, type InputHTMLAttributes, type ReactNode } from "react";
import { useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Link2, Unlink2 } from "lucide-react";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { SectionPanel } from "../../../ui/loacal-ui/1-section-panel";
import { doApplyScaleAtom, doApplyTranslateAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom, scaleXAtom, scaleYAtom, translateXAtom, translateYAtom } from "@/store/0-atoms/2-2-editor-actions";
import { buttonPanelClasses, compactInputClasses, compactLabelClasses } from "../8-shared-classes/0-classes";

export function PathOperationsPanel() {
    const { decimals, uniformScale } = useSnapshot(appSettings.pathEditor);
    const [scaleX, setScaleX] = useAtom(scaleXAtom);
    const [scaleY, setScaleY] = useAtom(scaleYAtom);

    const applyScale = useSetAtom(doApplyScaleAtom);
    const applyTranslate = useSetAtom(doApplyTranslateAtom);
    const doNormalize = useSetAtom(doNormalizePathAtom);
    const doSetRelative = useSetAtom(doSetRelativeAtom);
    const doSetAbsolute = useSetAtom(doSetAbsoluteAtom);

    return (
        <SectionPanel sectionKey="transform" label="Path Operations" contentClassName="px-0 pt-1 pb-4">
            <div className="pl-2.5 pr-2 text-[11px] space-y-1.5">
                <div className="flex gap-1.5">
                    <OperationNumberField
                        label={uniformScale ? "Uniform scale" : "Scale X"}
                        value={scaleX}
                        wrapperClasses={uniformScale ? "basis-[38%]" : "basis-[24%]"}
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
                                className="absolute right-1.5 top-0.5 text-slate-600 hover:text-slate-800"
                                title="Lock/Unlock x and y scales"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    const next = !uniformScale;
                                    appSettings.pathEditor.uniformScale = next;
                                    if (next) {
                                        setScaleY(scaleX);
                                    }
                                }}
                            >
                                {uniformScale ? <Link2 className="size-3.5" /> : <Unlink2 className="size-3.5" />}
                            </button>
                        }
                        onEnter={() => applyScale()}
                    />
                    {!uniformScale && (
                        <OperationNumberField
                            label="Scale Y"
                            value={scaleY}
                            wrapperClasses="basis-[24%]"
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

                <div className="flex gap-1.5">
                    <OperationAtomField label="Translate X" valueAtom={translateXAtom} wrapperClasses="basis-[33%]" step={1} onEnter={() => applyTranslate()} />
                    <OperationAtomField label="Translate Y" valueAtom={translateYAtom} wrapperClasses="basis-[33%]" step={1} onEnter={() => applyTranslate()} />
                    <ActionButton className="flex-1" title="Translate all commands" onClick={() => applyTranslate()}>
                        Translate
                    </ActionButton>
                </div>

                <div className="flex gap-1.5">
                    <OperationNumberField
                        label="Number of decimals"
                        value={decimals}
                        wrapperClasses="basis-[28%]"
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

function OperationAtomField({ valueAtom, label, wrapperClasses: wrapperClasses, onEnter, ...rest }: { valueAtom: PrimitiveAtom<number>; wrapperClasses?: string; label: string; onEnter?: () => void; } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    const [value, setValue] = useAtom(valueAtom);

    return (
        <OperationNumberField
            label={label}
            value={value}
            wrapperClasses={wrapperClasses}
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
    wrapperClasses,
    className,
    overlay,
    onEnter,
    ...rest
}: {
    value: number;
    onValueChange: (value: number) => void;
    wrapperClasses?: string;
    label: string;
    overlay?: ReactNode;
    onEnter?: () => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    return (
        <label className={classNames("relative", wrapperClasses)}>
            <span className={compactLabelClasses}>
                {label}
            </span>
            {overlay}
            <input
                className={classNames(compactInputClasses, className)}
                {...rest}
                value={value}
                onChange={(event) => onValueChange(Number(event.target.value))}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        onEnter?.();
                    }
                }}
                type="number"
            />
        </label>
    );
}

function ActionButton({ className, ...rest }: ComponentProps<typeof Button>) {
    return (
        <Button className={classNames(buttonPanelClasses, className)} {...rest}/>
    );
}
