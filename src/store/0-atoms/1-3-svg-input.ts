import { atom } from "jotai";
import { findSvgInputNodeById, parseSvgInputText, type SvgInputDocument, type SvgInputNode } from "@/svg-core/3-svg-input";
import { rawPathAtom } from "./1-0-raw-path";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { svgInputStateAtom } from "./1-3-svg-input-state";

export const svgInputDocumentAtom = atom(
    (get) => get(svgInputStateAtom).document,
);

export const svgInputSelectedNodeIdAtom = atom(
    (get) => get(svgInputStateAtom).selectedNodeId,
);

export const svgInputErrorAtom = atom(
    (get) => get(svgInputStateAtom).parseError,
);

export const svgInputSelectedNodeAtom = atom<SvgInputNode | null>(
    (get) => {
        const { document, selectedNodeId } = get(svgInputStateAtom);
        if (!document || !selectedNodeId) return null;
        return findSvgInputNodeById(document.root, selectedNodeId);
    },
);

export const doApplySvgInputTextAtom = atom(
    null,
    (get, set, text: string) => {
        if (!text.trim()) return;

        try {
            const parsed = parseSvgInputText(text);
            set(svgInputStateAtom, {
                document: parsed.document,
                selectedNodeId: parsed.initialSelectedNodeId,
                parseError: null,
                boundPathNodeId: parsed.initialPathData !== null ? parsed.initialSelectedNodeId : null,
            });

            if (parsed.initialPathData !== null && parsed.initialPathData !== get(rawPathAtom)) {
                set(svgPathInputAtom, parsed.initialPathData);
            }
        } catch (error) {
            set(svgInputStateAtom, {
                document: null,
                selectedNodeId: null,
                parseError: error instanceof Error ? error.message : String(error),
                boundPathNodeId: null,
            });
        }
    },
);

export const doSelectSvgInputNodeAtom = atom(
    null,
    (get, set, nodeId: string) => {
        const state = get(svgInputStateAtom);
        const root = state.document?.root;
        if (!root) return;

        const node = findSvgInputNodeById(root, nodeId);
        if (!node) return;

        if (node.pathData !== null) {
            if (state.selectedNodeId !== nodeId || state.boundPathNodeId !== nodeId) {
                set(svgInputStateAtom, {
                    ...state,
                    selectedNodeId: nodeId,
                    boundPathNodeId: nodeId,
                });
            }
        } else if (state.selectedNodeId !== nodeId) {
            set(svgInputStateAtom, {
                ...state,
                selectedNodeId: nodeId,
            });
        }

        if (node.pathData !== null && node.pathData !== get(rawPathAtom)) {
            set(svgPathInputAtom, node.pathData);
        }
    },
);