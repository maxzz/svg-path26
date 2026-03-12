import { atom } from "jotai";
import { rawPathAtom } from "./1-0-raw-path";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { createAtomAppSetting } from "./8-create-atom-app-settings";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { doSetPathWithoutHistoryAtom } from "./1-2-history";
import { commandRowsAtom, standaloneSegmentPathsAtom } from "./2-0-svg-model";

export const strokeWidthAtom = createAtomAppSetting("strokeWidth");
export const decimalsAtom = createAtomAppSetting("decimals");
export const minifyOutputAtom = createAtomAppSetting("minifyOutput");

export const pathNameAtom = createAtomAppSetting("pathName");

export const scaleXAtom = atom(1);
export const scaleYAtom = atom(1);
export const translateXAtom = atom(0);
export const translateYAtom = atom(0);

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

const doApplySvgModelAtom = atom(
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

const doApplySvgModelWithoutHistoryAtom = atom(
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
        set(doApplySvgModelAtom, (model) => {
            model.setCanvasPointLocation(args.point, args.to);
        });
    }
);

export const doSetPointLocationWithoutHistoryAtom = atom(
    null,
    (_get, set, args: { point: SvgCanvasPoint; to: Point; }) => {
        set(doApplySvgModelWithoutHistoryAtom, (model) => {
            model.setCanvasPointLocation(args.point, args.to);
        });
    }
);

export const doSetCommandValueAtom = atom(
    null,
    (_get, set, args: { commandIndex: number; valueIndex: number; value: number; }) => {
        set(doApplySvgModelAtom, (model) => {
            model.setSegmentValue(args.commandIndex, args.valueIndex, args.value);
        });
    }
);

// Segment relative

export const doToggleSegmentRelativeAtom = atom(
    null,
    (_get, set, segmentIndex: number) => {
        set(doApplySvgModelAtom, (model) => {
            model.toggleSegmentRelative(segmentIndex);
        });
    }
);

export const doDeleteSegmentAtom = atom(
    null,
    (get, set, segmentIndex: number) => {
        set(doApplySvgModelAtom, (model) => {
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
        set(doApplySvgModelAtom, (model) => {
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
        set(doApplySvgModelAtom, (model) => {
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
        set(doApplySvgModelAtom, () => { });
    }
);

// Set relative/absolute

export const doSetRelativeAtom = atom(
    null,
    (_get, set) => {
        set(doApplySvgModelAtom, (model) => model.setRelative(true));
    }
);

export const doSetAbsoluteAtom = atom(
    null,
    (_get, set) => {
        set(doApplySvgModelAtom, (model) => model.setRelative(false));
    }
);

// Scale/translate

export const doApplyScaleAtom = atom(
    null,
    (get, set) => {
        const scaleX = get(scaleXAtom);
        const scaleY = get(scaleYAtom);
        if (scaleX === 0 || scaleY === 0) return;
        set(doApplySvgModelAtom, (model) => model.scale(scaleX, scaleY));
    }
);

export const doApplyTranslateAtom = atom(
    null,
    (get, set) => {
        const dx = get(translateXAtom);
        const dy = get(translateYAtom);
        if (dx === 0 && dy === 0) return;
        set(doApplySvgModelAtom, (model) => model.translate(dx, dy));
        set(translateXAtom, 0);
        set(translateYAtom, 0);
    }
);

// Clear path

export const doClearPathAtom = atom(
    null,
    (_get, set) => {
        set(svgPathInputAtom, "");
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
        set(draggedCanvasPointAtom, null);
    }
);

//
