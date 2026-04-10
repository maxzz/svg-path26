import { type ReactNode } from "react";
import { atom } from "jotai";
import { type ViewBox } from "@/svg-core/9-types-svg-model";

export type UpdateViewBoxResult = {
    viewBox: ViewBox;
    scaleSvgElements: boolean;
};

export type UpdateViewBoxUi = {
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

export const doAsyncExecuteUpdateViewBoxDialogAtom = atom(
    null,
    async (_get, set, ui: UpdateViewBoxUi): Promise<UpdateViewBoxResult | null> => {
        return await new Promise<UpdateViewBoxResult | null>(
            (resolve) => {
                set(isOpenUpdateViewBoxDialogAtom, { ui, resolve });
            }
        );
    },
);