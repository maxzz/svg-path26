import { type SvgInputNode } from "@/svg-core/3-svg-input";
import { prepareReactExport, type GenerateReactComponentOptions, type ReactComponentGenerationResult } from "./a-1-prepare-react-export-common";
import { emitElementMarkup, escapeJavaScriptString, formatJsxAttribute } from "./8-8-3-jsx-utils";

export function generateReactComponentFromTemplate(options: GenerateReactComponentOptions): ReactComponentGenerationResult {
    const preparedExport = prepareReactExport(options);
    const rootNode = preparedExport.exportDocument.root;

    const svgElement = emitSvgRoot(rootNode, 2);
    const code = [
        'import { type ComponentPropsWithoutRef } from "react";',
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
    const classAttribute = node.attributes.find((attribute) => attribute.name === "class")?.value ?? "";
    const otherAttributes = node.attributes.filter((attribute) => attribute.name !== "class");
    
    const attributeParts = [
        ...otherAttributes.map(
            (attribute) => formatJsxAttribute(attribute.name, attribute.value)
        ),
        classAttribute
            ? `className={className ? "${escapeJavaScriptString(classAttribute)} " + className : "${escapeJavaScriptString(classAttribute)}"}`
            : "className={className}",
        "{...rest}",
    ];

    return emitElementMarkup(node.tagName, attributeParts, node.children, depth, emitChildNode);
}

function emitChildNode(node: SvgInputNode, depth: number): string {
    const attributeParts = node.attributes.map(
        (attribute) => formatJsxAttribute(attribute.name, attribute.value)
    );
    return emitElementMarkup(node.tagName, attributeParts, node.children, depth, emitChildNode);
}
