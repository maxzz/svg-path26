import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SvgPathModel, type SvgSegmentSummary } from "@/svg-core/model";

const DEFAULT_PATH = "M 20 140 C 40 20, 65 20, 95 140 S 150 260, 180 140";
const HISTORY_LIMIT = 120;

const rawPathAtom = atomWithStorage("svg-path26:path", DEFAULT_PATH);
const historyStackAtom = atom<string[]>([]);
const historyIndexAtom = atom(-1);
const historyReadyAtom = atom(false);

const ensureHistoryReadyAtom = atom(
    null,
    (get, set) => {
        if (get(historyReadyAtom)) return;
        const initial = get(rawPathAtom);
        set(historyStackAtom, [initial]);
        set(historyIndexAtom, 0);
        set(historyReadyAtom, true);
    }
);

const pushHistoryAtom = atom(
    null,
    (get, set, nextPath: string) => {
        set(ensureHistoryReadyAtom);

        const stack = get(historyStackAtom);
        const index = get(historyIndexAtom);
        const current = stack[index];
        if (current === nextPath) return;

        const truncated = stack.slice(0, index + 1);
        const appended = [...truncated, nextPath];
        const limited = appended.slice(-HISTORY_LIMIT);
        const nextIndex = limited.length - 1;

        set(historyStackAtom, limited);
        set(historyIndexAtom, nextIndex);
    }
);

const setPathWithoutHistoryAtom = atom(
    null,
    (_get, set, nextPath: string) => {
        set(rawPathAtom, nextPath);
    }
);

export const svgPathInputAtom = atom(
    (get) => get(rawPathAtom),
    (get, set, nextValue: string | ((prev: string) => string)) => {
        const prev = get(rawPathAtom);
        const resolved = typeof nextValue === "function"
            ? nextValue(prev)
            : nextValue;
        set(ensureHistoryReadyAtom);
        set(rawPathAtom, resolved);
        set(pushHistoryAtom, resolved);
    },
);

export const strokeWidthAtom = atomWithStorage("svg-path26:stroke", 3);
export const zoomAtom = atomWithStorage("svg-path26:zoom", 1);
export const decimalsAtom = atomWithStorage("svg-path26:decimals", 3);
export const minifyOutputAtom = atomWithStorage("svg-path26:minify", false);

export const scaleXAtom = atom(1);
export const scaleYAtom = atom(1);
export const translateXAtom = atom(0);
export const translateYAtom = atom(0);

type ParseState = {
    model: SvgPathModel | null;
    error: string | null;
};

export const parseStateAtom = atom<ParseState>(
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

export const commandCountAtom = atom((get) => get(parseStateAtom).model?.getCommandCount() ?? 0);
export const parseErrorAtom = atom((get) => get(parseStateAtom).error);

export const commandRowsAtom = atom<SvgSegmentSummary[]>(
    (get) => {
        const model = get(parseStateAtom).model;
        return model ? model.getSummaries() : [];
    }
);

export const targetPointsAtom = atom(
    (get) => get(commandRowsAtom).map((row) => row.target)
);

export const canvasViewBoxAtom = atom<[number, number, number, number]>(
    (get) => {
        const model = get(parseStateAtom).model;
        const zoom = Math.max(0.25, get(zoomAtom));

        if (!model) return [0, 0, 200 / zoom, 150 / zoom];

        const bounds = model.getBounds();
        const widthRaw = Math.max(10, bounds.xmax - bounds.xmin);
        const heightRaw = Math.max(10, bounds.ymax - bounds.ymin);
        const padding = Math.max(widthRaw, heightRaw) * 0.12 + 2;

        let width = widthRaw + padding * 2;
        let height = heightRaw + padding * 2;

        const aspect = 4 / 3;
        if (width / height > aspect) {
            height = width / aspect;
        } else {
            width = height * aspect;
        }

        width /= zoom;
        height /= zoom;

        const centerX = (bounds.xmin + bounds.xmax) / 2;
        const centerY = (bounds.ymin + bounds.ymax) / 2;

        return [centerX - width / 2, centerY - height / 2, width, height];
    }
);

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
    }
);

export const canUndoAtom = atom(
    (get) => {
        const index = get(historyIndexAtom);
        return index > 0;
    }
);

export const canRedoAtom = atom(
    (get) => {
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        return index !== -1 && index < stack.length - 1;
    }
);

export const doUndoPathAtom = atom(
    null,
    (get, set) => {
        set(ensureHistoryReadyAtom);
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        if (index <= 0) return;

        const nextIndex = index - 1;
        set(historyIndexAtom, nextIndex);
        set(setPathWithoutHistoryAtom, stack[nextIndex]);
    }
);

export const doRedoPathAtom = atom(
    null,
    (get, set) => {
        set(ensureHistoryReadyAtom);
        const index = get(historyIndexAtom);
        const stack = get(historyStackAtom);
        if (index === -1 || index >= stack.length - 1) return;

        const nextIndex = index + 1;
        set(historyIndexAtom, nextIndex);
        set(setPathWithoutHistoryAtom, stack[nextIndex]);
    }
);
