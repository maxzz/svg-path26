import { atom } from "jotai";
import { subscribe } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { type ExportSettings, type PathEditorSettings } from "@/store/9-ui-settings-types-and-defaults";

export function createAtomAppSetting<Key extends keyof PathEditorSettings>(key: Key): PA<PathEditorSettings[Key]> {
    const baseAtom = atom(appSettings.pathEditor[key]);

    baseAtom.onMount = (setValue) => {
        setValue(appSettings.pathEditor[key]);

        return subscribe(appSettings, () => {
            setValue(appSettings.pathEditor[key]);
        });
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

export function createAtomAppExportSetting<Key extends keyof ExportSettings>(key: Key): PA<ExportSettings[Key]> {
    const baseAtom = atom(appSettings.export[key]);

    baseAtom.onMount = (setValue) => {
        setValue(appSettings.export[key]);

        return subscribe(appSettings, () => {
            setValue(appSettings.export[key]);
        });
    };

    return atom(
        (get) => get(baseAtom),
        (get, set, update: SetStateAction<ExportSettings[Key]>) => {
            const current = get(baseAtom);
            const nextValue = typeof update === "function"
                ? (update as (previous: ExportSettings[Key]) => ExportSettings[Key])(current)
                : update;

            appSettings.export[key] = nextValue;
            set(baseAtom, nextValue);
        }
    );
}
