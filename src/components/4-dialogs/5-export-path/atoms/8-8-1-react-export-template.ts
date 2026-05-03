import { type SvgInputNode } from "@/svg-core/3-svg-input";
import { prepareReactExport, type GenerateReactComponentOptions, type ReactComponentGenerationResult } from "./a-1-prepare-react-export-common";
import { buildAttributeParts, buildRootAttributeParts, emitElementMarkup, isTitleLineNode, renderTitleLine, type TitleLineNode, withTitleLine } from "./8-8-3-jsx-utils";

export function generateReactComponentFromTemplate(options: GenerateReactComponentOptions): ReactComponentGenerationResult {
    const preparedExport = prepareReactExport(options);
    const rootNode = preparedExport.exportDocument.root;

    const svgElement = emitSvgRoot(rootNode, 2);
    const code = [
        'import { type ComponentPropsWithRef } from "react";',
        'import { cn } from "@/utils";',
        "",
        `export function ${preparedExport.componentName}({ className, title, ...rest }: ComponentPropsWithRef<"svg"> & { title?: string }) {`,
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

type RootChildNode = SvgInputNode | TitleLineNode;

function emitSvgRoot(node: SvgInputNode, depth: number): string {
    const attributeParts = buildRootAttributeParts(node.attributes, "rest");
    const children: RootChildNode[] = withTitleLine(node.children);

    return emitElementMarkup(node.tagName, attributeParts, children, depth, emitRootChildNode);
}

function emitRootChildNode(node: RootChildNode, depth: number): string {
    if (isTitleLineNode(node)) {
        return renderTitleLine(depth);
    }

    return emitChildNode(node, depth);
}

function emitChildNode(node: SvgInputNode, depth: number): string {
    const attributeParts = buildAttributeParts(node.attributes);
    return emitElementMarkup(node.tagName, attributeParts, node.children, depth, emitChildNode);
}
