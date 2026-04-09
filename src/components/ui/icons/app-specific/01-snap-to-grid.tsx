import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=snap fluent-mdl2:snap-to-grid
import { classNames } from "@/utils";

export function IconSnapToGrid({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path fill="currentColor" d="M5.4 1v1.467H3.933V1zM2.467 3.933v1.467H1V3.933zm0-2.933v1.467H1V1zm0 5.867v1.467H1V6.867zm8.8 2.933V8.333h1.467v1.467zm0-8.8v1.467H9.8V1zm1.467 4.4v1.467H11.267V5.4zM17.133 1v1.467h-1.467V1zm2.933 0v1.467h-1.467V1zM1 23v-1.467h1.467v1.467zM12.733 3.933H11.267V2.467h1.467zM14.2 1v1.467h-1.467V1zM8.333 1v1.467H6.867V1zm13.2 7.333V6.867h1.467v1.467zM6.867 23v-1.467h1.467v1.467zM9.8 11.267v1.467H8.333V11.267zm11.733 0V9.8h1.467v13.2H9.8v-1.467h1.467V11.267zm0 10.267v-8.8h-8.8v8.8zm0-20.533h1.467v1.467h-1.467zm0 4.4V3.933h1.467v1.467zM1 20.067v-1.467h1.467v1.467zm5.867-8.8v1.467H5.4V11.267zM1 14.2v-1.467h1.467v1.467zm0 2.933v-1.467h1.467v1.467zm0-7.333h1.467v1.467H1zm2.933 1.467v1.467H2.467V11.267zm0 11.733v-1.467h1.467v1.467z" />
        </svg>
    );
}
