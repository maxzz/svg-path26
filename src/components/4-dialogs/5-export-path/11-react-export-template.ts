import { type SvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { prepareReactExport, type GenerateReactComponentOptions, type ReactComponentGenerationResult } from "./10-react-export-common";

export function generateReactComponentFromTemplate(options: GenerateReactComponentOptions): ReactComponentGenerationResult {
    const preparedExport = prepareReactExport(options);
    const rootNode = preparedExport.exportDocument.root;

    return {
        code: [
            'import type { ComponentPropsWithoutRef } from "react";',
            "",
            `export function ${preparedExport.componentName}({ className, ...props }: ComponentPropsWithoutRef<"svg">) {`,
            "    return (",
            emitSvgRoot(rootNode, 2),
            "    );",
            "}",
            "",
            `export default ${preparedExport.componentName};`,
        ].join("\n"),
        componentName: preparedExport.componentName,
        error: "",
        fileName: `${preparedExport.fileBaseName}.tsx`,
    };
}

function emitSvgRoot(node: SvgInputNode, depth: number): string {
    const classAttribute = node.attributes.find((attribute) => attribute.name === "class")?.value ?? "";
    const otherAttributes = node.attributes.filter((attribute) => attribute.name !== "class");
    const attributeParts = [
        ...otherAttributes.map((attribute) => formatJsxAttribute(attribute.name, attribute.value)),
        classAttribute
            ? `className={className ? "${escapeJavaScriptString(classAttribute)} " + className : "${escapeJavaScriptString(classAttribute)}"}`
            : "className={className}",
        "{...props}",
    ];

    return emitNodeMarkup(node.tagName, attributeParts, node.children, depth, emitChildNode);
}

function emitChildNode(node: SvgInputNode, depth: number): string {
    const attributeParts = node.attributes.map((attribute) => formatJsxAttribute(attribute.name, attribute.value));
    return emitNodeMarkup(node.tagName, attributeParts, node.children, depth, emitChildNode);
}

function emitNodeMarkup(tagName: string, attributeParts: string[], children: SvgInputDocument["root"]["children"], depth: number, emitChild: (node: SvgInputNode, depth: number) => string): string {
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