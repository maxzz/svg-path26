import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=smaller qlementine-icons:resize-smaller-16
import { classNames } from "@/utils";

export function IconSizeLess({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-current stroke-none", className)} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path d="M14.25 1.5a.75.75 0 0 1 .75.75v5.685l6.225-6.225a.75.75 0 0 1 1.06 1.06l-6.225 6.225h5.685a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75zm-4.5 21a.75.75 0 0 1-.75-.75v-5.685l-6.225 6.225a.75.75 0 0 1-1.06-1.06l6.225-6.225h-5.685a.75.75 0 0 1 0-1.5h7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75z" />
        </svg>
    );
}
