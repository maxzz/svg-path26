import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=point iconoir:ease-curve-control-points
import { classNames } from "@/utils";

export function IconControlPoints({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
	return (
		<svg className={classNames("fill-none stroke-current stroke-[1.5px]", className)} viewBox="0 0 24 24" {...rest}>
			{title && <title>{title}</title>}
			<path d="M17 17.576a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0 0h-2.067M7 6.424a2 2 0 1 1-4 0a2 2 0 0 1 4 0m0 0h2m5 0h-2.067m.067 11.152h-1.899m-7.034-.083c8.932-.129 6.932-12.129 17.932-12.129" />
		</svg>
	);
}
