import { type HTMLAttributes } from "react";
import { classNames } from "@/utils";

export function IconSnapToGrid2({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path
                fill="currentColor"
                d="M1 1v1.3h.9V2h.4V1H2Zm2.2 0v.9H5V1ZM6 1q.2 7.7 0 15.5H1V18h5v5h1.5v-5H23v-1.5H7.5Q7.3 8.7 7.5 1Zm2.5 0v.9h1.7V1ZM11 1v.9h.5v.4h.8V2h.5V1Zm2.7 0v.9h1.7V1Zm2.6 0v.9h.4v.4h1V2h.4V1ZM19 1v.9h1.8V1Zm2.7 0v.9h.4v.4h.9V1ZM1 3.2V5h.9V3.2zm10.6 0V5h.8V3.2zm5.2 0V5h1V3.2zm5.3 0V5h.9V3.2ZM1 5.8v1.8h.9v-.4h.4v-1H2v-.4zm10.6 0v.5H11v.9h.5v.4h.8v-.4h.5v-1h-.5v-.4zm5.2 0v.5h-.4v.9h.4v.4h1v-.4h.4v-1h-.5v-.4zm5.3 0v.5h-.4v.9h.4v.4h.9V5.8zm-18.9.5v.9H5v-1zm5.3 0v.9h1.7v-1zm5.3 0v.9h1.7v-1zm5.2 0v.9h1.8v-1ZM1 8.5v1.7h.9V8.5zm10.6 0v1.7h.8V8.5zm5.2 0v1.7h1V8.5zm5.3 0v1.7h.9V8.5ZM1 11V13h.9v-.5h.4v-.8H2V11zm10.6 0v.5H11v.8h.5v.5h.8v-.5h.5v-.8h-.5V11zm5.2 0v.5h-.4v.8h.4v.5h1v-.5h.4v-.8h-.5V11zm5.3 0v.5h-.4v.8h.4v.5h.9V11zm-18.9.5v.8H5v-.8zm5.3 0v.8h1.7v-.8zm5.3 0v.8h1.7v-.8zm5.2 0v.8h1.8v-.8ZM1 13.8v1.7h.9v-1.7zm10.6 0v1.7h.8v-1.7zm5.2 0v1.7h1v-1.7zm5.3 0v1.7h.9v-1.7ZM1 19v1.8h.9V19zm10.6 0v1.8h.8V19zm5.2 0v1.8h1V19zm5.3 0v1.8h.9V19ZM1 21.7V23h1.3v-.9H2v-.4zm10.6 0v.4H11v.9H13v-.9h-.5v-.4zm5.2 0v.4h-.4v.9h1.8v-.9h-.5v-.4zm5.3 0v.4h-.4v.9H23v-1.3zM3.2 22v.9H5v-.9zm5.3 0v.9h1.7v-.9zm5.3 0v.9h1.7v-.9zm5.2 0v.9h1.8v-.9z"
            />
        </svg>
    );
}