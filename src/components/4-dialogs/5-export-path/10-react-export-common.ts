import { serializeSvgInputDocument, type SvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { normalizeExportFileBaseName } from "./7-export-utils";

export type GenerateReactComponentOptions = {
    exportDocument: SvgInputDocument;
    pathName: string;
};

export type PreparedReactExport = {
    componentName: string;
    exportDocument: SvgInputDocument;
    fileBaseName: string;
    svgMarkup: string;
};

export type ReactComponentGenerationResult = {
    code: string;
    componentName: string;
    error: string;
    fileName: string;
    notice?: string;
};

const PRESENTATIONAL_ATTR_NAMES = new Set([
    "clip-rule",
    "fill",
    "fill-opacity",
    "fill-rule",
    "opacity",
    "stroke",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-opacity",
    "stroke-width",
    "vector-effect",
]);

export function prepareReactExport({ exportDocument, pathName }: GenerateReactComponentOptions): PreparedReactExport {
    const clonedDocument = cloneDocument(exportDocument);
    const hoistedRoot = hoistSharedPathAttributes(clonedDocument.root);
    const classedRoot = convertSvgAttributesToTailwindClasses(hoistedRoot);
    const normalizedDocument: SvgInputDocument = {
        ...clonedDocument,
        root: classedRoot,
    };
    const fileBaseName = normalizeExportFileBaseName(pathName);

    return {
        componentName: toPascalCaseComponentName(fileBaseName),
        exportDocument: normalizedDocument,
        fileBaseName,
        svgMarkup: serializeSvgInputDocument(normalizedDocument),
    };
}

function cloneDocument(document: SvgInputDocument): SvgInputDocument {
    return {
        sourceKind: document.sourceKind,
        root: cloneNode(document.root),
    };
}

function cloneNode(node: SvgInputNode): SvgInputNode {
    return {
        id: node.id,
        tagName: node.tagName,
        attributes: node.attributes.map((attribute) => ({ ...attribute })),
        children: node.children.map(cloneNode),
        pathData: node.pathData,
    };
}

function hoistSharedPathAttributes(root: SvgInputNode): SvgInputNode {
    if (root.tagName !== "svg") {
        return root;
    }

    const pathNodes = collectDescendantPathNodes(root);
    if (pathNodes.length === 0) {
        return root;
    }

    if (!documentContainsOnlyPaths(root)) {
        return root;
    }

    const sharedAttributes = findSharedPathAttributes(pathNodes);
    if (sharedAttributes.length === 0) {
        return root;
    }

    return {
        ...root,
        attributes: sharedAttributes.reduce(
            (attributes, attribute) => upsertAttribute(attributes, attribute.name, attribute.value),
            root.attributes,
        ),
        children: root.children.map((child) => removeSharedPathAttributes(child, sharedAttributes)),
    };
}

function collectDescendantPathNodes(node: SvgInputNode): SvgInputNode[] {
    const descendants = node.children.flatMap(collectDescendantPathNodes);
    return node.tagName === "path" ? [node, ...descendants] : descendants;
}

function documentContainsOnlyPaths(node: SvgInputNode): boolean {
    for (const child of node.children) {
        if (child.tagName !== "path") {
            return false;
        }
        if (!documentContainsOnlyPaths(child)) {
            return false;
        }
    }

    return true;
}

function findSharedPathAttributes(pathNodes: SvgInputNode[]): SvgInputNode["attributes"] {
    const firstNode = pathNodes[0];
    if (!firstNode) {
        return [];
    }

    return firstNode.attributes.filter(
        (attribute) => (
            PRESENTATIONAL_ATTR_NAMES.has(attribute.name)
            && pathNodes.every((pathNode) => getAttributeValue(pathNode.attributes, attribute.name) === attribute.value)
        )
    );
}

function removeSharedPathAttributes(node: SvgInputNode, sharedAttributes: SvgInputNode["attributes"]): SvgInputNode {
    if (node.tagName === "path") {
        return {
            ...node,
            attributes: node.attributes.filter(
                (attribute) => !sharedAttributes.some((sharedAttribute) => sharedAttribute.name === attribute.name)
            ),
        };
    }

    return {
        ...node,
        children: node.children.map((child) => removeSharedPathAttributes(child, sharedAttributes)),
    };
}

function convertSvgAttributesToTailwindClasses(node: SvgInputNode): SvgInputNode {
    const nextChildren = node.children.map(convertSvgAttributesToTailwindClasses);
    const nextAttributes = convertNodeAttributesToTailwindClasses(node.attributes);

    if (nextChildren.every((child, index) => child === node.children[index]) && nextAttributes === node.attributes) {
        return node;
    }

    return {
        ...node,
        attributes: nextAttributes,
        children: nextChildren,
    };
}

function convertNodeAttributesToTailwindClasses(attributes: SvgInputNode["attributes"]): SvgInputNode["attributes"] {
    const classNames = new Set<string>();
    const nextAttributes: SvgInputNode["attributes"] = [];

    for (const attribute of attributes) {
        if (attribute.name === "class") {
            for (const className of attribute.value.split(/\s+/)) {
                if (className) {
                    classNames.add(className);
                }
            }
            continue;
        }

        if (attribute.name === "style") {
            for (const className of convertStyleAttributeToTailwindClasses(attribute.value)) {
                classNames.add(className);
            }
            continue;
        }

        if (PRESENTATIONAL_ATTR_NAMES.has(attribute.name)) {
            const className = convertPresentationalAttributeToTailwindClass(attribute.name, attribute.value);
            if (className) {
                classNames.add(className);
                continue;
            }
        }

        nextAttributes.push(attribute);
    }

    if (classNames.size > 0) {
        nextAttributes.push({
            name: "class",
            value: [...classNames].join(" "),
        });
    }

    return nextAttributes;
}

function convertStyleAttributeToTailwindClasses(value: string): string[] {
    return value
        .split(";")
        .map((declaration) => {
            const [rawName, ...rawValueParts] = declaration.split(":");
            const name = rawName?.trim().toLowerCase();
            const declarationValue = rawValueParts.join(":").trim();
            if (!name || !declarationValue) {
                return null;
            }

            return convertPresentationalAttributeToTailwindClass(name, declarationValue)
                ?? `[${name}:${encodeTailwindArbitraryValue(declarationValue)}]`;
        })
        .filter((className): className is string => Boolean(className));
}

function convertPresentationalAttributeToTailwindClass(name: string, value: string): string | null {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    if (name === "fill") {
        if (trimmedValue === "none") {
            return "fill-none";
        }
        if (trimmedValue === "currentColor" || trimmedValue === "current") {
            return "fill-current";
        }
    }

    if (name === "stroke") {
        if (trimmedValue === "none") {
            return "stroke-none";
        }
        if (trimmedValue === "currentColor" || trimmedValue === "current") {
            return "stroke-current";
        }
    }

    return `[${name}:${encodeTailwindArbitraryValue(trimmedValue)}]`;
}

function encodeTailwindArbitraryValue(value: string): string {
    return value.trim().replace(/\s+/g, "_");
}

function getAttributeValue(attributes: SvgInputNode["attributes"], name: string): string | null {
    return attributes.find((attribute) => attribute.name === name)?.value ?? null;
}

function upsertAttribute(attributes: SvgInputNode["attributes"], name: string, value: string): SvgInputNode["attributes"] {
    let didFind = false;

    const nextAttributes = attributes.map(
        (attribute) => {
            if (attribute.name !== name) {
                return attribute;
            }

            didFind = true;
            return attribute.value === value ? attribute : { ...attribute, value };
        }
    );

    return didFind ? nextAttributes : [...attributes, { name, value }];
}

function toPascalCaseComponentName(fileBaseName: string): string {
    const words = fileBaseName
        .split("-")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    const baseName = words.join("") || "SvgPath";
    return /^[A-Z_]/.test(baseName) ? baseName : `Svg${baseName}`;
}