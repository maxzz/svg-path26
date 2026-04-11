import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=smaller streamline:interface-arrows-vertical-left-right-expand-resize-bigger-horizontal-smaller-size-arrow-arrows-big
import { classNames } from "@/utils";

export function IconSizeBigger({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current stroke-[1.5px]", className)} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path d="M5.966 6.634L1.046 11.554a.617.617 0 0 0 0 .891l4.92 4.92m12.069-10.731l4.92 4.92a.617.617 0 0 1 0 .891l-4.92 4.92M12 23.143V.857" />
        </svg>
    );
}
