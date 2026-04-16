import { atom } from "jotai";
import { subscribe } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type PathEditorSettings } from "@/store/9-ui-settings-types-and-defaults";

export function createAtomAppSetting<Key extends keyof PathEditorSettings>(key: Key): PA<PathEditorSettings[Key]> {
    const baseAtom = atom(appSettings.pathEditor[key]);

    baseAtom.onMount = (setValue) => {
        setValue(appSettings.pathEditor[key]);

        //TODO: optimize this by subscribing only to the specific property instead of the whole appSettings object. use subscribeKey() from valtio/utils when valtio updates to 2.0, which supports subscribeKey().
        return subscribe(appSettings,
            () => {
                setValue(appSettings.pathEditor[key]);
            }
        );
    };

    return atom(
        (get) => get(baseAtom),
        (get, set, update: SetStateAction<PathEditorSettings[Key]>) => {
            const current = get(baseAtom);
            const nextValue = typeof update === "function"
                ? (update as (previous: PathEditorSettings[Key]) => PathEditorSettings[Key])(current)
                : update;

            appSettings.pathEditor[key] = nextValue;
            set(baseAtom, nextValue);
        }
    );
}
