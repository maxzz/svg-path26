import { describe, expect, it } from "vitest";
import { SvgPathModel } from "./2-svg-model";

describe("SvgPathModel", () => {
    it("exposes editable canvas geometry", () => {
        const model = new SvgPathModel("M 0 0 C 10 0 10 10 20 10");
        const geometry = model.getCanvasGeometry();

        expect(geometry.targets.length).toBe(2);
        expect(geometry.controls.length).toBeGreaterThanOrEqual(2);
        expect(geometry.standaloneBySegment[1]).toContain("C");
    });

    it("updates points, inserts, converts and deletes commands", () => {
        const model = new SvgPathModel("M 0 0 L 10 10");
        const geometryBefore = model.getCanvasGeometry();
        const target = geometryBefore.targets.find((it) => it.segmentIndex === 1);
        expect(target).toBeTruthy();

        model.setCanvasPointLocation(target!, { x: 15, y: 5 });
        expect(model.toString(3, false)).toContain("15 5");

        const insertedIndex = model.insertSegment("Q", 1);
        expect(insertedIndex).toBe(2);
        expect(model.getCommandCount()).toBe(3);

        const converted = model.changeSegmentType(2, "c");
        expect(converted).toBe(true);
        expect(model.getSummaries()[2].command).toBe("c");

        model.toggleSegmentRelative(2);
        expect(model.getSummaries()[2].command).toBe("C");

        model.deleteSegment(2);
        expect(model.getCommandCount()).toBe(2);
    });

    it("enforces command-context guards for insert and convert", () => {
        const model = new SvgPathModel("M 0 0 L 10 0");

        expect(model.canInsertAfter(0, "L")).toBe(true);
        expect(model.canInsertAfter(0, "T")).toBe(false);
        expect(model.canInsertAfter(0, "S")).toBe(false);

        expect(model.canConvert(0, "L")).toBe(false);
        expect(model.canConvert(1, "L")).toBe(true);
        expect(model.canConvert(1, "T")).toBe(false);
    });

    it("translates selected segment ranges while preserving connected anchors", () => {
        const model = new SvgPathModel("M 0 0 L 10 10 L 20 20");

        model.translateSegments([1, 2], 5, -5);

        expect(model.toString(3, false)).toBe("M 5 -5 L 15 5 L 25 15");
    });

    it("translates selected segments without changing relative commands", () => {
        const model = new SvgPathModel("M 0 0 l 10 10 C 10 0 10 10 20 10");

        model.translateSegments([1, 2], 5, 5);

        expect(model.toString(3, false)).toBe("M 5 5 l 10 10 C 15 5 15 15 25 15");
    });
});
