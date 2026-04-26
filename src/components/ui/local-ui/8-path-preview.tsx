import { type SVGProps } from "react";
import { SvgPathModel } from "@/svg-core/2-svg-model";

export function PathPreview({ path, ...rest }: { path: string; } & Omit<SVGProps<SVGSVGElement>, "children">) {
    const preview = getPathPreview(path);
    return (
        <svg viewBox={preview.viewBox} {...rest}>
            <path d={path} fill="none" stroke="currentColor" strokeWidth={preview.strokeWidth} />
        </svg>
    );
}

function getPathPreview(path: string): { viewBox: string; strokeWidth: number; } {
    try {
        const model = new SvgPathModel(path);
        const bounds = model.getBounds();
        const width = Math.max(2, bounds.xmax - bounds.xmin);
        const height = Math.max(2, bounds.ymax - bounds.ymin);
        const pad = Math.max(width, height) * 0.2 + 0.5;

        return {
            viewBox: `${bounds.xmin - pad} ${bounds.ymin - pad} ${width + pad * 2} ${height + pad * 2}`,
            strokeWidth: Math.max(width, height) / 35,
        };
    } catch {
        return { viewBox: "0 0 10 10", strokeWidth: 0.5 };
    }
}
