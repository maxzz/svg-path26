import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=point iconoir:ease-curve-control-points
import { classNames } from "@/utils";

export function IconControlPoints({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
	return (
		<svg className={classNames("fill-none stroke-current stroke-[1.5px]", className)} viewBox="0 0 24 24" {...rest}>
			{title && <title>{title}</title>}
			<path d="M17 20a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0 0h-2M7 4a2 2 0 1 1-4 0a2 2 0 0 1 4 0m0 0h2m5 0h-2m0 16h-2m-7 0c8 0 10-16 18-16" />
		</svg>
	);
}
