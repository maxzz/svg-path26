import { atom } from "jotai";
import { doClearPathAtom, doNormalizePathAtom, doSetAbsoluteAtom, doSetRelativeAtom } from "@/store/0-atoms/2-4-editor-actions";
import { aboutDialogOpenAtom, exportSvgDialogOpenAtom, openPathDialogOpenAtom, savePathDialogOpenAtom } from "@/store/0-atoms/4-0-dialogs-atoms";
import { isImageEditModeAtom } from "@/store/0-atoms/2-8-images";
import { svgPathInputAtom } from "@/store/0-atoms/1-1-svg-path-input";
import { appSettings } from "@/store/0-ui-settings";
import { toggleTheme } from "@/utils";

export const doHandleTopMenuKeyDownAtom = atom(
    null,
    (get, set, event: KeyboardEvent) => {
        const target = event.target;
        if (isEditableTarget(target)) return;

        const key = event.key.toLowerCase();
        const withPrimary = event.ctrlKey || event.metaKey;
        const withAltOnly = event.altKey && !withPrimary && !event.shiftKey;
        const hasPath = Boolean(get(svgPathInputAtom).trim());

        if (withPrimary && !event.shiftKey && key === "o") {
            event.preventDefault();
            set(openPathDialogOpenAtom, true);
            return;
        }
        if (withPrimary && !event.shiftKey && key === "s") {
            event.preventDefault();
            set(savePathDialogOpenAtom, true);
            return;
        }
        if (withPrimary && !event.shiftKey && key === "e") {
            if (!hasPath) return;
            event.preventDefault();
            set(exportSvgDialogOpenAtom, true);
            return;
        }
        if (withPrimary && !event.shiftKey && key === "h") {
            event.preventDefault();
            set(aboutDialogOpenAtom, true);
            return;
        }
        if (!withAltOnly) return;

        if (key === "n") {
            if (!hasPath) return;
            event.preventDefault();
            set(doNormalizePathAtom);
            return;
        }
        if (key === "a") {
            if (!hasPath) return;
            event.preventDefault();
            set(doSetAbsoluteAtom);
            return;
        }
        if (key === "r") {
            if (!hasPath) return;
            event.preventDefault();
            set(doSetRelativeAtom);
            return;
        }
        if (key === "m") {
            if (!hasPath) return;
            event.preventDefault();
            appSettings.pathEditor.minifyOutput = !appSettings.pathEditor.minifyOutput;
            set(doNormalizePathAtom);
            return;
        }
        if (key === "d") {
            event.preventDefault();
            appSettings.canvas.darkCanvas = !appSettings.canvas.darkCanvas;
            return;
        }
        if (key === "i") {
            event.preventDefault();
            set(isImageEditModeAtom, !get(isImageEditModeAtom));
            return;
        }
        if (key === "t") {
            event.preventDefault();
            toggleTheme(appSettings.theme);
            return;
        }
        if (key === "c") {
            if (!hasPath) return;
            event.preventDefault();
            void navigator.clipboard.writeText(get(svgPathInputAtom));
            return;
        }
        if (key === "x") {
            if (!hasPath) return;
            event.preventDefault();
            set(doClearPathAtom);
        }
    }
);

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;

    const tagName = target.tagName;
    return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}