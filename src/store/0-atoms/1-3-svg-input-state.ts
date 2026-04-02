import { atom } from "jotai";
import { type SvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";

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
        if (!state.document || !state.boundPathNodeId) return;

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
    const nextChildren = node.children.map((child) => {
        const nextChild = replaceNodePathData(child, nodeId, nextPath);
        if (nextChild !== child) changed = true;
        return nextChild;
    });

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
        if (attribute.name !== "d") return attribute;

        found = true;
        if (attribute.value === nextPath) return attribute;

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