import { type InputHTMLAttributes } from "react";
import { useAtom, useSetAtom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { Button } from "@/components/ui/shadcn/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/shadcn/accordion";
import { decimalsAtom, doApplyScaleAtom, doApplyTranslateAtom, scaleXAtom, scaleYAtom, translateXAtom, translateYAtom } from "@/store/0-atoms/2-0-svg-path-state";

export function TransformPanel() {
    const settings = useSnapshot(appSettings);

    const applyScale = useSetAtom(doApplyScaleAtom);
    const applyTranslate = useSetAtom(doApplyTranslateAtom);

    return (
        <section className="rounded-lg border px-3">
            <Accordion
                type="single"
                collapsible
                value={settings.transformAccordionOpen ? "transform" : ""}
                onValueChange={(value) => {
                    appSettings.transformAccordionOpen = value === "transform";
                }}
            >
                <AccordionItem value="transform" className="border-none">
                    <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
                        Transform
                    </AccordionTrigger>

                    <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <TransformNumberField label="Scale X" valueAtom={scaleXAtom} step={0.1} />
                            <TransformNumberField label="Scale Y" valueAtom={scaleYAtom} step={0.1} />
                            <TransformNumberField label="Translate X" valueAtom={translateXAtom} step={1} />
                            <TransformNumberField label="Translate Y" valueAtom={translateYAtom} step={1} />
                            <TransformNumberField label="Precision (decimals)" valueAtom={decimalsAtom} wrapperClassName="col-span-2" min={0} max={8} step={1} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button variant="outline" className="h-7 px-2.5" onClick={() => applyScale()}>
                                Apply Scale
                            </Button>
                            <Button variant="outline" className="h-7 px-2.5" onClick={() => applyTranslate()}>
                                Apply Translate
                            </Button>
                        </div>

                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
}

function TransformNumberField({ valueAtom, label, wrapperClassName, className, ...rest }: { valueAtom: PrimitiveAtom<number>; wrapperClassName?: string; label: string; } & InputHTMLAttributes<HTMLInputElement>) {
    const [value, setValue] = useAtom(valueAtom);
    return (
        <label className={classNames("space-y-1", wrapperClassName)}>
            <span>{label}</span>
            <input
                className={classNames("h-7 w-full rounded border bg-background px-2 text-xs", className)}
                type="number"
                {...rest}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
            />
        </label>
    );
}
