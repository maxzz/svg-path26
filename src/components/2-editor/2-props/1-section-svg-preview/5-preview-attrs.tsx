import { type SvgInputAttribute, type SvgInputNode } from "@/svg-core/3-svg-input";

type PreviewOverrides = {
    showFill: boolean;
    showStroke: boolean;
    defaultStrokeColor: string;
    defaultStrokeWidth: number;
};

export function applyPreviewOverrides(node: SvgInputNode, options: PreviewOverrides): SvgInputNode {
    const attributes = updatePreviewAttributes(node.tagName, node.attributes, options);

    const children = node.children.map(
        (child) => applyPreviewOverrides(child, options)
    );
    
    return {
        ...node,
        attributes,
        children,
    };
}

function updatePreviewAttributes(tagName: string, attributes: SvgInputAttribute[], options: PreviewOverrides): SvgInputAttribute[] {
    const next = attributes.map((attribute) => ({ ...attribute }));

    const styleOverrides: string[] = [];
    const isStrokeTarget = PREVIEW_STROKE_TARGETS.has(tagName);
    const strokeValue = getStyleValue(next, "stroke") ?? getAttributeValue(next, "stroke");
    const strokeWidthValue = getStyleValue(next, "stroke-width") ?? getAttributeValue(next, "stroke-width");
    const strokeOpacityValue = getStyleValue(next, "stroke-opacity") ?? getAttributeValue(next, "stroke-opacity");

    if (!options.showFill) {
        upsertAttribute(next, "fill", "none");
        upsertAttribute(next, "fill-opacity", "0");
        styleOverrides.push("fill: none !important", "fill-opacity: 0 !important");
    }

    if (!options.showStroke) {
        upsertAttribute(next, "stroke", "none");
        upsertAttribute(next, "stroke-width", "0");
        upsertAttribute(next, "stroke-opacity", "0");
        styleOverrides.push("stroke: none !important", "stroke-width: 0 !important", "stroke-opacity: 0 !important");
    }
    else if (isStrokeTarget && shouldAddDefaultStroke(strokeValue)) {
        const needsStrokeWidth = !hasUsableStrokeWidth(strokeWidthValue);
        const needsStrokeOpacity = !hasUsableStrokeOpacity(strokeOpacityValue);
        upsertAttribute(next, "stroke", options.defaultStrokeColor);
        if (needsStrokeWidth) {
            upsertAttribute(next, "stroke-width", options.defaultStrokeWidth.toString());
        }
        if (needsStrokeOpacity) {
            upsertAttribute(next, "stroke-opacity", "1");
        }
        styleOverrides.push(
            `stroke: ${options.defaultStrokeColor} !important`,
            ...(needsStrokeWidth ? [`stroke-width: ${options.defaultStrokeWidth} !important`] : []),
            ...(needsStrokeOpacity ? ["stroke-opacity: 1 !important"] : [])
        );
    }

    if (styleOverrides.length > 0) {
        const existingStyle = getAttributeValue(next, "style") ?? "";
        upsertAttribute(next, "style", mergeStyleOverrides(existingStyle, styleOverrides));
    }

    return next;
}

function getAttributeValue(attributes: SvgInputAttribute[], name: string): string | undefined {
    const match = attributes.find((attribute) => attribute.name.toLowerCase() === name);
    return match?.value;
}

function upsertAttribute(attributes: SvgInputAttribute[], name: string, value: string) {
    const index = attributes.findIndex(
        (attribute) => attribute.name.toLowerCase() === name
    );
    if (index >= 0) {
        attributes[index] = { ...attributes[index], value };
        return;
    }
    attributes.push({ name, value });
}

function mergeStyleOverrides(existingStyle: string, overrides: string[]): string {
    const trimmed = existingStyle.trim();
    const suffix = overrides.join("; ");
    if (!trimmed) {
        return `${suffix};`;
    }
    const normalized = trimmed.endsWith(";") ? trimmed : `${trimmed};`;
    return `${normalized} ${suffix};`;
}

function getStyleValue(attributes: SvgInputAttribute[], name: string): string | undefined {
    const style = getAttributeValue(attributes, "style");
    if (!style) return undefined;

    const entries = style
        .split(";")
        .map((entry) => entry.trim())
        .filter(Boolean);

    for (const entry of entries) {
        const [property, ...rest] = entry.split(":");
        if (!property) continue;
        if (property.trim().toLowerCase() === name) {
            return rest.join(":").trim();
        }
    }
    return undefined;
}

function shouldAddDefaultStroke(strokeValue: string | undefined): boolean {
    if (!strokeValue) return true;
    const normalized = strokeValue.trim().toLowerCase();
    return normalized === "none" || normalized === "transparent";
}

function hasUsableStrokeWidth(value: string | undefined): boolean {
    if (!value) return false;
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return true;
    return numeric > 0;
}

function hasUsableStrokeOpacity(value: string | undefined): boolean {
    if (!value) return false;
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return true;
    return numeric > 0;
}

const PREVIEW_STROKE_TARGETS = new Set([
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
]);
