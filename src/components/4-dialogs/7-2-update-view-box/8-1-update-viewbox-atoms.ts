import { type ReactNode } from "react";
import { atom } from "jotai";
import { type ViewBox } from "@/svg-core/9-types-svg-model";
import { pathViewBoxAtom } from "@/store/0-atoms/2-2-path-viewbox";
import { doUpdateViewBoxAtom } from "@/components/4-dialogs/7-2-update-view-box/8-2-do-update-view-box";

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

//

export type UpdateViewBoxResult = {
    viewBox: ViewBox;
    scaleSvgElements: boolean;
};

type UpdateViewBoxUi = {
    title: string;
    description?: ReactNode;
    buttonApply: string;
    buttonCancel: string;
    initialViewBox: ViewBox;
    initialScaleSvgElements: boolean;
};

export type UpdateViewBoxData = {
    ui: UpdateViewBoxUi;
    resolve: (result: UpdateViewBoxResult | null) => void;
};

export const isOpenUpdateViewBoxDialogAtom = atom<UpdateViewBoxData | undefined>(undefined);

export const doAsyncExecuteUpdateViewBoxDialogAtom = atom( // Exporst for testing purposes only
    null,
    async (_get, set, ui: UpdateViewBoxUi): Promise<UpdateViewBoxResult | null> => {
        return await new Promise<UpdateViewBoxResult | null>(
            (resolve) => {
                set(isOpenUpdateViewBoxDialogAtom, { ui, resolve });
            }
        );
    },
);

//