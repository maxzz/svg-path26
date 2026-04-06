import { atom } from "jotai";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import type { SvgCanvasLine, SvgCanvasPoint, SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
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

export const canvasGeometryAtom = atom(
    (get) => get(svgModelAtom).model?.getCanvasGeometry() ?? EMPTY_GEOMETRY
);

export const pathPointsAtom = atom<SvgCanvasPoint[]>(
    (get) => get(canvasGeometryAtom).targets
);

export const controlPointsAtom = atom<SvgCanvasPoint[]>(
    (get) => get(canvasGeometryAtom).controls
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
