import { type HTMLAttributes } from "react"; // completely found somewhere by AI.
import { classNames } from "@/utils";

export function IconViewBox({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current stroke-[1.5]", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 20H4v-3" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
    );
}
