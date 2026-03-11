import { atom } from "jotai";
import { SvgPathModel, type Point, type SvgCanvasLine, type SvgCanvasPoint, type SvgSegmentSummary } from "@/svg-core/model";
import { createAtomAppSetting } from "@/store/0-ui-settings";
import {
    rawPathAtom,
    setPathWithoutHistoryAtom,
    commitCurrentPathToHistoryAtom,
    svgPathInputAtom,
    canRedoAtom,
    canUndoAtom,
    doRedoPathAtom,
    doUndoPathAtom,
} from "./5-svg-path-history-state";

export { canRedoAtom, canUndoAtom, commitCurrentPathToHistoryAtom, doRedoPathAtom, doUndoPathAtom, svgPathInputAtom };

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 16;

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

export const canvasGeometryAtom = atom(
    (get) => get(parseStateAtom).model?.getCanvasGeometry() ?? EMPTY_GEOMETRY
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

export const canvasViewBoxAtom = atom<[number, number, number, number]>(
    (get) => [
        get(viewPortXAtom),
        get(viewPortYAtom),
        get(viewPortWidthAtom),
        get(viewPortHeightAtom),
    ]
);

export const doSetViewBoxAtom = atom(
    null,
    (_get, set, next: { x: number; y: number; width: number; height: number; }) => {
        if (!Number.isFinite(next.width) || !Number.isFinite(next.height)) return;
        if (next.width <= 0 || next.height <= 0) return;
        set(viewPortXAtom, next.x);
        set(viewPortYAtom, next.y);
        set(viewPortWidthAtom, next.width);
        set(viewPortHeightAtom, next.height);
    }
);

export const doPanViewBoxAtom = atom(
    null,
    (get, set, delta: { dx: number; dy: number; }) => {
        if (get(viewPortLockedAtom)) return;
        set(viewPortXAtom, get(viewPortXAtom) + delta.dx);
        set(viewPortYAtom, get(viewPortYAtom) + delta.dy);
    }
);

export const doZoomViewBoxAtom = atom(
    null,
    (get, set, args: { scale: number; center?: Point; }) => {
        if (get(viewPortLockedAtom)) return;
        const scale = args.scale;
        if (!Number.isFinite(scale) || scale <= 0) return;

        const x = get(viewPortXAtom);
        const y = get(viewPortYAtom);
        const width = get(viewPortWidthAtom);
        const height = get(viewPortHeightAtom);
        const center = args.center ?? { x: x + width / 2, y: y + height / 2 };

        const nextWidth = width * scale;
        const nextHeight = height * scale;
        const nextX = x + (center.x - x) - scale * (center.x - x);
        const nextY = y + (center.y - y) - scale * (center.y - y);

        set(viewPortXAtom, nextX);
        set(viewPortYAtom, nextY);
        set(viewPortWidthAtom, Math.max(1e-3, nextWidth));
        set(viewPortHeightAtom, Math.max(1e-3, nextHeight));
        set(zoomAtom, clampZoom(get(zoomAtom) / scale));
    }
);

export const doFitViewBoxAtom = atom(
    null,
    (get, set) => {
        if (get(viewPortLockedAtom)) return;
        const model = get(parseStateAtom).model;
        if (!model) {
            set(viewPortXAtom, 0);
            set(viewPortYAtom, 0);
            set(viewPortWidthAtom, 120);
            set(viewPortHeightAtom, 90);
            return;
        }

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

        const zoom = clampZoom(get(zoomAtom));
        width /= zoom;
        height /= zoom;
        const centerX = (bounds.xmin + bounds.xmax) / 2;
        const centerY = (bounds.ymin + bounds.ymax) / 2;

        set(viewPortXAtom, centerX - width / 2);
        set(viewPortYAtom, centerY - height / 2);
        set(viewPortWidthAtom, width);
        set(viewPortHeightAtom, height);
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
            set(setPathWithoutHistoryAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

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

function clampZoom(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 1;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export type StoredPath = {
    name: string;
    path: string;
    createdAt: number;
    updatedAt: number;
};

export const storedPathsAtom = createAtomAppSetting("storedPaths");

export const doSaveNamedPathAtom = atom(
    null,
    (get, set, nameRaw: string) => {
        const path = get(rawPathAtom).trim();
        const name = nameRaw.trim();
        if (!path || !name) return;
        const now = Date.now();
        const existing = get(storedPathsAtom);
        const match = existing.find((it) => it.name === name);
        if (match) {
            set(storedPathsAtom, existing.map((it) => it.name === name ? { ...it, path, updatedAt: now } : it));
        } else {
            set(storedPathsAtom, [...existing, { name, path, createdAt: now, updatedAt: now }]);
        }
        set(pathNameAtom, name);
    }
);

export const doDeleteNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        set(storedPathsAtom, get(storedPathsAtom).filter((it) => it.name !== name));
        if (get(pathNameAtom) === name) {
            set(pathNameAtom, "");
        }
    }
);

export const doOpenNamedPathAtom = atom(
    null,
    (get, set, name: string) => {
        const match = get(storedPathsAtom).find((it) => it.name === name);
        if (!match) return;
        set(svgPathInputAtom, match.path);
        set(pathNameAtom, name);
        set(selectedCommandIndexAtom, null);
        set(hoveredCommandIndexAtom, null);
    }
);

export type EditorImage = {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    preserveAspectRatio: boolean;
    opacity: number;
    data: string;
};

export const isImageEditModeAtom = atom(false);
export const imagesAtom = atom<EditorImage[]>([]);
export const focusedImageIdAtom = atom<string | null>(null);

export const doAddImageAtom = atom(
    null,
    (_get, set, image: Omit<EditorImage, "id">) => {
        const id = `im:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
        set(imagesAtom, (previous) => [...previous, { ...image, id }]);
        set(focusedImageIdAtom, id);
        set(isImageEditModeAtom, true);
    }
);

export const doUpdateImageAtom = atom(
    null,
    (_get, set, args: { id: string; patch: Partial<EditorImage>; }) => {
        set(imagesAtom, (previous) => previous.map((it) => it.id === args.id ? { ...it, ...args.patch } : it));
    }
);

export const doDeleteImageAtom = atom(
    null,
    (get, set, id: string) => {
        set(imagesAtom, get(imagesAtom).filter((it) => it.id !== id));
        if (get(focusedImageIdAtom) === id) {
            set(focusedImageIdAtom, null);
        }
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
