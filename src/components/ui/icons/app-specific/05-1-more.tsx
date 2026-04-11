import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=expand pepicons-print:expand
import { classNames } from "@/utils";

export function IconSizeMore({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-current stroke-none", className)} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path d="M15.6 6h4.8a1.2 1.2 0 0 1 1.2 1.2v4.8a1.2 1.2 0 0 1-1.2 1.2h-4.8a1.2 1.2 0 0 1-1.2-1.2V7.2a1.2 1.2 0 0 1 1.2-1.2m-7.2 7.2h4.8a1.2 1.2 0 0 1 1.2 1.2v4.8a1.2 1.2 0 0 1-1.2 1.2H8.4a1.2 1.2 0 0 1-1.2-1.2v-4.8a1.2 1.2 0 0 1 1.2-1.2" opacity="0.2" />
            <path d="M13.625 11.225a.6.6 0 0 1-.85-.85l4.8-4.8a.6.6 0 0 1 .85.85zm-7.2 7.2a.6.6 0 0 1-.85-.85l4.8-4.8a.6.6 0 0 1 .85.85z" />
            <path d="M6 18.6a.6.6 0 0 1 0-1.2h4.8a.6.6 0 0 1 0 1.2z" />
            <path d="M6.6 18a.6.6 0 0 1-1.2 0v-4.8a.6.6 0 0 1 1.2 0zm12-7.2a.6.6 0 0 1-1.2 0V6a.6.6 0 0 1 1.2 0z" />
            <path d="M13.2 6.6a.6.6 0 0 1 0-1.2h4.8a.6.6 0 0 1 0 1.2z" />
        </svg>
    );
}
