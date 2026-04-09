import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=grid glyphs:grid-sm
import { classNames } from "@/utils";

export function IconGrid({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current stroke-[1.5px]", className)} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 80 80" {...rest}>
            {title && <title>{title}</title>}
            <path d="M30 10v60m20-60v60m20-40H10m60 20H10m0-36a4 4 0 0 1 4-4h52a4 4 0 0 1 4 4v52a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z"/>
        </svg>
    );
}