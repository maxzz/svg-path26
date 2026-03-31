import { AlertTriangle } from "lucide-react";
import { type ConfirmationUi } from "./2-7-confirmation-dialog";

const confirmOverwriteSavedPathMessages: ConfirmationUi = {
    title: "Overwrite saved path?",
    icon: <AlertTriangle className="size-4" />,
    message: "",
    buttonOk: "Overwrite",
    buttonCancel: "Cancel",
    isDafaultOk: false,
};

export function getConfirmOverwriteSavedPathMessages(name: string): ConfirmationUi {
    return {
        ...confirmOverwriteSavedPathMessages,
        message: (
            <>
                A saved path named <span className="font-medium text-foreground">{name}</span> already exists.
                Save will replace its stored path data and update timestamp.
            </>
        ),
    };
}