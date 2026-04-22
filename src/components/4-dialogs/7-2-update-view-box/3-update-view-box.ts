import { atom } from "jotai";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { type SvgInputAttribute, type SvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { notice } from "@/components/ui/loacal-ui/7-toaster";
import { appSettings } from "@/store/0-ui-settings";
import { doCommitCurrentPathToHistoryAtom, doSetPathWithoutHistoryAtom } from "@/store/0-atoms/1-2-history";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { svgInputDocumentAtom } from "@/store/0-atoms/1-3-svg-input";
import { svgInputStateAtom } from "@/store/0-atoms/1-3-svg-input-state";
import { doSetPathViewBoxAtom, pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";

type UpdateViewBoxArgs = {
    nextViewBox: ViewBox;
    scaleSvgElements: boolean;
};

type ViewBoxTransform = {
    scaleX: number;
    scaleY: number;
    translateX: number;
    translateY: number;
};

const VIEWBOX_EPS = 1e-9;

export const doUpdateViewBoxAtom = atom(
    null,
    (get, set, args: UpdateViewBoxArgs) => {
        const currentViewBox = get(pathViewBoxAtom);
        const nextViewBox = sanitizeViewBox(args.nextViewBox);

        if (!nextViewBox) {
            notice.info("Enter a valid viewBox with positive width and height.");
            return false;
        }

        const shouldScale = Boolean(args.scaleSvgElements);
        const isSameViewBox = areViewBoxesEqual(currentViewBox, nextViewBox);
        if (isSameViewBox && !shouldScale) {
            return true;
        }

        const currentPath = get(svgPathInputAtom);
        const currentDocument = get(svgInputDocumentAtom);
        let transform: ViewBoxTransform | null = null;
        let nextPath: string | null = null;

        if (shouldScale) {
            transform = createViewBoxTransform(currentViewBox, nextViewBox);
            if (!transform) {
                notice.info("The current or next viewBox is invalid.");
                return false;
            }

            if (currentPath.trim()) {
                nextPath = transformPathData(currentPath, transform);
                if (nextPath === null) {
                    notice.info("The current path could not be scaled to the new viewBox.");
                    return false;
                }
            }
        }

        appSettings.canvas.showViewBoxFrame = true;
        set(doSetPathViewBoxAtom, nextViewBox);

        if (nextPath !== null) {
            set(doSetPathWithoutHistoryAtom, nextPath);
            set(doCommitCurrentPathToHistoryAtom, currentPath);
        }

        if (currentDocument) {
            const nextDocument = shouldScale && transform
                ? updateDocumentForViewBox(currentDocument, nextViewBox, transform)
                : updateDocumentRootViewBox(currentDocument, nextViewBox);

            set(svgInputStateAtom, {
                ...get(svgInputStateAtom),
                document: nextDocument,
            });
        }

        return true;
    },
);

function sanitizeViewBox(viewBox: ViewBox): ViewBox | null {
    const [x, y, width, height] = viewBox;
    if (![x, y, width, height].every((value) => Number.isFinite(value))) {
        return null;
    }
    if (width <= 0 || height <= 0) {
        return null;
    }
    return [x, y, Math.max(1e-3, width), Math.max(1e-3, height)];
}

function areViewBoxesEqual(left: ViewBox, right: ViewBox) {
    return left.every((value, index) => Math.abs(value - right[index]) < VIEWBOX_EPS);
}

function createViewBoxTransform(previous: ViewBox, next: ViewBox): ViewBoxTransform | null {
    const previousWidth = previous[2];
    const previousHeight = previous[3];
    if (previousWidth <= 0 || previousHeight <= 0) {
        return null;
    }

    const scaleX = next[2] / previousWidth;
    const scaleY = next[3] / previousHeight;

    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
        return null;
    }

    return {
        scaleX,
        scaleY,
        translateX: next[0] - previous[0] * scaleX,
        translateY: next[1] - previous[1] * scaleY,
    };
}

function transformPathData(path: string, transform: ViewBoxTransform): string | null {
    try {
        const model = new SvgPathModel(path);
        model.scale(transform.scaleX, transform.scaleY);
        model.translate(transform.translateX, transform.translateY);
        const { decimals, minifyOutput } = appSettings.pathEditor;
        return model.toString(decimals, minifyOutput);
    } catch {
        return null;
    }
}

function updateDocumentForViewBox(document: SvgInputDocument, nextViewBox: ViewBox, transform: ViewBoxTransform): SvgInputDocument {
    const nextRoot = transformNode(document.root, transform, true);
    const rootWithViewBox = nextRoot.tagName === "svg"
        ? setNodeAttribute(nextRoot, "viewBox", nextViewBox.join(" "))
        : nextRoot;

    return rootWithViewBox === document.root
        ? document
        : { ...document, root: rootWithViewBox };
}

function updateDocumentRootViewBox(document: SvgInputDocument, nextViewBox: ViewBox): SvgInputDocument {
    if (document.root.tagName !== "svg") {
        return document;
    }

    const nextRoot = setNodeAttribute(document.root, "viewBox", nextViewBox.join(" "));
    if (nextRoot === document.root) {
        return document;
    }

    return { ...document, root: nextRoot };
}

function transformNode(node: SvgInputNode, transform: ViewBoxTransform, isRoot: boolean): SvgInputNode {
    const nextChildren = node.children.map((child) => transformNode(child, transform, false));
    const childrenChanged = nextChildren.some((child, index) => child !== node.children[index]);

    let nextNode = childrenChanged ? { ...node, children: nextChildren } : node;
    nextNode = transformNodeAttributes(nextNode, transform, isRoot);

    if (nextNode.pathData !== null) {
        const nextPathData = transformPathData(nextNode.pathData, transform);
        if (nextPathData && nextPathData !== nextNode.pathData) {
            const withAttribute = setNodeAttribute(nextNode, "d", nextPathData);
            nextNode = withAttribute === nextNode ? { ...nextNode, pathData: nextPathData } : { ...withAttribute, pathData: nextPathData };
        }
    }

    return nextNode;
}

function transformNodeAttributes(node: SvgInputNode, transform: ViewBoxTransform, isRoot: boolean): SvgInputNode {
    const attributes = node.attributes;
    let nextAttributes = attributes;

    switch (node.tagName) {
        case "svg":
            if (!isRoot) {
                nextAttributes = transformSvgLikeAttributes(nextAttributes, transform);
            }
            break;
        case "g":
            nextAttributes = transformSvgLikeAttributes(nextAttributes, transform);
            break;
        case "path":
            break;
        case "rect":
        case "image":
            nextAttributes = transformRectLikeAttributes(nextAttributes, transform);
            break;
        case "circle":
            nextAttributes = transformCircleAttributes(nextAttributes, transform);
            break;
        case "ellipse":
            nextAttributes = transformEllipseAttributes(nextAttributes, transform);
            break;
        case "line":
            nextAttributes = transformLineAttributes(nextAttributes, transform);
            break;
        case "text":
        case "tspan":
            nextAttributes = transformTextAttributes(nextAttributes, transform);
            break;
        case "polyline":
        case "polygon":
            nextAttributes = transformPointsAttributes(nextAttributes, transform);
            break;
        default:
            break;
    }

    nextAttributes = transformPresentationAttributes(nextAttributes, transform);

    return nextAttributes === attributes ? node : { ...node, attributes: nextAttributes };
}

function transformSvgLikeAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    return transformLengthAttributes(attributes, transform, [
        { name: "x", axis: "x" },
        { name: "y", axis: "y" },
        { name: "width", axis: "width" },
        { name: "height", axis: "height" },
    ]);
}

function transformRectLikeAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    return transformLengthAttributes(attributes, transform, [
        { name: "x", axis: "x" },
        { name: "y", axis: "y" },
        { name: "width", axis: "width" },
        { name: "height", axis: "height" },
        { name: "rx", axis: "width" },
        { name: "ry", axis: "height" },
    ]);
}

function transformCircleAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    return transformLengthAttributes(attributes, transform, [
        { name: "cx", axis: "x" },
        { name: "cy", axis: "y" },
        { name: "r", axis: "radius" },
    ]);
}

function transformEllipseAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    return transformLengthAttributes(attributes, transform, [
        { name: "cx", axis: "x" },
        { name: "cy", axis: "y" },
        { name: "rx", axis: "width" },
        { name: "ry", axis: "height" },
    ]);
}

function transformLineAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    return transformLengthAttributes(attributes, transform, [
        { name: "x1", axis: "x" },
        { name: "y1", axis: "y" },
        { name: "x2", axis: "x" },
        { name: "y2", axis: "y" },
    ]);
}

function transformTextAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    return transformLengthAttributes(attributes, transform, [
        { name: "x", axis: "x" },
        { name: "y", axis: "y" },
        { name: "dx", axis: "width" },
        { name: "dy", axis: "height" },
    ]);
}

function transformPresentationAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    return transformLengthAttributes(attributes, transform, [
        { name: "stroke-width", axis: "radius" },
        { name: "font-size", axis: "radius" },
    ]);
}

function transformPointsAttributes(attributes: SvgInputAttribute[], transform: ViewBoxTransform) {
    const points = getAttributeValue(attributes, "points");
    if (!points) {
        return attributes;
    }

    const values = points.trim().split(/[\s,]+/).map((part) => Number(part));
    if (!values.length || values.some((value) => !Number.isFinite(value))) {
        return attributes;
    }

    const nextValues = values.map((value, index) => index % 2 === 0
        ? transformCoordinate(value, transform, "x")
        : transformCoordinate(value, transform, "y"));
    const nextPoints = nextValues.join(" ");

    return nextPoints === points ? attributes : setAttributesValue(attributes, "points", nextPoints);
}

function transformLengthAttributes(
    attributes: SvgInputAttribute[],
    transform: ViewBoxTransform,
    specs: Array<{ name: string; axis: "x" | "y" | "width" | "height" | "radius"; }>,
) {
    let nextAttributes = attributes;

    for (const spec of specs) {
        const value = getAttributeValue(nextAttributes, spec.name);
        if (value === undefined) {
            continue;
        }

        const transformed = transformNumericAttribute(value, transform, spec.axis);
        if (transformed === null || transformed === value) {
            continue;
        }

        nextAttributes = setAttributesValue(nextAttributes, spec.name, transformed);
    }

    return nextAttributes;
}

function transformNumericAttribute(
    rawValue: string,
    transform: ViewBoxTransform,
    axis: "x" | "y" | "width" | "height" | "radius",
) {
    const match = rawValue.trim().match(/^(-?\d*\.?\d+(?:e[+-]?\d+)?)(.*)$/i);
    if (!match) {
        return null;
    }

    const numeric = Number(match[1]);
    if (!Number.isFinite(numeric)) {
        return null;
    }

    const suffix = match[2] ?? "";
    const nextNumeric = transformCoordinate(numeric, transform, axis);
    return `${formatNumber(nextNumeric)}${suffix}`;
}

function transformCoordinate(
    value: number,
    transform: ViewBoxTransform,
    axis: "x" | "y" | "width" | "height" | "radius",
) {
    switch (axis) {
        case "x":
            return value * transform.scaleX + transform.translateX;
        case "y":
            return value * transform.scaleY + transform.translateY;
        case "width":
            return value * transform.scaleX;
        case "height":
            return value * transform.scaleY;
        case "radius":
            return value * Math.min(transform.scaleX, transform.scaleY);
        default:
            return value;
    }
}

function formatNumber(value: number) {
    const decimals = appSettings.pathEditor.decimals;
    const rounded = Number(value.toFixed(decimals));
    return `${rounded}`;
}

function getAttributeValue(attributes: SvgInputAttribute[], name: string) {
    return attributes.find((attribute) => attribute.name.toLowerCase() === name.toLowerCase())?.value;
}

function setAttributesValue(attributes: SvgInputAttribute[], name: string, value: string) {
    let changed = false;
    let found = false;

    const nextAttributes = attributes.map((attribute) => {
        if (attribute.name.toLowerCase() !== name.toLowerCase()) {
            return attribute;
        }

        found = true;
        if (attribute.value === value) {
            return attribute;
        }

        changed = true;
        return { ...attribute, value };
    });

    if (!found) {
        return [...attributes, { name, value }];
    }

    return changed ? nextAttributes : attributes;
}

function setNodeAttribute(node: SvgInputNode, name: string, value: string): SvgInputNode {
    const nextAttributes = setAttributesValue(node.attributes, name, value);
    return nextAttributes === node.attributes ? node : { ...node, attributes: nextAttributes };
}