import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=smaller streamline:interface-arrows-horizontal-shrink-resize-shrink-bigger-horizontal-smaller-size-arrow-arrows-big
import { classNames } from "@/utils";

export function IconSizeSmaller({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current stroke-[1.5px]", className)} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path d="M18.857 7.714L14.571 12L18.857 16.286m-13.714-8.571L9.429 12L5.143 16.286M.857.857v22.286m22.286-22.286v22.286" />
        </svg>
    );
}
