import { describe, expect, it } from "vitest";
import { computeExportViewBox } from "./2-panel-commands/8-helpers";
import { type ViewBox } from "@/store/9-ui-settings-types-and-defaults";

describe("computeExportViewBox", () => {
    it("computes bounds with stroke padding and falls back on invalid input", () => {
        const fallback: ViewBox = [1, 2, 3, 4];

        const computed = computeExportViewBox("M 0 0 L 10 20", 2, fallback);
        expect(computed).toEqual([-2, -2, 14, 24]);

        const fallbackResult = computeExportViewBox("not-a-path", 2, fallback);
        expect(fallbackResult).toBe(fallback);
    });
});
