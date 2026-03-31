import { describe, expect, it } from "vitest";
import { applyCommandSelection, getCommandSelectionMode, getMarqueeSelectionMode, remapSelectedIndicesAfterDelete } from "./2-5-editor-selection-utils";

describe("editor selection utils", () => {
    it("applies replace, add, and remove selection modes", () => {
        expect(applyCommandSelection([1, 3], [2], "replace")).toEqual([2]);
        expect(applyCommandSelection([1, 3], [3, 4], "add")).toEqual([1, 3, 4]);
        expect(applyCommandSelection([1, 3, 4], [3, 7], "remove")).toEqual([1, 4]);
    });

    it("remaps surviving selections after deleting indices", () => {
        expect(remapSelectedIndicesAfterDelete([0, 2, 5], [1, 4])).toEqual([0, 1, 3]);
        expect(remapSelectedIndicesAfterDelete([0, 1, 2], [1, 2])).toEqual([0]);
    });

    it("maps modifiers to additive and subtractive selection modes", () => {
        expect(getCommandSelectionMode({ shiftKey: false, ctrlKey: false, metaKey: false })).toBe("replace");
        expect(getCommandSelectionMode({ shiftKey: true, ctrlKey: false, metaKey: false })).toBe("add");
        expect(getCommandSelectionMode({ shiftKey: false, ctrlKey: true, metaKey: false })).toBe("remove");
        expect(getCommandSelectionMode({ shiftKey: false, ctrlKey: false, metaKey: true })).toBe("remove");
    });

    it("requires shift to start marquee selection", () => {
        expect(getMarqueeSelectionMode({ shiftKey: false, ctrlKey: false, metaKey: false })).toBeNull();
        expect(getMarqueeSelectionMode({ shiftKey: true, ctrlKey: false, metaKey: false })).toBe("add");
        expect(getMarqueeSelectionMode({ shiftKey: true, ctrlKey: true, metaKey: false })).toBe("remove");
        expect(getMarqueeSelectionMode({ shiftKey: true, ctrlKey: false, metaKey: true })).toBe("remove");
    });
});
