import { describe, expect, it } from "vitest";
import { findSvgInputNodeById, parseSvgInputText, serializeSvgInputDocument } from "./3-svg-input";

describe("parseSvgInputText", () => {
    it("parses an SVG document into a nested element tree", () => {
        const parsed = parseSvgInputText(`
            <svg viewBox="0 0 24 24">
                <g id="layer-a">
                    <path d="M 0 0 L 4 4" fill="none" />
                </g>
                <circle cx="6" cy="7" r="2" />
            </svg>
        `);

        expect(parsed.document.sourceKind).toBe("svg-document");
        expect(parsed.document.root.tagName).toBe("svg");
        expect(parsed.document.root.children).toHaveLength(2);
        expect(parsed.initialPathData).toBeNull();

        const group = findSvgInputNodeById(parsed.document.root, "0.0");
        const path = findSvgInputNodeById(parsed.document.root, "0.0.0");

        expect(group?.tagName).toBe("g");
        expect(path?.tagName).toBe("path");
        expect(path?.pathData).toBe("M 0 0 L 4 4");
    });

    it("extracts initial path data from a pasted path element", () => {
        const parsed = parseSvgInputText(`<path fill="none" stroke="#000" d="M 1 1 L 2 2" />`);

        expect(parsed.document.sourceKind).toBe("path-element");
        expect(parsed.document.root.tagName).toBe("path");
        expect(parsed.initialPathData).toBe("M 1 1 L 2 2");
        expect(parsed.document.root.attributes.some((attribute) => attribute.name === "fill")).toBe(true);
        expect(parsed.document.root.attributes.some((attribute) => attribute.name === "stroke")).toBe(true);
    });

    it("treats path data and d attributes as a synthetic path node", () => {
        const fromAttribute = parseSvgInputText(`d="M 3 3 L 4 4"`);
        const fromPlainValue = parseSvgInputText(`M 5 5 L 6 6`);

        expect(fromAttribute.document.sourceKind).toBe("path-data");
        expect(fromAttribute.document.root.pathData).toBe("M 3 3 L 4 4");
        expect(fromPlainValue.document.root.tagName).toBe("path");
        expect(fromPlainValue.initialPathData).toBe("M 5 5 L 6 6");
    });

    it("serializes nested SVG input documents back to markup", () => {
        const parsed = parseSvgInputText(`
            <svg viewBox="0 0 24 24">
                <g id="layer-a">
                    <path d="M 0 0 L 4 4" fill="none" />
                </g>
                <circle cx="6" cy="7" r="2" />
            </svg>
        `);

        expect(serializeSvgInputDocument(parsed.document)).toBe([
            `<svg viewBox="0 0 24 24">`,
            `  <g id="layer-a">`,
            `    <path d="M 0 0 L 4 4" fill="none" />`,
            `  </g>`,
            `  <circle cx="6" cy="7" r="2" />`,
            `</svg>`,
        ].join("\n"));
    });

    it("serializes synthetic path input as a path element", () => {
        const parsed = parseSvgInputText(`M 5 5 L 6 6`);

        expect(serializeSvgInputDocument(parsed.document)).toBe(`<path d="M 5 5 L 6 6" />`);
    });
});