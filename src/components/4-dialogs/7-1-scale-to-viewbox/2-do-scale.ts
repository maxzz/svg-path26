import { atom } from "jotai";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { notice } from "@/components/ui/loacal-ui/7-toaster/7-toaster";
import { svgModelAtom } from "../../../store/0-atoms/2-0-svg-model";
import { pathViewBoxAtom } from "../../../store/0-atoms/2-2-path-viewbox";
import { canvasSegmentHitAreaElementsAtom, doApplySvgModelAtom, selectedCommandIndicesAtom } from "../../../store/0-atoms/2-4-0-editor-actions";

export const doScaleSelectedSegmentsIntoViewBoxAtom = atom(
    null,
    (get, set, { margin }: { margin: number; }) => {
        const selectedIndices = get(selectedCommandIndicesAtom);
        if (!selectedIndices.length) return;

        const model = get(svgModelAtom).model;
        if (!model) return;

        const canvasSegmentHitAreas = get(canvasSegmentHitAreaElementsAtom);

        // Compute the selection bounding-box in viewBox (path) coordinates.
        let xmin = Infinity;
        let ymin = Infinity;
        let xmax = -Infinity;
        let ymax = -Infinity;

        for (const segmentIndex of selectedIndices) {
            const element = canvasSegmentHitAreas[segmentIndex];
            if (element) {
                try {
                    const box = element.getBBox();
                    const bxmin = box.x;
                    const bymin = box.y;
                    const bxmax = box.x + box.width;
                    const bymax = box.y + box.height;
                    if (
                        Number.isFinite(bxmin)
                        && Number.isFinite(bymin)
                        && Number.isFinite(bxmax)
                        && Number.isFinite(bymax)
                    ) {
                        xmin = Math.min(xmin, bxmin);
                        ymin = Math.min(ymin, bymin);
                        xmax = Math.max(xmax, bxmax);
                        ymax = Math.max(ymax, bymax);
                        continue;
                    }
                } catch {
                    // fall through to model bounds
                }
            }

            const standalonePath = model.getStandaloneSegmentPath(segmentIndex);
            if (!standalonePath) continue;

            try {
                const standaloneModel = new SvgPathModel(standalonePath);
                const bounds = standaloneModel.getBounds();
                if (!Number.isFinite(bounds.xmin) || !Number.isFinite(bounds.ymin) || !Number.isFinite(bounds.xmax) || !Number.isFinite(bounds.ymax)) continue;

                xmin = Math.min(xmin, bounds.xmin);
                ymin = Math.min(ymin, bounds.ymin);
                xmax = Math.max(xmax, bounds.xmax);
                ymax = Math.max(ymax, bounds.ymax);
            } catch {
                // no-op for a single problematic segment
            }
        }

        if (!Number.isFinite(xmin) || !Number.isFinite(ymin) || !Number.isFinite(xmax) || !Number.isFinite(ymax)) return;

        const selectionCenterX = (xmin + xmax) / 2;
        const selectionCenterY = (ymin + ymax) / 2;

        const selectionWidth = xmax - xmin;
        const selectionHeight = ymax - ymin;

        const viewBox = get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        const viewBoxWidth = viewBox[2];
        const viewBoxHeight = viewBox[3];

        const EPS = 1e-9;
        const availableWidth = viewBoxWidth - margin * 2;
        const availableHeight = viewBoxHeight - margin * 2;

        if (availableWidth <= EPS || availableHeight <= EPS) {
            notice.info("Scale margin is too large for the current viewBox.");
            return;
        }

        const scaleCandidates: number[] = [];
        if (Math.abs(selectionWidth) > EPS) {
            scaleCandidates.push(availableWidth / selectionWidth);
        }
        if (Math.abs(selectionHeight) > EPS) {
            scaleCandidates.push(availableHeight / selectionHeight);
        }

        const scaleFactor = scaleCandidates.length ? Math.min(...scaleCandidates) : 1;
        if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) return;

        const dx = viewBoxCenterX - selectionCenterX;
        const dy = viewBoxCenterY - selectionCenterY;

        const shouldSkip =
            Math.abs(scaleFactor - 1) < 1e-9
            && Math.abs(dx) < 1e-9
            && Math.abs(dy) < 1e-9;

        if (shouldSkip) return;

        set(doApplySvgModelAtom, (model) => {
            model.scaleSegments(selectedIndices, scaleFactor, scaleFactor, { x: selectionCenterX, y: selectionCenterY });
            model.translateSegments(selectedIndices, dx, dy);
        });
    }
);

