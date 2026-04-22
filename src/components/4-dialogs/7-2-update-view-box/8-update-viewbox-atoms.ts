import { atom } from "jotai";
import { type UpdateViewBoxResult, doAsyncExecuteUpdateViewBoxDialogAtom } from "./9-types-update-view-box";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { doUpdateViewBoxAtom } from "@/store/1-atoms-commands/3-update-view-box";

export const doAsyncOpenUpdateViewBoxDialogAndApplyAtom = atom(
    null,
    async (get, set): Promise<UpdateViewBoxResult | null> => {
        const currentViewBox = get(pathViewBoxAtom);
        const result = await set(doAsyncExecuteUpdateViewBoxDialogAtom, {
            title: "Update View Box",
            description: "Update the viewBox and optionally scale the current SVG elements into the new coordinates.",
            buttonApply: "Apply",
            buttonCancel: "Cancel",
            initialViewBox: currentViewBox,
            initialScaleSvgElements: true,
        });

        if (!result) {
            return null;
        }

        const applied = set(doUpdateViewBoxAtom, {
            nextViewBox: result.viewBox,
            scaleSvgElements: result.scaleSvgElements,
        });

        return applied ? result : null;
    },
);
