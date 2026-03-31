import { type ReactNode } from "react";
import { atom } from "jotai";

type ConfirmationButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

export interface ConfirmationDialogState {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: ConfirmationButtonVariant;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
}

const confirmationDialogBaseAtom = atom<ConfirmationDialogState | null>(null);

export const confirmationDialogAtom = atom(
    (get) => get(confirmationDialogBaseAtom),
);

export const doOpenConfirmationDialogAtom = atom(
    null,
    (_get, set, options: ConfirmationDialogState) => {
        set(confirmationDialogBaseAtom, {
            confirmLabel: "OK",
            cancelLabel: "Cancel",
            confirmVariant: "default",
            ...options,
        });
    },
);

export const doCloseConfirmationDialogAtom = atom(
    null,
    (get, set, args?: { confirmed?: boolean; }) => {
        const dialog = get(confirmationDialogBaseAtom);
        set(confirmationDialogBaseAtom, null);
        if (!dialog) return;

        if (args?.confirmed) {
            void dialog.onConfirm?.();
            return;
        }

        void dialog.onCancel?.();
    },
);