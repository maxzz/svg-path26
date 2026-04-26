import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=grid glyphs:grid-sm
import { classNames } from "@/utils";

export function IconGrid({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current stroke-[1.5px]", className)} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path d="M8.333 1v22m7.333-22v22m7.333-14.667H1m22 7.333H1m0-13.2a1.467 1.467 0 0 1 1.467-1.467h19.067a1.467 1.467 0 0 1 1.467 1.467v19.067a1.467 1.467 0 0 1-1.467 1.467H2.467a1.467 1.467 0 0 1-1.467-1.467z"/>
        </svg>
    );
}