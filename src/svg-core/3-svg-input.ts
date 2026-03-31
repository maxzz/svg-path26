export interface SvgInputAttribute {
    name: string;
    value: string;
}

export interface SvgInputNode {
    id: string;
    tagName: string;
    attributes: SvgInputAttribute[];
    children: SvgInputNode[];
    pathData: string | null;
}

export interface SvgInputDocument {
    root: SvgInputNode;
    sourceKind: SvgInputSourceKind;
}

export type SvgInputSourceKind = "svg-document" | "svg-fragment" | "path-element" | "path-data";

export interface ParsedSvgInput {
    document: SvgInputDocument;
    initialSelectedNodeId: string;
    initialPathData: string | null;
}

export function parseSvgInputText(input: string): ParsedSvgInput {
    const text = input.replace(/^\uFEFF/, "").trim();
    if (!text) {
        throw new Error("Paste SVG markup, a <path> element, or path data.");
    }

    const standalonePathData = extractStandalonePathData(text);
    if (standalonePathData !== null) {
        const root = createSyntheticPathNode(standalonePathData);
        return {
            document: {
                root,
                sourceKind: "path-data",
            },
            initialSelectedNodeId: root.id,
            initialPathData: standalonePathData,
        };
    }

    const rootElement = parseSvgMarkup(text);
    const root = buildSvgInputNode(rootElement, "0");
    const sourceKind = getSourceKind(rootElement);

    return {
        document: {
            root,
            sourceKind,
        },
        initialSelectedNodeId: root.id,
        initialPathData: sourceKind === "path-element" ? root.pathData : null,
    };
}

export function findSvgInputNodeById(root: SvgInputNode, nodeId: string): SvgInputNode | null {
    if (root.id === nodeId) return root;

    for (const child of root.children) {
        const nested = findSvgInputNodeById(child, nodeId);
        if (nested) return nested;
    }

    return null;
}

function extractStandalonePathData(text: string): string | null {
    if (text.includes("<")) return null;

    const attributeMatch = text.match(/^d\s*=\s*(?:"([\s\S]*)"|'([\s\S]*)')$/i);
    if (attributeMatch) {
        return (attributeMatch[1] ?? attributeMatch[2] ?? "").trim();
    }

    if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
        return text.slice(1, -1).trim();
    }

    return text;
}

function parseSvgMarkup(text: string): Element {
    const document = new DOMParser().parseFromString(text, "image/svg+xml");
    const parserError = document.querySelector("parsererror");
    if (parserError) {
        throw new Error(normalizeParserError(parserError.textContent));
    }

    const root = document.documentElement;
    if (!root) {
        throw new Error("SVG input does not contain a root element.");
    }

    return root;
}

function normalizeParserError(text: string | null | undefined): string {
    const value = text?.trim();
    if (!value) {
        return "SVG markup could not be parsed.";
    }

    return value.replace(/\s+/g, " ");
}

function buildSvgInputNode(element: Element, id: string): SvgInputNode {
    const tagName = getElementTagName(element);

    return {
        id,
        tagName,
        attributes: [...element.attributes].map((attribute) => ({
            name: attribute.name,
            value: attribute.value,
        })),
        children: [...element.children].map((child, index) => buildSvgInputNode(child, `${id}.${index}`)),
        pathData: tagName === "path" ? element.getAttribute("d") : null,
    };
}

function createSyntheticPathNode(pathData: string): SvgInputNode {
    return {
        id: "0",
        tagName: "path",
        attributes: [{ name: "d", value: pathData }],
        children: [],
        pathData,
    };
}

function getSourceKind(element: Element): SvgInputSourceKind {
    const tagName = getElementTagName(element);
    if (tagName === "svg") return "svg-document";
    if (tagName === "path") return "path-element";
    return "svg-fragment";
}

function getElementTagName(element: Element): string {
    return (element.localName || element.tagName).toLowerCase();
}