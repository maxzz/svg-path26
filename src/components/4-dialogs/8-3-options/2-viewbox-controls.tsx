import { type InputHTMLAttributes } from "react";
import { useAtom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/0-ui-settings";
import { IconEyeHide, IconEyeShow } from "@/components/ui/icons/normal";
import { Button } from "@/components/ui/shadcn/button";
import { pathViewBoxHeightAtom, pathViewBoxWidthAtom, pathViewBoxXAtom, pathViewBoxYAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { compactInputClasses, compactLabelClasses } from "../../2-editor/2-props/8-shared-classes/0-classes";

export function ViewBoxControls() {
    const { showViewBoxFrame } = useSnapshot(appSettings.canvas);
    return (
        <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground select-none">
                viewBox
            </span>
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
                    {showViewBoxFrame
                        ? <IconEyeShow className="size-3.5" />
                        : <IconEyeHide className="size-3" />
                    }
                </Button>
            </div>
        </div>
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
