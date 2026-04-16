import { atom } from "jotai";
import { subscribeKey } from "valtio/utils";
import { appSettings } from "@/store/0-ui-settings";
import { type PathEditorSettings } from "@/store/9-ui-settings-types-and-defaults";

export function createAtomAppSetting<Key extends keyof PathEditorSettings>(key: Key): PA<PathEditorSettings[Key]> {
    const baseAtom = atom(appSettings.pathEditor[key]);

    baseAtom.onMount = (setValue) => {
        setValue(appSettings.pathEditor[key]);

        return subscribeKey(appSettings.pathEditor, key, (value) => {
            setValue(value);
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

/*
1. 8-create-atom-app-settings.ts (7-34) How to optimize this function to use subscribeKey

Got it. I’ll (1) inspect how appSettings / pathEditor is defined, (2) switch the mount subscription from subscribe(appSettings, …) to subscribeKey(appSettings.pathEditor, key, …) so updates only fire for that setting, then (3) run a quick lint check on the touched file.

Nice — you already have subscribeKey imported and valtio’s typings confirm it does exactly what you want (fires only when that key changes). Next I’ll confirm appSettings.pathEditor is the proxy you expect, then swap the subscription and drop the now-unneeded subscribe import.

Now the atom mounts will only listen to changes on appSettings.pathEditor[key] (instead of any change anywhere in appSettings). Next I’ll run a lint/type check pass on this file to make sure the imports/types are clean.

Use subscribeKey on pathEditor
Swap the broad subscribe(appSettings, …) for a keyed subscription on appSettings.pathEditor:

import { atom } from "jotai";
import { subscribeKey } from "valtio/utils";
import { appSettings } from "@/store/0-ui-settings";
import { type PathEditorSettings } from "@/store/9-ui-settings-types-and-defaults";
export function createAtomAppSetting<Key extends keyof PathEditorSettings>(key: Key): PA<PathEditorSettings[Key]> {
    const baseAtom = atom(appSettings.pathEditor[key]);
    baseAtom.onMount = (setValue) => {
        setValue(appSettings.pathEditor[key]);
        return subscribeKey(appSettings.pathEditor, key, (value) => {
            setValue(value);
        });
    };
This makes the atom update only when that specific pathEditor[key] changes, instead of on every appSettings change.

2. Check all places is that safe to use new implementation of createAtomAppSetting with different params.

Good call. The signature didn’t change, but subscribeKey can behave differently for object/array settings depending on how they’re mutated. I’ll enumerate every createAtomAppSetting(...) callsite, check which keys they use, and verify those keys are updated in a way that still triggers subscribeKey reliably.

So far createAtomAppSetting is only used for strokeWidth, rawPath, and viewBox. The only potentially risky one with subscribeKey is viewBox (array/tuple) if anything mutates it in-place. Next I’ll scan all writes to pathEditor.viewBox to confirm it’s always replaced as a whole.

Where createAtomAppSetting(...) is used
Repo-wide, it’s only called in 3 places, and all still match the function signature:

src/store/0-atoms/2-4-0-editor-actions.ts → createAtomAppSetting("strokeWidth")
src/store/0-atoms/2-2-path-viewbox.ts → createAtomAppSetting("viewBox")
src/store/0-atoms/1-0-raw-path.ts → createAtomAppSetting("rawPath")
So no callsite needs parameter changes.

Is the new subscribeKey behavior safe for those keys?
Yes:

strokeWidth (number) and rawPath (string) are primitives → subscribeKey is safe.
viewBox is an array/tuple → subscribeKey only fires when the viewBox reference changes (not when mutated in-place). I checked the codebase and there are no in-place writes like appSettings.pathEditor.viewBox[0] = ...; updates go through atoms that replace the whole array, so it’s safe.
Important note if you use it with “other params” later
subscribeKey won’t react to in-place mutations of objects/arrays (e.g. .push, arr[0]=...). For the only other non-primitive in PathEditorSettings (storedPaths), your code already uses immutable updates (filter/map/spread), so it would also be safe if you add createAtomAppSetting("storedPaths") later—as long as you keep that pattern.
*/

/*
Old version with subscribe(appSettings, ...)

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
*/
