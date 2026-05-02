import { atom } from "jotai";
import { appSettings } from "@/store/0-ui-settings";
import { svgPathInputAtom } from "../../../store/0-atoms/1-1-svg-path-input";
import { pathViewBoxAtom } from "../../../store/0-atoms/2-2-path-viewbox";
import { svgInputDocumentAtom } from "@/store/0-atoms/1-3-svg-input";
import { buildExportSvgDocument } from "./a-2-export-source";
import { saveTextFile, exportSvgToFile } from "./a-3-export-utils";
import { generateReactComponentFromTemplate } from "./8-8-1-react-export-template";
import { generateReactComponentWithMarkupParser } from "./8-8-2-react-export-markup";
import { displayedExportSvgCodeAtom, exportDialogBusyAtom, exportReactComponentErrorAtom, exportReactComponentNoticeAtom, viewBoxDraftAtom } from "./8-0-dialog-export-atoms";

export const doExportFromDialogAtom = atom(
    null,
    async (get, set) => {
        set(exportDialogBusyAtom, true);
        set(exportReactComponentErrorAtom, "");
        set(exportReactComponentNoticeAtom, "");

        try {
            if (appSettings.export.exportAsReactComponent) {
                const exportDocument = buildExportSvgDocument({
                    svgInputDocument: get(svgInputDocumentAtom),
                    pathValue: get(svgPathInputAtom),
                    pathViewBox: get(pathViewBoxAtom),
                    exportViewBoxDraft: get(viewBoxDraftAtom),
                    exportSettings: appSettings.export,
                });
                const generatorOptions = {
                    exportDocument,
                    pathName: appSettings.pathEditor.pathName,
                };
                const result = appSettings.export.reactComponentGenerator === "markup"
                    ? generateReactComponentWithMarkupParser(generatorOptions)
                    : generateReactComponentFromTemplate(generatorOptions);

                if (result.notice) {
                    set(exportReactComponentNoticeAtom, result.notice);
                }

                if (!result.code.trim()) {
                    set(exportReactComponentErrorAtom, result.error || "Failed to generate a React component export.");
                    return false;
                }

                return saveTextFile({ data: result.code, fileName: result.fileName, mimeType: "text/plain;charset=utf-8" });
            }

            return exportSvgToFile({ svgData: get(displayedExportSvgCodeAtom) });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to export.";
            set(exportReactComponentErrorAtom, message);
            return false;
        } finally {
            set(exportDialogBusyAtom, false);
        }
    },
);
