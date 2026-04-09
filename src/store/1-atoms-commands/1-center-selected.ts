import { atom } from "jotai";
import { SvgPathModel } from "@/svg-core/2-svg-model";
import { svgModelAtom } from "../0-atoms/2-0-svg-model";
import { pathViewBoxAtom } from "../0-atoms/2-2-path-viewbox";
import { canvasSegmentHitAreaElementsAtom, doApplySvgModelAtom, selectedCommandIndicesAtom } from "../0-atoms/2-4-0-editor-actions";

export const doCenterSelectedSegmentsIntoViewBoxAtom = atom(
    null,
    (get, set, args?: { axis: "x" | "y" | "both"; }) => {
        const axis = args?.axis ?? "both";
        const centerX = axis === "x" || axis === "both";
        const centerY = axis === "y" || axis === "both";

        const selectedIndices = get(selectedCommandIndicesAtom);
        if (!selectedIndices.length) return;

        const model = get(svgModelAtom).model;
        if (!model) return;

        const canvasSegmentHitAreas = get(canvasSegmentHitAreaElementsAtom);

        // Compute the selection bounding-box in viewBox (path) coordinates.
        // Prefer the actual rendered SVG path bbox (more accurate for curves); fall back to model bounds.
        let xmin = Infinity;
        let ymin = Infinity;
        let xmax = -Infinity;
        let ymax = -Infinity;

        for (const segmentIndex of selectedIndices) { // consider caching segment bboxes in svgModelAtom for performance if this becomes a bottleneck
            const element = canvasSegmentHitAreas[segmentIndex];
            if (element) {
                try {
                    const box = element.getBBox();
                    const bxmin = box.x;
                    const bymin = box.y;
                    const bxmax = box.x + box.width;
                    const bymax = box.y + box.height;
                    if (Number.isFinite(bxmin) && Number.isFinite(bymin) && Number.isFinite(bxmax) && Number.isFinite(bymax)) {
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
            if (!standalonePath) {
                continue;
            }

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

        const viewBox = get(pathViewBoxAtom);
        const viewBoxCenterX = viewBox[0] + viewBox[2] / 2;
        const viewBoxCenterY = viewBox[1] + viewBox[3] / 2;

        // Translate selected segments so their bounding-box center matches the viewBox center.
        const dx = centerX ? viewBoxCenterX - selectionCenterX : 0;
        const dy = centerY ? viewBoxCenterY - selectionCenterY : 0;
        if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return;

        set(doApplySvgModelAtom, (model: SvgPathModel) => {
            model.translateSegments(selectedIndices, dx, dy);
        });
    }
);
