import { atom } from "jotai";
import { type SvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { pathViewBoxAtom } from "./2-2-path-viewbox";

interface SvgInputState {
    document: SvgInputDocument | null;
    selectedNodeId: string | null;
    parseError: string | null;
    boundPathNodeId: string | null;
}

export const svgInputStateAtom = atom<SvgInputState>({
    document: null,
    selectedNodeId: null,
    parseError: null,
    boundPathNodeId: null,
});

export const doSyncSvgInputBoundPathAtom = atom(
    null,
    (get, set, nextPath: string) => {
        const state = get(svgInputStateAtom);
        if (!state.document) {
            if (!nextPath.trim()) return;

            set(svgInputStateAtom, {
                document: createSvgDocumentWithPath(nextPath, get(pathViewBoxAtom)),
                selectedNodeId: "0.0",
                parseError: null,
                boundPathNodeId: "0.0",
            });
            return;
        }

        if (!state.boundPathNodeId) return;

        const nextRoot = replaceNodePathData(state.document.root, state.boundPathNodeId, nextPath);
        if (nextRoot === state.document.root) return;

        set(svgInputStateAtom, {
            ...state,
            document: {
                ...state.document,
                root: nextRoot,
            },
        });
    },
);

function createSvgDocumentWithPath(path: string, viewBox: ViewBox): SvgInputDocument {
    return {
        sourceKind: "svg-document",
        root: {
            id: "0",
            tagName: "svg",
            attributes: [
                { name: "xmlns", value: "http://www.w3.org/2000/svg" },
                { name: "viewBox", value: viewBox.join(" ") },
            ],
            children: [
                {
                    id: "0.0",
                    tagName: "path",
                    attributes: [{ name: "d", value: path }],
                    children: [],
                    pathData: path,
                },
            ],
            pathData: null,
        },
    };
}

function replaceNodePathData(node: SvgInputNode, nodeId: string, nextPath: string): SvgInputNode {
    if (node.id === nodeId) {
        if (node.pathData === null) return node;

        const nextAttributes = replacePathDataAttribute(node.attributes, nextPath);
        if (node.pathData === nextPath && nextAttributes === node.attributes) return node;

        return {
            ...node,
            attributes: nextAttributes,
            pathData: nextPath,
        };
    }

    let changed = false;
    const nextChildren = node.children.map(
        (child) => {
            const nextChild = replaceNodePathData(child, nodeId, nextPath);
            if (nextChild !== child) changed = true;
            return nextChild;
        }
    );

    if (!changed) return node;
    return {
        ...node,
        children: nextChildren,
    };
}

function replacePathDataAttribute(attributes: SvgInputNode["attributes"], nextPath: string) {
    let changed = false;
    let found = false;

    const nextAttributes = attributes.map((attribute) => {
        if (attribute.name !== "d") {
            return attribute;
        }

        found = true;
        if (attribute.value === nextPath) {
            return attribute;
        }

        changed = true;
        return {
            ...attribute,
            value: nextPath,
        };
    });

    if (!found) {
        return [...attributes, { name: "d", value: nextPath }];
    }

    return changed ? nextAttributes : attributes;
}
