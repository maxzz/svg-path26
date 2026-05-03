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

// Build attribute parts

type JsxAttributeLike = {
    name: string;
    value: string;
};

/**
 * @example
 * ```tsx
 * buildRootAttributeParts([{ name: "class", value: "bg-red-500" }, { name: "data-testid", value: "test-id" }], "rest");
 * // => ["className={cn('bg-red-500', className)}", "{...rest}"]
 * ```
 */
export function buildRootAttributeParts(attributes: JsxAttributeLike[], restPropsName: string): string[] {
    const classAttribute = attributes.find((attribute) => attribute.name === "class")?.value ?? "";
    const otherAttributes = attributes.filter((attribute) => attribute.name !== "class");
    const baseClassName = classAttribute.trim();

    const classNameExpression =
        baseClassName
            ? `className={cn("${escapeJavaScriptString(baseClassName)}", className)}`
            : "className={cn(className)}";

    return [
        ...otherAttributes.map(
            (attribute) => formatJsxAttribute(attribute.name, attribute.value)
        ),
        classNameExpression,
        `{...${restPropsName}}`,
    ];
}

export function buildAttributeParts(attributes: JsxAttributeLike[]): string[] {
    return attributes.map(
        (attribute) => formatJsxAttribute(attribute.name, attribute.value)
    );
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

// Title line

export type TitleLineNode = { kind: "title-line"; };

export function withTitleLine<T>(children: T[]): (T | TitleLineNode)[] {
    return [{ kind: "title-line" }, ...children];
}

export function isTitleLineNode<T>(node: T | TitleLineNode): node is TitleLineNode {
    return typeof node === "object" && node !== null && "kind" in node && node.kind === "title-line";
}

export function renderTitleLine(depth: number): string {
    const indent = "    ".repeat(depth);
    return `${indent}{title && <title>{title}</title>}`;
}
