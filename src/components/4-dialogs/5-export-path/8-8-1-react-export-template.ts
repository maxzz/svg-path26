import { type SvgInputNode } from "@/svg-core/3-svg-input";
import { prepareReactExport, type GenerateReactComponentOptions, type ReactComponentGenerationResult } from "./a-1-prepare-react-export-common";
import { buildAttributeParts, buildRootAttributeParts, emitElementMarkup } from "./8-8-3-jsx-utils";

export function generateReactComponentFromTemplate(options: GenerateReactComponentOptions): ReactComponentGenerationResult {
    const preparedExport = prepareReactExport(options);
    const rootNode = preparedExport.exportDocument.root;

    const svgElement = emitSvgRoot(rootNode, 2);
    const code = [
        'import { type ComponentPropsWithoutRef } from "react";',
        'import { cn } from "@/utils";',
        "",
        `export function ${preparedExport.componentName}({ className, ...rest }: ComponentPropsWithoutRef<"svg">) {`,
        "    return (",
                 /**/ svgElement,
        "    );",
        "}",
        "",
    ].join("\n");

    return {
        code,
        componentName: preparedExport.componentName,
        error: "",
        fileName: `${preparedExport.fileBaseName}.tsx`,
    };
}

function emitSvgRoot(node: SvgInputNode, depth: number): string {
    const attributeParts = buildRootAttributeParts(node.attributes, "rest");

    return emitElementMarkup(node.tagName, attributeParts, node.children, depth, emitChildNode);
}

function emitChildNode(node: SvgInputNode, depth: number): string {
    const attributeParts = buildAttributeParts(node.attributes);
    return emitElementMarkup(node.tagName, attributeParts, node.children, depth, emitChildNode);
}
