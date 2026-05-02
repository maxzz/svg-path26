export function emitElementMarkup<T>(
    tagName: string,
    attributeParts: string[],
    children: T[],
    depth: number,
    emitChild: (child: T, depth: number) => string
): string {
    const indent = "    ".repeat(depth);
    const joinedAttributes = attributeParts.length > 0 ? ` ${attributeParts.join(" ")}` : "";

    if (children.length === 0) {
        return `${indent}<${tagName}${joinedAttributes} />`;
    }

    const renderedChildren = children.map((child) => emitChild(child, depth + 1)).join("\n");
    return `${indent}<${tagName}${joinedAttributes}>\n${renderedChildren}\n${indent}</${tagName}>`;
}

export function formatJsxAttribute(name: string, value: string): string {
    return `${normalizeJsxAttributeName(name)}="${escapeJsxAttributeValue(value)}"`;
}

export function normalizeJsxAttributeName(name: string): string {
    if (name === "class") {
        return "className";
    }

    if (name.startsWith("aria-") || name.startsWith("data-")) {
        return name;
    }

    return name.replace(/[:\-]([a-z])/g, (_match, char: string) => char.toUpperCase());
}

export function escapeJsxAttributeValue(value: string): string {
    return value.replace(/"/g, "&quot;");
}

export function escapeJavaScriptString(value: string): string {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

// Build attribute parts

type JsxAttributeLike = {
    name: string;
    value: string;
};

export function buildRootAttributeParts(attributes: JsxAttributeLike[], restPropsName: string): string[] {
    const classAttribute = attributes.find((attribute) => attribute.name === "class")?.value ?? "";
    const otherAttributes = attributes.filter((attribute) => attribute.name !== "class");

    return [
        ...otherAttributes.map((attribute) => formatJsxAttribute(attribute.name, attribute.value)),
        classAttribute
            ? `className={className ? "${escapeJavaScriptString(classAttribute)} " + className : "${escapeJavaScriptString(classAttribute)}"}`
            : "className={className}",
        `{...${restPropsName}}`,
    ];
}

export function buildAttributeParts(attributes: JsxAttributeLike[]): string[] {
    return attributes.map((attribute) => formatJsxAttribute(attribute.name, attribute.value));
}
