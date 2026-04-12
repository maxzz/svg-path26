import { type MouseEvent } from "react";
import { atom, type Atom } from "jotai";
import { rawPathAtom } from "./1-0-raw-path";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { type Point, type SvgCanvasPoint } from "@/svg-core/9-types-svg-model";
import { createAtomAppSetting } from "./8-create-atom-app-settings";
import { svgPathInputAtom } from "./1-1-svg-path-input";
import { doSetPathWithoutHistoryAtom } from "./1-2-history";
import { commandRowsAtom, controlPointsAtom, standaloneSegmentPathsAtom, svgModelAtom } from "./2-0-svg-model";
import { focusedImageIdAtom } from "./2-8-images";
import { canvasDragStateAtom } from "@/components/2-editor/3-canvas/3-canvas-drag";
import { applyCanvasPointSelection, applyCommandSelection, normalizeSelectedCommandIndices, remapSelectedIndicesAfterDelete, type CanvasPointSelectionMode, type CommandSelectionMode } from "./2-5-editor-selection-utils";
import { appSettings } from "@/store/0-ui-settings";

export const strokeWidthAtom = createAtomAppSetting("strokeWidth");

export const scaleXAtom = atom(1);
export const scaleYAtom = atom(1);
export const translateXAtom = atom(0);
export const translateYAtom = atom(0);

const selectedCommandIndicesBaseAtom = atom<number[]>([]);
export const selectedCommandIndicesAtom = atom(
    (get) => normalizeSelectedCommandIndices(get(selectedCommandIndicesBaseAtom), get(commandRowsAtom).length),
    (get, set, nextIndices: number[]) => {
        set(selectedCommandIndicesBaseAtom, normalizeSelectedCommandIndices(nextIndices, get(commandRowsAtom).length));
    }
);
const selectedControlPointIdsBaseAtom = atom<string[]>([]);
export const selectedControlPointIdsAtom = atom(
    (get) => normalizeSelectedControlPointIds(get(selectedControlPointIdsBaseAtom), get(controlPointsAtom)),
    (get, set, nextIds: string[]) => {
        set(selectedControlPointIdsBaseAtom, normalizeSelectedControlPointIds(nextIds, get(controlPointsAtom)));
    }
);
export const hasSelectedControlPointsAtom = atom((get) => get(selectedControlPointIdsAtom).length > 0);
export const selectedControlPointsAtom = atom(
    (get) => getSelectedControlPoints(get(controlPointsAtom), get(selectedControlPointIdsAtom))
);
export const selectedCommandIndexAtom = atom(
    (get) => {
        const selected = get(selectedCommandIndicesAtom);
        return selected.length ? selected[selected.length - 1] : null;
    },
    (_get, set, nextIndex: number | null) => {
        set(selectedCommandIndicesAtom, nextIndex === null ? [] : [nextIndex]);
    }
);

export const hoveredCommandIndexAtom = atom<number | null>(null);
export const hoveredCanvasPointAtom = atom<SvgCanvasPoint | null>(null);
export const draggedCanvasPointAtom = atom<SvgCanvasPoint | null>(null);
export const isCanvasDraggingAtom = atom(false);
const suppressCanvasFocusClearUntilAtom = atom(0);
export const canvasSegmentHitAreaElementsAtom = atom<Record<number, SVGPathElement | null>>({});
const CANVAS_FOCUS_CLEAR_SUPPRESSION_MS = 250;

export const doSuppressNextCanvasFocusClearAtom = atom(
    null,
    (_get, set) => {
        set(suppressCanvasFocusClearUntilAtom, Date.now() + CANVAS_FOCUS_CLEAR_SUPPRESSION_MS);
    }
);

export const doRegisterCanvasSegmentHitAreaAtom = atom(
    null,
    (get, set, { index, element }: { index: number; element: SVGPathElement | null; }) => {
        const current = get(canvasSegmentHitAreaElementsAtom);
        if (current[index] === element) {
            return;
        }

        const next = { ...current };
        if (element) {
            next[index] = element;
        } else {
            delete next[index];
        }
        
        set(canvasSegmentHitAreaElementsAtom, next);
    }
);

// New selective atoms for command selection and hover states by segment index

const selectedCommandBySegmentAtomCache = new Map<number, Atom<boolean>>();
const selectedControlPointByIdAtomCache = new Map<string, Atom<boolean>>();
const hoveredCommandBySegmentAtomCache = new Map<number, Atom<boolean>>();
const highlightedCanvasPointBySegmentAtomCache = new Map<number, Atom<SvgCanvasPoint | null>>();

export function commandSelectedAtom(segmentIndex: number) {
    const cached = selectedCommandBySegmentAtomCache.get(segmentIndex);
    if (cached) {
        return cached;
    }

    const created = atom((get) => get(selectedCommandIndicesAtom).includes(segmentIndex));
    selectedCommandBySegmentAtomCache.set(segmentIndex, created);
    return created;
}

export function commandHoveredAtom(segmentIndex: number) {
    const cached = hoveredCommandBySegmentAtomCache.get(segmentIndex);
    if (cached) {
        return cached;
    }

    const created = atom((get) => get(hoveredCommandIndexAtom) === segmentIndex);
    hoveredCommandBySegmentAtomCache.set(segmentIndex, created);
    return created;
}

export function controlPointSelectedAtom(pointId: string) {
    const cached = selectedControlPointByIdAtomCache.get(pointId);
    if (cached) {
        return cached;
    }

    const created = atom((get) => get(selectedControlPointIdsAtom).includes(pointId));
    selectedControlPointByIdAtomCache.set(pointId, created);
    return created;
}

export function highlightedCanvasPointAtomForSegment(segmentIndex: number): Atom<SvgCanvasPoint | null> {
    const cached = highlightedCanvasPointBySegmentAtomCache.get(segmentIndex);
    if (cached) {
        return cached;
    }

    const created = atom(
        (get) => {
            const dragged = get(draggedCanvasPointAtom);
            if (dragged?.segmentIndex === segmentIndex) {
                return dragged;
            }

            const hovered = get(hoveredCanvasPointAtom);
            if (!hovered || hovered.segmentIndex !== segmentIndex) {
                return null;
            }

            return get(hoveredCommandIndexAtom) === segmentIndex ? hovered : null;
        }
    );

    highlightedCanvasPointBySegmentAtomCache.set(segmentIndex, created);
    return created;
}

// Clear canvas focus when clicking on the canvas background

export const doClearCanvasFocusAtom = atom(
    null,
    (get, set, event: MouseEvent<SVGSVGElement>) => {
        if (get(suppressCanvasFocusClearUntilAtom) >= Date.now()) {
            set(suppressCanvasFocusClearUntilAtom, 0);
            return;
        }

        if (event.shiftKey || event.ctrlKey || event.metaKey) return;
        if (event.target !== event.currentTarget) return;

        const dragState = get(canvasDragStateAtom);
        if (dragState && "moved" in dragState && dragState.moved) {
            return;
        }

        set(selectedCommandIndicesAtom, []);
        set(selectedControlPointIdsAtom, []);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
        set(focusedImageIdAtom, null);
    }
);

export const doSetSelectedControlPointsAtom = atom(
    null,
    (get, set, pointIds: Iterable<string>) => {
        const controlPoints = get(controlPointsAtom);
        const nextIds = normalizeSelectedControlPointIds(pointIds, controlPoints);
        const nextPoints = getSelectedControlPoints(controlPoints, nextIds);

        set(selectedControlPointIdsAtom, nextIds);
        set(selectedCommandIndicesAtom, normalizeSelectedCommandIndices(
            nextPoints.map((point) => point.segmentIndex),
            get(commandRowsAtom).length,
        ));
    }
);

export const doSelectControlPointAtom = atom(
    null,
    (get, set, { point, mode }: { point: SvgCanvasPoint; mode: CanvasPointSelectionMode; }) => {
        const nextIds = applyCanvasPointSelection(get(selectedControlPointIdsAtom), [point.id], mode);
        set(doSetSelectedControlPointsAtom, nextIds);
    }
);

export const doSelectCommandAtom = atom(
    null,
    (get, set, { index, mode }: { index: number; mode: CommandSelectionMode; }) => {
        set(selectedControlPointIdsAtom, []);
        set(selectedCommandIndicesAtom, applyCommandSelection(
            get(selectedCommandIndicesAtom),
            [index],
            mode,
            get(commandRowsAtom).length,
        ));
    }
);

export const doSelectCommandsAtom = atom(
    null,
    (get, set, { indices, mode }: { indices: number[]; mode: CommandSelectionMode; }) => {
        set(selectedControlPointIdsAtom, []);
        set(selectedCommandIndicesAtom, applyCommandSelection(
            get(selectedCommandIndicesAtom),
            indices,
            mode,
            get(commandRowsAtom).length,
        ));
    }
);

// Selected standalone segment path

export const selectedStandaloneSegmentPathAtom = atom(
    (get) => {
        const selected = get(selectedCommandIndexAtom);
        if (selected === null) {
            return null;
        }
        return get(standaloneSegmentPathsAtom)[selected] ?? null;
    }
);

export const selectedStandaloneSegmentPathsAtom = atom(
    (get) => {
        return get(selectedCommandIndicesAtom)
            .map(
                (index) => get(standaloneSegmentPathsAtom)[index]
            )
            .filter(
                (segmentPath): segmentPath is string => Boolean(segmentPath)
            );
    }
);

export const hoveredStandaloneSegmentPathAtom = atom(
    (get) => {
        const hovered = get(hoveredCommandIndexAtom);
        if (hovered === null) {
            return null;
        }
        return get(standaloneSegmentPathsAtom)[hovered] ?? null;
    }
);

// Model

export const doApplySvgModelAtom = atom(
    null,
    (get, set, updaterFn: (svg: SvgPathModel) => void) => {
        const path = get(rawPathAtom).trim();
        if (!path) {
            return;
        }

        try {
            const model = new SvgPathModel(path);
            updaterFn(model);

            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(svgPathInputAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

const doApplySvgModelWithoutHistoryAtom = atom(
    null,
    (get, set, updaterFn: (svg: SvgPathModel) => void) => {
        const path = get(rawPathAtom).trim();
        if (!path) {
            return;
        }

        try {
            const model = new SvgPathModel(path);
            updaterFn(model);

            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(doSetPathWithoutHistoryAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

// Canvas point location

export const doSetPointLocationAtom = atom(
    null,
    (_get, set, { point, to }: { point: SvgCanvasPoint; to: Point; }) => {
        set(doApplySvgModelAtom, (model) => {
            model.setCanvasPointLocation(point, to);
        });
    }
);

export const doSetPointLocationWithoutHistoryAtom = atom(
    null,
    (_get, set, { point, to }: { point: SvgCanvasPoint; to: Point; }) => {
        set(doApplySvgModelWithoutHistoryAtom, (model) => {
            model.setCanvasPointLocation(point, to);
        });
    }
);

export const doTranslateCanvasPointsWithoutHistoryAtom = atom(
    null,
    (get, set, { points, dx, dy, startPath, dragDecimals }: { points: SvgCanvasPoint[]; dx: number; dy: number; startPath?: string; dragDecimals: number; }) => {
        const path = (startPath ?? get(rawPathAtom)).trim();
        if (!path) {
            return;
        }

        const movablePoints = points.filter((point) => point.movable);
        if (!movablePoints.length) {
            return;
        }
        if (dx === 0 && dy === 0) {
            return;
        }

        try {
            const model = new SvgPathModel(path);
            movablePoints.forEach((point) => {
                model.setCanvasPointLocation(point, {
                    x: Number.parseFloat((point.x + dx).toFixed(dragDecimals)),
                    y: Number.parseFloat((point.y + dy).toFixed(dragDecimals)),
                });
            });

            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(doSetPathWithoutHistoryAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

export const doTranslateSelectedSegmentsWithoutHistoryAtom = atom(
    null,
    (get, set, { segmentIndices, dx, dy, startPath }: { segmentIndices: number[]; dx: number; dy: number; startPath?: string; }) => {
        const path = (startPath ?? get(rawPathAtom)).trim();
        if (!path) {
            return;
        }

        if (!segmentIndices.length) {
            return;
        }
        if (dx === 0 && dy === 0) {
            return;
        }

        try {
            const model = new SvgPathModel(path);
            model.translateSegments(segmentIndices, dx, dy);
            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(doSetPathWithoutHistoryAtom, model.toString(decimals, minify));
        } catch {
            // no-op if path is currently invalid
        }
    }
);

export const doSetCommandValueAtom = atom(
    null,
    (_get, set, { commandIndex, valueIndex, value }: { commandIndex: number; valueIndex: number; value: number; }) => {
        set(doApplySvgModelAtom, (model) => {
            model.setSegmentValue(commandIndex, valueIndex, value);
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
        set(selectedControlPointIdsAtom, []);
        set(selectedCommandIndicesAtom, remapSelectedIndicesAfterDelete(get(selectedCommandIndicesAtom), [segmentIndex]));
    }
);

export const doDeleteSelectedSegmentsAtom = atom(
    null,
    (get, set) => {
        const model = get(svgModelAtom).model;
        if (!model) return;

        const selected = get(selectedCommandIndicesAtom);
        const deletable = selected.filter((segmentIndex) => model.canDelete(segmentIndex));
        if (!deletable.length) return;

        set(doApplySvgModelAtom, (nextModel) => {
            [...deletable].sort((a, b) => b - a).forEach((segmentIndex) => {
                nextModel.deleteSegment(segmentIndex);
            });
        });

        set(selectedControlPointIdsAtom, []);
        set(selectedCommandIndicesAtom, remapSelectedIndicesAfterDelete(selected, deletable));
    }
);

export const doInsertSegmentAtom = atom(
    null,
    (get, set, { type, afterIndex }: { type: string; afterIndex: number | null; }) => {
        const path = get(rawPathAtom).trim();
        if (!path) {
            const initial = new SvgPathModel("M 0 0");
            const inserted = initial.insertSegment(type, null);
            const { decimals, minifyOutput: minify } = appSettings.pathEditor;
            set(svgPathInputAtom, initial.toString(decimals, minify));
            set(selectedControlPointIdsAtom, []);
            set(selectedCommandIndicesAtom, [inserted ?? 0]);
            return;
        }

        let insertedIndex: number | null = null;
        set(doApplySvgModelAtom, (model) => {
            insertedIndex = model.insertSegment(type, afterIndex);
        });
        if (insertedIndex !== null) {
            set(selectedControlPointIdsAtom, []);
            set(selectedCommandIndicesAtom, [insertedIndex]);
        }
    }
);

export const doConvertSegmentAtom = atom(
    null,
    (_get, set, { segmentIndex, type }: { segmentIndex: number; type: string; }) => {
        set(doApplySvgModelAtom, (model) => {
            model.changeSegmentType(segmentIndex, type);
        });
    }
);


// Focus point command

export const doFocusPointCommandAtom = atom(
    null,
    (_get, set, point: SvgCanvasPoint | null) => {
        set(selectedControlPointIdsAtom, []);
        set(selectedCommandIndicesAtom, point ? [point.segmentIndex] : []);
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
        set(selectedCommandIndicesAtom, []);
        set(selectedControlPointIdsAtom, []);
        set(hoveredCommandIndexAtom, null);
        set(hoveredCanvasPointAtom, null);
        set(draggedCanvasPointAtom, null);
    }
);

//

function normalizeSelectedControlPointIds(ids: Iterable<string>, controlPoints: SvgCanvasPoint[]): string[] {
    const validIds = new Set(controlPoints.map((point) => point.id));
    const next: string[] = [];
    const seen = new Set<string>();

    for (const id of ids) {
        if (!validIds.has(id) || seen.has(id)) continue;
        seen.add(id);
        next.push(id);
    }

    return next;
}

function getSelectedControlPoints(controlPoints: SvgCanvasPoint[], selectedIds: Iterable<string>): SvgCanvasPoint[] {
    const controlPointsById = new Map(controlPoints.map((point) => [point.id, point] as const));
    const next: SvgCanvasPoint[] = [];

    for (const id of selectedIds) {
        const point = controlPointsById.get(id);
        if (!point) continue;
        next.push(point);
    }

    return next;
}
