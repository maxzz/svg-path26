import { generateReactComponentFromTemplate } from "./8-8-1-react-export-template";
import { type GenerateReactComponentOptions, type ReactComponentGenerationResult, prepareReactExport } from "./a-1-prepare-react-export-common";
import { buildAttributeParts, buildRootAttributeParts, emitElementMarkup, isTitleLineNode, renderTitleLine, type TitleLineNode, withTitleLine } from "./8-8-3-jsx-utils";

export function generateReactComponentWithMarkupParser(options: GenerateReactComponentOptions): ReactComponentGenerationResult {
    const preparedExport = prepareReactExport(options);

    try {
        const parsedDocument = new DOMParser().parseFromString(preparedExport.svgMarkup, "image/svg+xml");
        const parserError = parsedDocument.querySelector("parsererror");
        if (parserError) {
            throw new Error(parserError.textContent ?? "Failed to parse SVG markup.");
        }

        const svgElement = emitSvgElement(parsedDocument.documentElement, 2);
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
    } catch (error) {
        const fallbackResult = generateReactComponentFromTemplate(options);
        const message = error instanceof Error ? error.message : String(error);
        return {
            ...fallbackResult,
            notice: `The markup-parser generator fell back to the template generator. ${message}`,
        };
    }
}

type RootChildElement = Element | TitleLineNode;

function emitSvgElement(element: Element, depth: number): string {
    const attributes = [...element.attributes];
    const attributeParts = buildRootAttributeParts(attributes, "rest");
    const children: RootChildElement[] = withTitleLine([...element.children]);

    return emitElementMarkup(element.tagName.toLowerCase(), attributeParts, children, depth, emitRootChildElement);
}

function emitRootChildElement(node: RootChildElement, depth: number): string {
    if (isTitleLineNode(node)) {
        return renderTitleLine(depth);
    }

    return emitChildElement(node, depth);
}

function emitChildElement(element: Element, depth: number): string {
    const attributeParts = buildAttributeParts([...element.attributes]);
    return emitElementMarkup(element.tagName.toLowerCase(), attributeParts, [...element.children], depth, emitChildElement);
}
