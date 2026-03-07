import { SvgSymbolCross } from "./13-cross";
import { SvgSymbolFire } from "./24-fire";
import { SvgSymbolInfo } from "./24-info";
import { SvgSymbolQuestion } from "./24-question";
import { SvgSymbolWarning } from "./24-warning";

export * from "./13-cross";
export * from "./24-info";
export * from "./24-fire";
export * from "./24-question";
export * from "./24-warning";

export function DefAllOtherTypes() {
    return (<>
        {SvgSymbolCross()}
        {SvgSymbolFire()}
        {SvgSymbolInfo()}
        {SvgSymbolQuestion()}
        {SvgSymbolWarning()}
    </>);
}
