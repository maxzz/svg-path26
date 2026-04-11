import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=smaller dinkie-icons:smaller
import { classNames } from "@/utils";

export function IconFrame({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
	return (
		<svg className={classNames("fill-current", className)} viewBox="0 0 24 24" {...rest}>
			{title && <title>{title}</title>}
			<path fill="currentColor" d="M5 19h14V5H5Zm-4 4h2v-2H1Zm0-4h2V17H1Zm4 4h2v-2H5ZM1 15h2V13H1Zm8 8h2v-2H9ZM1 11h2V9H1Zm12 12h2v-2H13ZM1 7h2V5H1Zm16 16h2v-2H17ZM1 3h2V1H1Zm20 20h2v-2h-2ZM7 17V7h10v10Zm14 2h2V17h-2ZM5 3h2V1H5Zm16 12h2V13h-2ZM9 3h2V1H9Zm12 8h2V9h-2ZM13 3h2V1H13Zm8 4h2V5h-2ZM17 3h2V1H17Zm4 0h2V1h-2Zm0 0" />
		</svg>
	);
}
