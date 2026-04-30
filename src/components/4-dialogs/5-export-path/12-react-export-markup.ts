import { generateReactComponentFromTemplate } from "./11-react-export-template";
import { prepareReactExport, type GenerateReactComponentOptions, type ReactComponentGenerationResult } from "./10-react-export-common";

export function generateReactComponentWithMarkupParser(options: GenerateReactComponentOptions): ReactComponentGenerationResult {
    const preparedExport = prepareReactExport(options);

    if (typeof DOMParser === "undefined") {
        return {
            ...generateReactComponentFromTemplate(options),
            notice: "DOMParser is not available in this runtime. Used the template generator instead.",
        };
    }

    try {
        const parsedDocument = new DOMParser().parseFromString(preparedExport.svgMarkup, "image/svg+xml");
        const parserError = parsedDocument.querySelector("parsererror");
        if (parserError) {
            throw new Error(parserError.textContent ?? "Failed to parse SVG markup.");
        }

        return {
            code: [
                'import type { ComponentPropsWithoutRef } from "react";',
                "",
                `const ${preparedExport.componentName} = ({ className, ...props }: ComponentPropsWithoutRef<"svg">) => (`,
                emitSvgElement(parsedDocument.documentElement, 1),
                ");",
                "",
                `export default ${preparedExport.componentName};`,
            ].join("\n"),
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
    const classAttribute = attributes.find((attribute) => attribute.name === "class")?.value ?? "";
    const otherAttributes = attributes.filter((attribute) => attribute.name !== "class");
    const attributeParts = [
        ...otherAttributes.map((attribute) => formatJsxAttribute(attribute.name, attribute.value)),
        classAttribute
            ? `className={className ? "${escapeJavaScriptString(classAttribute)} " + className : "${escapeJavaScriptString(classAttribute)}"}`
            : "className={className}",
        "{...props}",
    ];

    return emitElementMarkup(element.tagName.toLowerCase(), attributeParts, [...element.children], depth, emitChildElement);
}

function emitChildElement(element: Element, depth: number): string {
    const attributeParts = [...element.attributes].map((attribute) => formatJsxAttribute(attribute.name, attribute.value));
    return emitElementMarkup(element.tagName.toLowerCase(), attributeParts, [...element.children], depth, emitChildElement);
}

function emitElementMarkup(tagName: string, attributeParts: string[], children: Element[], depth: number, emitChild: (element: Element, depth: number) => string): string {
    const indent = "    ".repeat(depth);
    const joinedAttributes = attributeParts.length > 0 ? ` ${attributeParts.join(" ")}` : "";

    if (children.length === 0) {
        return `${indent}<${tagName}${joinedAttributes} />`;
    }

    const renderedChildren = children.map((child) => emitChild(child, depth + 1)).join("\n");
    return `${indent}<${tagName}${joinedAttributes}>\n${renderedChildren}\n${indent}</${tagName}>`;
}

function formatJsxAttribute(name: string, value: string): string {
    return `${normalizeJsxAttributeName(name)}="${escapeJsxAttributeValue(value)}"`;
}

function normalizeJsxAttributeName(name: string): string {
    if (name === "class") {
        return "className";
    }

    if (name.startsWith("aria-") || name.startsWith("data-")) {
        return name;
    }

    return name.replace(/[:\-]([a-z])/g, (_match, char: string) => char.toUpperCase());
}

function escapeJsxAttributeValue(value: string): string {
    return value.replace(/"/g, "&quot;");
}

function escapeJavaScriptString(value: string): string {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}