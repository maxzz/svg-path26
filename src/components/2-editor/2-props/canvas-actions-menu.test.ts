import { describe, expect, it } from "vitest";
import { computeExportViewBox } from "./8-helpers";

describe("computeExportViewBox", () => {
    it("computes bounds with stroke padding and falls back on invalid input", () => {
        const fallback = { x: 1, y: 2, width: 3, height: 4 };

        const computed = computeExportViewBox("M 0 0 L 10 20", 2, fallback);
        expect(computed).toEqual({
            x: -2,
            y: -2,
            width: 14,
            height: 24,
        });

        const fallbackResult = computeExportViewBox("not-a-path", 2, fallback);
        expect(fallbackResult).toBe(fallback);
    });
});
