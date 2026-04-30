import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "jotai";
import { parseSvgInputText } from "@/svg-core/3-svg-input";
import { appSettings } from "@/store/0-ui-settings";
import { DEFAULT_EXPORT_SETTINGS, DEFAULT_PATH_EDITOR_SETTINGS } from "@/store/9-ui-settings-types-and-defaults";
import { buildExportSvgDocument } from "./9-export-source";
import { prepareReactExport } from "./10-react-export-common";
import { generateReactComponentFromTemplate } from "./11-react-export-template";
import { generateReactComponentWithMarkupParser } from "./12-react-export-markup";
import { doSetExportAsReactComponentAtom, doSetReactComponentGeneratorAtom } from "./8-dialog-export-atoms";

describe("react export helpers", () => {
    beforeEach(() => {
        localStorage.clear();
        Object.assign(appSettings.export, {
            ...DEFAULT_EXPORT_SETTINGS,
            svgo: {
                ...DEFAULT_EXPORT_SETTINGS.svgo,
                presetDefault: { ...DEFAULT_EXPORT_SETTINGS.svgo.presetDefault },
            },
        });
        appSettings.pathEditor.pathName = DEFAULT_PATH_EDITOR_SETTINGS.pathName;
    });

    it("builds an SVG document from raw path input when no SVG tree exists", () => {
        const exportDocument = buildExportSvgDocument({
            svgInputDocument: null,
            pathValue: "M 0 0 L 10 10",
            pathViewBox: [0, 0, 24, 24],
            exportViewBoxDraft: [1, 2, 30, 40],
            exportSettings: {
                ...DEFAULT_EXPORT_SETTINGS,
                exportStroke: true,
                exportStrokeColor: "#ff0000",
                exportStrokeWidth: 2,
            },
        });

        expect(exportDocument.root.tagName).toBe("svg");
        expect(exportDocument.root.attributes.find((attribute) => attribute.name === "viewBox")?.value).toBe("1 2 30 40");

        const pathNode = exportDocument.root.children[0];
        expect(pathNode?.tagName).toBe("path");
        expect(pathNode?.attributes.find((attribute) => attribute.name === "d")?.value).toBe("M 0 0 L 10 10");
        expect(pathNode?.attributes.find((attribute) => attribute.name === "fill")?.value).toBe("#000000");
        expect(pathNode?.attributes.find((attribute) => attribute.name === "stroke")?.value).toBe("#ff0000");
        expect(pathNode?.attributes.find((attribute) => attribute.name === "stroke-width")?.value).toBe("2");
    });

    it("hoists shared path attributes to the root SVG and converts them to Tailwind classes", () => {
        const parsed = parseSvgInputText(`
            <svg viewBox="0 0 24 24">
                <path d="M 0 0 L 4 4" fill="#123456" stroke="none" stroke-width="2" />
                <path d="M 8 8 L 12 12" fill="#123456" stroke="none" stroke-width="2" />
            </svg>
        `);

        const preparedExport = prepareReactExport({
            exportDocument: parsed.document,
            pathName: "Camera Icon",
        });

        expect(preparedExport.fileBaseName).toBe("camera-icon");
        expect(preparedExport.componentName).toBe("CameraIcon");
        expect(preparedExport.exportDocument.root.attributes.find((attribute) => attribute.name === "class")?.value).toContain("[fill:#123456]");
        expect(preparedExport.exportDocument.root.attributes.find((attribute) => attribute.name === "class")?.value).toContain("stroke-none");
        expect(preparedExport.exportDocument.root.attributes.find((attribute) => attribute.name === "class")?.value).toContain("[stroke-width:2]");
        expect(preparedExport.exportDocument.root.children.every((child) => child.attributes.every((attribute) => !["fill", "stroke", "stroke-width"].includes(attribute.name)))).toBe(true);
    });

    it("converts style declarations into Tailwind classes for React export", () => {
        const parsed = parseSvgInputText(`
            <svg viewBox="0 0 24 24">
                <path d="M 0 0 L 4 4" style="mix-blend-mode:multiply; isolation:isolate;" />
            </svg>
        `);

        const preparedExport = prepareReactExport({
            exportDocument: parsed.document,
            pathName: "styled icon",
        });

        const pathClassName = preparedExport.exportDocument.root.children[0]?.attributes.find((attribute) => attribute.name === "class")?.value ?? "";
        expect(pathClassName).toContain("[mix-blend-mode:multiply]");
        expect(pathClassName).toContain("[isolation:isolate]");
    });

    it("generates template-based TSX without dangerouslySetInnerHTML and with a lowercase file name", () => {
        const parsed = parseSvgInputText(`<svg viewBox="0 0 24 24"><path d="M 0 0 L 4 4" fill="#000" /></svg>`);

        const result = generateReactComponentFromTemplate({
            exportDocument: parsed.document,
            pathName: "CamelCase Icon",
        });

        expect(result.fileName).toBe("camel-case-icon.tsx");
        expect(result.componentName).toBe("CamelCaseIcon");
        expect(result.code).toContain("export function CamelCaseIcon");
        expect(result.code).not.toContain("dangerouslySetInnerHTML");
    });

    it("generates React output for the option-4 markup-parser path without external calls", () => {
        const parsed = parseSvgInputText(`<svg viewBox="0 0 24 24"><path d="M 0 0 L 4 4" fill="#000" /></svg>`);

        const result = generateReactComponentWithMarkupParser({
            exportDocument: parsed.document,
            pathName: "Async Icon",
        });

        expect(result.fileName).toBe("async-icon.tsx");
        expect(result.code.trim().length).toBeGreaterThan(0);
        expect(result.code).toContain("export");
    });

    it("persists the React export settings through the export action atoms", async () => {
        vi.useFakeTimers();

        try {
            const store = createStore();
            store.set(doSetExportAsReactComponentAtom, true);
            store.set(doSetReactComponentGeneratorAtom, "markup");

            expect(appSettings.export.exportAsReactComponent).toBe(true);
            expect(appSettings.export.reactComponentGenerator).toBe("markup");

            await vi.advanceTimersByTimeAsync(150);

            const storedSettings = localStorage.getItem("svg-path26__v4") ?? "";
            expect(storedSettings).toContain('"exportAsReactComponent":true');
            expect(storedSettings).toContain('"reactComponentGenerator":"markup"');
        } finally {
            await vi.runOnlyPendingTimersAsync();
            vi.useRealTimers();
        }
    });
});