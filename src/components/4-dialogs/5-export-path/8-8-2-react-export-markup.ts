import { generateReactComponentFromTemplate } from "./8-8-1-react-export-template";
import { type GenerateReactComponentOptions, type ReactComponentGenerationResult, prepareReactExport } from "./a-1-prepare-react-export-common";
import { buildAttributeParts, buildRootAttributeParts, emitElementMarkup } from "./8-8-3-jsx-utils";

export function generateReactComponentWithMarkupParser(options: GenerateReactComponentOptions): ReactComponentGenerationResult {
    const preparedExport = prepareReactExport(options);

    try {
        const parsedDocument = new DOMParser().parseFromString(preparedExport.svgMarkup, "image/svg+xml");
        const parserError = parsedDocument.querySelector("parsererror");
        if (parserError) {
            throw new Error(parserError.textContent ?? "Failed to parse SVG markup.");
        }

        const svgElement = emitSvgElement(parsedDocument.documentElement, 1);
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
    } catch (error) {
        const fallbackResult = generateReactComponentFromTemplate(options);
        const message = error instanceof Error ? error.message : String(error);
        return {
            ...fallbackResult,
            notice: `The markup-parser generator fell back to the template generator. ${message}`,
        };
    }
}

function emitSvgElement(element: Element, depth: number): string {
    const attributes = [...element.attributes];
    const attributeParts = buildRootAttributeParts(attributes, "rest");

    return emitElementMarkup(element.tagName.toLowerCase(), attributeParts, [...element.children], depth, emitChildElement);
}

function emitChildElement(element: Element, depth: number): string {
    const attributeParts = buildAttributeParts([...element.attributes]);
    return emitElementMarkup(element.tagName.toLowerCase(), attributeParts, [...element.children], depth, emitChildElement);
}
