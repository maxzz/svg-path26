import { atom } from "jotai";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import type { Point, SvgCanvasLine, SvgCanvasPoint, SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { createAtomAppSetting } from "@/store/0-atoms/8-create-app-settings-atoms";
import { createStoredPathActionsAtoms } from "@/store/0-atoms/2-1-stored-paths-actions";
import { rawPathAtom } from "./1-0-raw-path";
import { svgPathInputAtom } from "./1-1-svg-path-history-input-state";
import { doSetPathWithoutHistoryAtom } from "./1-2-history-internals";

export const strokeWidthAtom = createAtomAppSetting("strokeWidth");
export const zoomAtom = createAtomAppSetting("zoom");
export const decimalsAtom = createAtomAppSetting("decimals");
export const minifyOutputAtom = createAtomAppSetting("minifyOutput");
export const snapToGridAtom = createAtomAppSetting("snapToGrid");
export const pointPrecisionAtom = createAtomAppSetting("pointPrecision");
export const showTicksAtom = createAtomAppSetting("showTicks");
export const tickIntervalAtom = createAtomAppSetting("tickInterval");
export const fillPreviewAtom = createAtomAppSetting("fillPreview");
export const canvasPreviewAtom = createAtomAppSetting("canvasPreview");

export const viewPortXAtom = createAtomAppSetting("viewPortX");
export const viewPortYAtom = createAtomAppSetting("viewPortY");
export const viewPortWidthAtom = createAtomAppSetting("viewPortWidth");
export const viewPortHeightAtom = createAtomAppSetting("viewPortHeight");
export const viewPortLockedAtom = createAtomAppSetting("viewPortLocked");
export const pathNameAtom = createAtomAppSetting("pathName");

export const scaleXAtom = atom(1);
export const scaleYAtom = atom(1);
export const translateXAtom = atom(0);
export const translateYAtom = atom(0);

// SVG model

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

export const targetPointsAtom = atom<SvgCanvasPoint[]>(
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

const selectedCommandIndexBaseAtom = atom<number | null>(null);
export const selectedCommandIndexAtom = atom(
    (get) => {
        const index = get(selectedCommandIndexBaseAtom);
        const rowCount = get(commandRowsAtom).length;
        if (index === null) return null;
        if (index < 0 || index >= rowCount) return null;
        return index;
    },
    (get, set, nextIndex: number | null) => {
        if (nextIndex === null) {
            set(selectedCommandIndexBaseAtom, null);
            return;
        }
        const rowCount = get(commandRowsAtom).length;
        if (nextIndex < 0 || nextIndex >= rowCount) {
            set(selectedCommandIndexBaseAtom, null);
            return;
        }
        set(selectedCommandIndexBaseAtom, nextIndex);
    }
);

export const hoveredCommandIndexAtom = atom<number | null>(null);
export const draggedCanvasPointAtom = atom<SvgCanvasPoint | null>(null);
export const isCanvasDraggingAtom = atom(false);

// Stored paths actions

const storedPathActions = createStoredPathActionsAtoms({
    pathNameAtom,
    selectedCommandIndexAtom,
    hoveredCommandIndexAtom,
});
export const doSaveNamedPathAtom = storedPathActions.doSaveNamedPathAtom;
export const doDeleteNamedPathAtom = storedPathActions.doDeleteNamedPathAtom;
export const doOpenNamedPathAtom = storedPathActions.doOpenNamedPathAtom;

// Selected standalone segment path

export const selectedStandaloneSegmentPathAtom = atom(
    (get) => {
        const selected = get(selectedCommandIndexAtom);
        if (selected === null) return null;
        return get(standaloneSegmentPathsAtom)[selected] ?? null;
    }
);

export const hoveredStandaloneSegmentPathAtom = atom(
    (get) => {
        const hovered = get(hoveredCommandIndexAtom);
        if (hovered === null) return null;
        return get(standaloneSegmentPathsAtom)[hovered] ?? null;
    }
);

// Model

const applyModelAtom = atom(
    null,
    (get, set, updater: (svg: SvgPathModel) => void) => {
        const path = get(rawPathAtom).trim();
        if (!path) return;

        try {
            const model = new SvgPathModel(path);
            updater(model);
            const decimals = get(decimalsAtom);
            const minify = get(minifyOutputAtom);
            set(svgPathInputAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

const applyModelWithoutHistoryAtom = atom(
    null,
    (get, set, updater: (svg: SvgPathModel) => void) => {
        const path = get(rawPathAtom).trim();
        if (!path) return;

        try {
            const model = new SvgPathModel(path);
            updater(model);
            const decimals = get(decimalsAtom);
            const minify = get(minifyOutputAtom);
            set(doSetPathWithoutHistoryAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

// Canvas point location

export const doSetPointLocationAtom = atom(
    null,
    (_get, set, args: { point: SvgCanvasPoint; to: Point; }) => {
        set(applyModelAtom, (model) => {
            model.setCanvasPointLocation(args.point, args.to);
        });
    }
);

export const doSetPointLocationWithoutHistoryAtom = atom(
    null,
    (_get, set, args: { point: SvgCanvasPoint; to: Point; }) => {
        set(applyModelWithoutHistoryAtom, (model) => {
            model.setCanvasPointLocation(args.point, args.to);
        });
    }
);

export const doSetCommandValueAtom = atom(
    null,
    (_get, set, args: { commandIndex: number; valueIndex: number; value: number; }) => {
        set(applyModelAtom, (model) => {
            model.setSegmentValue(args.commandIndex, args.valueIndex, args.value);
        });
    }
);

// Segment relative

export const doToggleSegmentRelativeAtom = atom(
    null,
    (_get, set, segmentIndex: number) => {
        set(applyModelAtom, (model) => {
            model.toggleSegmentRelative(segmentIndex);
        });
    }
);

export const doDeleteSegmentAtom = atom(
    null,
    (get, set, segmentIndex: number) => {
        set(applyModelAtom, (model) => {
            model.deleteSegment(segmentIndex);
        });

        const selected = get(selectedCommandIndexAtom);
        if (selected === null) return;

        if (selected === segmentIndex) {
            set(selectedCommandIndexAtom, null);
        } else if (selected > segmentIndex) {
            set(selectedCommandIndexAtom, selected - 1);
        }
    }
);

export const doInsertSegmentAtom = atom(
    null,
    (get, set, args: { type: string; afterIndex: number | null; }) => {
        const path = get(rawPathAtom).trim();
        if (!path) {
            const initial = new SvgPathModel("M 0 0");
            const inserted = initial.insertSegment(args.type, null);
            const decimals = get(decimalsAtom);
            const minify = get(minifyOutputAtom);
            set(svgPathInputAtom, initial.toString(decimals, minify));
            set(selectedCommandIndexAtom, inserted ?? 0);
            return;
        }

        let insertedIndex: number | null = null;
        set(applyModelAtom, (model) => {
            insertedIndex = model.insertSegment(args.type, args.afterIndex);
        });
        if (insertedIndex !== null) {
            set(selectedCommandIndexAtom, insertedIndex);
        }
    }
);

export const doConvertSegmentAtom = atom(
    null,
    (_get, set, args: { segmentIndex: number; type: string; }) => {
        set(applyModelAtom, (model) => {
            model.changeSegmentType(args.segmentIndex, args.type);
        });
    }
);

// Focus point command

export const doFocusPointCommandAtom = atom(
    null,
    (_get, set, point: SvgCanvasPoint | null) => {
        set(selectedCommandIndexAtom, point ? point.segmentIndex : null);
    }
);

export const doNormalizePathAtom = atom(
    null,
    (get, set) => {
        set(applyModelAtom, () => { });
    }
);

export const doSetMinifyAtom = atom(
    null,
    (_get, set, minify: boolean) => {
        set(minifyOutputAtom, minify);
        set(doNormalizePathAtom);
    }
);

export const doSetRelativeAtom = atom(
    null,
    (_get, set) => {
        set(applyModelAtom, (model) => model.setRelative(true));
    }
);

export const doSetAbsoluteAtom = atom(
    null,
    (_get, set) => {
        set(applyModelAtom, (model) => model.setRelative(false));
    }
);

export const doApplyScaleAtom = atom(
    null,
    (get, set) => {
        const scaleX = get(scaleXAtom);
        const scaleY = get(scaleYAtom);
        if (scaleX === 0 || scaleY === 0) return;
        set(applyModelAtom, (model) => model.scale(scaleX, scaleY));
    }
);

export const doApplyTranslateAtom = atom(
    null,
    (get, set) => {
        const dx = get(translateXAtom);
        const dy = get(translateYAtom);
        if (dx === 0 && dy === 0) return;
        set(applyModelAtom, (model) => model.translate(dx, dy));
        set(translateXAtom, 0);
        set(translateYAtom, 0);
    }
);

export const doClearPathAtom = atom(
    null,
    (_get, set) => {
        set(svgPathInputAtom, "");
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
        set(draggedCanvasPointAtom, null);
    }
);

export const exportFillAtom = createAtomAppSetting("exportFill");
export const exportFillColorAtom = createAtomAppSetting("exportFillColor");
export const exportStrokeAtom = createAtomAppSetting("exportStroke");
export const exportStrokeColorAtom = createAtomAppSetting("exportStrokeColor");
export const exportStrokeWidthAtom = createAtomAppSetting("exportStrokeWidth");

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
