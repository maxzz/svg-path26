import { appSettings } from "@/store/0-ui-settings";

type SvgElementNode = {
    tagName: string;
    attributes: Record<string, string>;
    children: SvgElementNode[];
};

export function exportReactComponentToFile({ svgData }: { svgData: string; }): boolean {
    if (!svgData.trim()) {
        return false;
    }

    const svgNode = parseSvgData(svgData);
    if (!svgNode) {
        console.error("Failed to parse SVG data for React export.");
        return false;
    }

    const componentName = toComponentName(appSettings.pathEditor.pathName);
    const fileBaseName = toFileBaseName(appSettings.pathEditor.pathName);
    const componentSource = buildReactComponentSource(svgNode, componentName);

    return downloadReactComponentFile({ componentSource, fileBaseName });
}

function parseSvgData(svgData: string): SvgElementNode | null {
    if (typeof DOMParser === "undefined") {
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, "image/svg+xml");
    if (doc.querySelector("parsererror")) {
        return null;
    }

    const svgElement = doc.querySelector("svg");
    if (!svgElement) {
        return null;
    }

    return elementToNode(svgElement);
}

function elementToNode(element: Element): SvgElementNode {
    const attributes = Array.from(element.attributes).reduce<Record<string, string>>(
        (acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
        },
        {}
    );
    const children = Array.from(element.children).map(elementToNode);

    return {
        tagName: element.tagName.toLowerCase(),
        attributes,
        children,
    };
}

function buildReactComponentSource(svgNode: SvgElementNode, componentName: string): string {
    const svgMarkup = renderSvgNode(svgNode, 2, true);

    return [
        "import * as React from \"react\";",
        "",
        `export function ${componentName}(props: React.SVGProps<SVGSVGElement>) {`,
        "    return (",
        svgMarkup,
        "    );",
        "}",
        "",
        `export default ${componentName};`,
        "",
    ].join("\n");
}

function renderSvgNode(node: SvgElementNode, depth: number, includeProps = false): string {
    const indent = " ".repeat(depth * 4);
    const attributes = formatAttributes(node.attributes);
    const propsAttribute = includeProps ? "{...props}" : "";
    const attributeBlock = [attributes, propsAttribute].filter(Boolean).join(" ");
    const openTag = `<${node.tagName}${attributeBlock ? " " + attributeBlock : ""}`;

    if (!node.children.length) {
        return `${indent}${openTag} />`;
    }

    const children = node.children.map((child) => renderSvgNode(child, depth + 1)).join("\n");
    return `${indent}${openTag}>\n${children}\n${indent}</${node.tagName}>`;
}

function formatAttributes(attributes: Record<string, string>): string {
    return Object.entries(attributes)
        .map(([name, value]) => `${toJsxAttributeName(name)}="${escapeJsxAttribute(value)}"`)
        .join(" ");
}

function toJsxAttributeName(name: string): string {
    if (name === "class") {
        return "className";
    }

    if (name.startsWith("aria-") || name.startsWith("data-")) {
        return name;
    }

    return name.replace(/[-:]+(.)?/g, (_, chr: string) => (chr ? chr.toUpperCase() : ""));
}

function escapeJsxAttribute(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function toComponentName(pathName: string): string {
    const raw = pathName.trim();
    const tokens = raw ? raw.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/) : [];
    const baseName = tokens.map((token) => (token ? token[0].toUpperCase() + token.slice(1) : "")).join("");
    const fallback = baseName || "SvgPath";

    return /^[A-Za-z_]/.test(fallback) ? fallback : `Svg${fallback}`;
}

function toFileBaseName(pathName: string): string {
    const raw = pathName.trim() || "svg-path";
    const normalized = raw
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    return normalized || "svg-path";
}

function downloadReactComponentFile({ componentSource, fileBaseName }: { componentSource: string; fileBaseName: string; }): boolean {
    if (!componentSource.trim()) {
        return false;
    }

    const blob = new Blob([componentSource], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBaseName}.tsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 200);
    return true;
}
