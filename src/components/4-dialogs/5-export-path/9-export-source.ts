import { serializeSvgInputDocument, type SvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { type ExportSettings } from "@/store/9-ui-settings-types-and-defaults";

export type BuildExportSvgSourceOptions = {
    svgInputDocument: SvgInputDocument | null;
    pathValue: string;
    pathViewBox: ViewBox;
    exportViewBoxDraft: ViewBox;
    exportSettings: ExportSettings;
};

const STYLE_EXPORT_ATTRIBUTE_NAMES = new Set([
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

export function buildExportSvgDocument({ svgInputDocument, pathValue, pathViewBox, exportViewBoxDraft, exportSettings }: BuildExportSvgSourceOptions): SvgInputDocument {
    const baseDocument = svgInputDocument
        ? cloneIntoSvgDocument(svgInputDocument, exportViewBoxDraft)
        : createPathOnlySvgDocument(pathValue, pathViewBox);

    const expandedRoot = expandStyleAttributes(baseDocument.root);
    const rootWithViewBox = applySvgRootViewBox(expandedRoot, exportViewBoxDraft);

    return {
        sourceKind: "svg-document",
        root: applyPathStyleOverrides(rootWithViewBox, exportSettings),
    };
}

export function buildExportSvgData(options: BuildExportSvgSourceOptions): string {
    if (!options.svgInputDocument && !options.pathValue.trim()) {
        return "";
    }

    return serializeSvgInputDocument(buildExportSvgDocument(options));
}

function cloneIntoSvgDocument(document: SvgInputDocument, exportViewBoxDraft: ViewBox): SvgInputDocument {
    if (document.sourceKind === "svg-document" && document.root.tagName === "svg") {
        return {
            sourceKind: "svg-document",
            root: cloneNode(document.root),
        };
    }

    return wrapNodeInSvg(cloneNode(document.root), exportViewBoxDraft);
}

function createPathOnlySvgDocument(pathValue: string, pathViewBox: ViewBox): SvgInputDocument {
    return wrapNodeInSvg(
        {
            id: "0.0",
            tagName: "path",
            attributes: [{ name: "d", value: pathValue }],
            children: [],
            pathData: pathValue,
        },
        pathViewBox,
    );
}

function wrapNodeInSvg(node: SvgInputNode, viewBox: ViewBox): SvgInputDocument {
    return {
        sourceKind: "svg-document",
        root: {
            id: "0",
            tagName: "svg",
            attributes: [
                { name: "xmlns", value: "http://www.w3.org/2000/svg" },
                { name: "viewBox", value: viewBoxToAttributeValue(viewBox) },
            ],
            children: [node],
            pathData: null,
        },
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

function expandStyleAttributes(node: SvgInputNode): SvgInputNode {
    const nextChildren = node.children.map(expandStyleAttributes);
    const nextAttributes = extractSupportedStyleAttributes(node.attributes);

    if (nextChildren.every((child, index) => child === node.children[index]) && nextAttributes === node.attributes) {
        return node;
    }

    return {
        ...node,
        attributes: nextAttributes,
        children: nextChildren,
    };
}

function extractSupportedStyleAttributes(attributes: SvgInputNode["attributes"]): SvgInputNode["attributes"] {
    const styleAttribute = attributes.find((attribute) => attribute.name === "style");
    if (!styleAttribute) {
        return attributes;
    }

    let nextAttributes = attributes.filter((attribute) => attribute.name !== "style");
    const unsupportedDeclarations: string[] = [];

    for (const declaration of styleAttribute.value.split(";")) {
        const [rawName, ...rawValueParts] = declaration.split(":");
        const name = rawName?.trim().toLowerCase();
        const value = rawValueParts.join(":").trim();
        if (!name || !value) {
            continue;
        }

        if (STYLE_EXPORT_ATTRIBUTE_NAMES.has(name)) {
            nextAttributes = upsertAttribute(nextAttributes, name, value);
            continue;
        }

        unsupportedDeclarations.push(`${name}:${value}`);
    }

    if (unsupportedDeclarations.length > 0) {
        nextAttributes = upsertAttribute(nextAttributes, "style", `${unsupportedDeclarations.join(";")};`);
    }

    return nextAttributes;
}

function applySvgRootViewBox(root: SvgInputNode, exportViewBoxDraft: ViewBox): SvgInputNode {
    if (root.tagName !== "svg") {
        return root;
    }

    const nextAttributes = upsertAttribute(
        upsertAttribute(root.attributes, "xmlns", "http://www.w3.org/2000/svg"),
        "viewBox",
        viewBoxToAttributeValue(exportViewBoxDraft),
    );

    if (nextAttributes === root.attributes) {
        return root;
    }

    return {
        ...root,
        attributes: nextAttributes,
    };
}

function applyPathStyleOverrides(node: SvgInputNode, exportSettings: ExportSettings): SvgInputNode {
    const nextChildren = node.children.map((child) => applyPathStyleOverrides(child, exportSettings));
    const nextAttributes = node.tagName === "path"
        ? applySinglePathStyleOverrides(node.attributes, exportSettings)
        : node.attributes;

    if (nextChildren.every((child, index) => child === node.children[index]) && nextAttributes === node.attributes) {
        return node;
    }

    return {
        ...node,
        attributes: nextAttributes,
        children: nextChildren,
        pathData: node.tagName === "path" ? getAttributeValue(nextAttributes, "d") ?? node.pathData : node.pathData,
    };
}

function applySinglePathStyleOverrides(attributes: SvgInputNode["attributes"], exportSettings: ExportSettings): SvgInputNode["attributes"] {
    let nextAttributes = attributes;

    nextAttributes = upsertAttribute(nextAttributes, "fill", exportSettings.exportFill ? exportSettings.exportFillColor : "none");
    nextAttributes = upsertAttribute(nextAttributes, "stroke", exportSettings.exportStroke ? exportSettings.exportStrokeColor : "none");

    if (exportSettings.exportStroke) {
        nextAttributes = upsertAttribute(nextAttributes, "stroke-width", String(exportSettings.exportStrokeWidth));
    } else {
        nextAttributes = removeAttribute(nextAttributes, "stroke-width");
    }

    return nextAttributes;
}

function getAttributeValue(attributes: SvgInputNode["attributes"], name: string): string | null {
    return attributes.find((attribute) => attribute.name === name)?.value ?? null;
}

function upsertAttribute(attributes: SvgInputNode["attributes"], name: string, value: string): SvgInputNode["attributes"] {
    let didChange = false;
    let didFind = false;

    const nextAttributes = attributes.map(
        (attribute) => {
            if (attribute.name !== name) {
                return attribute;
            }

            didFind = true;
            if (attribute.value === value) {
                return attribute;
            }

            didChange = true;
            return { ...attribute, value };
        }
    );

    if (!didFind) {
        return [...attributes, { name, value }];
    }

    return didChange ? nextAttributes : attributes;
}

function removeAttribute(attributes: SvgInputNode["attributes"], name: string): SvgInputNode["attributes"] {
    const nextAttributes = attributes.filter((attribute) => attribute.name !== name);
    return nextAttributes.length === attributes.length ? attributes : nextAttributes;
}

function viewBoxToAttributeValue(viewBox: ViewBox): string {
    const width = Math.max(1e-6, viewBox[2]);
    const height = Math.max(1e-6, viewBox[3]);
    return `${viewBox[0]} ${viewBox[1]} ${width} ${height}`;
}