import { atom, type WritableAtom } from "jotai";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import type { SvgCanvasLine, SvgCanvasPoint, SvgSegmentSummary, SvgSubPath } from "@/svg-core/9-types-svg-model";
import { rawPathAtom } from "./1-0-raw-path";

export const svgModelAtom = atom<{ model: SvgPathModel | null; error: string | null; }>(
    (get) => {
        const path = get(rawPathAtom).trim();
        if (!path) {
            return { model: null, error: null };
        }

        try {
            return { model: new SvgPathModel(path), error: null };
        } catch (error) {
            return {
                model: null,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
);

export const commandCountAtom = atom((get) => get(svgModelAtom).model?.getCommandCount() ?? 0);
export const parseErrorAtom = atom((get) => get(svgModelAtom).error);

export const commandRowsAtom = atom<SvgSegmentSummary[]>(
    (get) => {
        const model = get(svgModelAtom).model;
        return model ? model.getSummaries() : [];
    }
);

export const subPathsAtom = atom<SvgSubPath[]>(
    (get) => {
        const model = get(svgModelAtom).model;
        return model ? model.subPaths : [];
    }
);

export const hasCompoundSubPathsAtom = atom(
    (get) => get(subPathsAtom).length > 1
);

const subPathToggleStateAtom = atom<{ key: string; states: boolean[]; }>({
    key: "",
    states: [],
});

export const subPathEnabledStatesAtom = atom(
    (get) => {
        const subPaths = get(subPathsAtom);
        const pathKey = get(rawPathAtom);
        const current = get(subPathToggleStateAtom);
        if (current.key !== pathKey || current.states.length !== subPaths.length) {
            return subPaths.map(() => true);
        }
        return current.states;
    },
    (get, set, update: SetStateAction<boolean[]>) => {
        const subPaths = get(subPathsAtom);
        const pathKey = get(rawPathAtom);
        const current = get(subPathEnabledStatesAtom);
        const next = typeof update === "function" ? update(current) : update;
        const normalized = subPaths.map((_, index) => Boolean(next[index] ?? true));
        set(subPathToggleStateAtom, { key: pathKey, states: normalized });
    }
);

const subPathEnabledAtomCache = new Map<number, WritableAtom<boolean, [SetStateAction<boolean>], void>>();

export function subPathEnabledAtom(subPathIndex: number): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    const cached = subPathEnabledAtomCache.get(subPathIndex);
    if (cached) {
        return cached;
    }

    const created = atom(
        (get) => get(subPathEnabledStatesAtom)[subPathIndex] ?? true,
        (get, set, update: SetStateAction<boolean>) => {
            const current = get(subPathEnabledStatesAtom);
            const existing = current[subPathIndex] ?? true;
            const nextValue = typeof update === "function" ? update(existing) : update;
            const next = [...current];
            next[subPathIndex] = nextValue;
            set(subPathEnabledStatesAtom, next);
        }
    );
    subPathEnabledAtomCache.set(subPathIndex, created);
    return created;
}

export const allSubPathsEnabledAtom = atom(
    (get) => {
        const states = get(subPathEnabledStatesAtom);
        return states.length ? states.every(Boolean) : true;
    },
    (get, set, update: SetStateAction<boolean>) => {
        const states = get(subPathEnabledStatesAtom);
        const currentValue = states.length ? states.every(Boolean) : true;
        const nextValue = typeof update === "function" ? update(currentValue) : update;
        set(subPathEnabledStatesAtom, states.map(() => nextValue));
    }
);

const subPathIndexBySegmentAtom = atom<number[]>(
    (get) => {
        const subPaths = get(subPathsAtom);
        const commandCount = get(commandCountAtom);
        if (!subPaths.length || commandCount === 0) {
            return [];
        }

        const mapping = Array.from({ length: commandCount }, () => -1);
        subPaths.forEach((subPath) => {
            for (let index = subPath.startIndex; index <= subPath.endIndex; index += 1) {
                mapping[index] = subPath.index;
            }
        });
        return mapping;
    }
);

export const canvasGeometryAtom = atom(
    (get) => get(svgModelAtom).model?.getCanvasGeometry() ?? EMPTY_GEOMETRY
);

export const pathPointsAtom = atom<SvgCanvasPoint[]>(
    (get) => {
        const points = get(canvasGeometryAtom).targets;
        const subPaths = get(subPathsAtom);
        if (subPaths.length <= 1) {
            return points;
        }

        const enabledStates = get(subPathEnabledStatesAtom);
        const subPathIndexBySegment = get(subPathIndexBySegmentAtom);
        return points.filter((point) => {
            const subPathIndex = subPathIndexBySegment[point.segmentIndex];
            if (subPathIndex === undefined || subPathIndex < 0) {
                return true;
            }
            return enabledStates[subPathIndex] ?? true;
        });
    }
);

export const controlPointsAtom = atom<SvgCanvasPoint[]>(
    (get) => {
        const points = get(canvasGeometryAtom).controls;
        const subPaths = get(subPathsAtom);
        if (subPaths.length <= 1) {
            return points;
        }

        const enabledStates = get(subPathEnabledStatesAtom);
        const subPathIndexBySegment = get(subPathIndexBySegmentAtom);
        return points.filter((point) => {
            const subPathIndex = subPathIndexBySegment[point.segmentIndex];
            if (subPathIndex === undefined || subPathIndex < 0) {
                return true;
            }
            return enabledStates[subPathIndex] ?? true;
        });
    }
);

export const controlLinesAtom = atom<SvgCanvasLine[]>(
    (get) => get(canvasGeometryAtom).relationLines
);

export const standaloneSegmentPathsAtom = atom<string[]>(
    (get) => get(canvasGeometryAtom).standaloneBySegment
);

const EMPTY_GEOMETRY = {
    targets: [],
    controls: [],
    relationLines: [],
    standaloneBySegment: [],
} satisfies {
    targets: SvgCanvasPoint[];
    controls: SvgCanvasPoint[];
    relationLines: SvgCanvasLine[];
    standaloneBySegment: string[];
};
