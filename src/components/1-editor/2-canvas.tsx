import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { cn } from "@/utils";
import { CanvasActionsMenu } from "./4-canvas-actions-menu";
import { appSettings } from "@/store/1-ui-settings";
import {
    canvasViewBoxAtom,
    parseErrorAtom,
    strokeWidthAtom,
    svgPathInputAtom,
    targetPointsAtom,
} from "@/store/0-atoms/2-svg-path-state";

export function PathCanvas() {
    const settings = useSnapshot(appSettings);
    const pathValue = useAtomValue(svgPathInputAtom);
    const parseError = useAtomValue(parseErrorAtom);
    const strokeWidth = useAtomValue(strokeWidthAtom);
    const viewBox = useAtomValue(canvasViewBoxAtom);
    const points = useAtomValue(targetPointsAtom);

    return (
        <div
            className={cn(
                "relative mx-auto aspect-4/3 w-full max-w-4xl overflow-hidden rounded-xl border",
                settings.darkCanvas ? "bg-zinc-900" : "bg-white",
            )}
        >
            {settings.showGrid && <GridOverlay dark={settings.darkCanvas} />}
            <CanvasActionsMenu />

            <svg
                viewBox={viewBox.join(" ")}
                className="size-full"
            >
                <path
                    d={parseError ? "M 0 0" : (pathValue || "M 0 0")}
                    fill="none"
                    stroke={settings.darkCanvas ? "oklch(0.9 0.05 260)" : "oklch(0.45 0.2 260)"}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {settings.showHelpers && points.map((point, index) => (
                    <circle
                        key={`${point.x}-${point.y}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={1.6}
                        fill={settings.darkCanvas ? "oklch(0.8 0.2 30)" : "oklch(0.55 0.2 30)"}
                    />
                ))}
            </svg>

            {parseError && (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-md bg-destructive/90 px-3 py-2 text-xs text-destructive-foreground">
                    {parseError}
                </div>
            )}
        </div>
    );
}

function GridOverlay({ dark }: { dark: boolean; }) {
    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0",
                dark
                    ? "bg-[linear-gradient(to_right,oklch(0.35_0_0/.45)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.35_0_0/.45)_1px,transparent_1px)]"
                    : "bg-[linear-gradient(to_right,oklch(0.86_0_0/.7)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.86_0_0/.7)_1px,transparent_1px)]",
                "bg-size-[20px_20px]",
            )}
        />
    );
}
